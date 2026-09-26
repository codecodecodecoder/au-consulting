// Configuration
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY!;
const SPREADSHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID!;

export async function fetchGoogleSheetsData(fundName: string = "IR Capital") {
    try {
        // Map "AU Consulting" -> "AU Capital" sheet name
        const sheetName = fundName === "AU Consulting" ? "AU Capital" : fundName;

        // Ranges based on User Request:
        // 1. Portfolio (Holdings): AA to AJ (Extended to include FMV and Co-Investors)
        // 2. Cashflow: N to U
        // 3. Summary: W to Y
        // 4. LPs: A to J

        // We use Open-Ended ranges (e.g. AA2:AJ) to read all rows.
        const ranges = [
            `'${sheetName}'!AA2:AJ`, // Index 0: Portfolio
            `'${sheetName}'!N2:U`,   // Index 1: Cashflow
            `'${sheetName}'!W2:Y`,   // Index 2: Summary
            `'${sheetName}'!A2:J`    // Index 3: LPs
        ];

        const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?key=${API_KEY}&ranges=${ranges.map(r => encodeURIComponent(r)).join('&ranges=')}`;

        const res = await fetch(batchUrl);
        if (!res.ok) {
            console.error(`Batch fetch failed: ${res.status} ${res.statusText}`);
            return null;
        }

        const json = await res.json();
        const valueRanges = json.valueRanges;

        // 1. Portfolio (AA-AJ)
        // Indices relative to AA:
        // 0(AA)=S.No, 1(AB)=Name, 2(AC)=Loc, 5(AF)=Desc, 6(AG)=Sector
        // 7(AH)=Invested Amount, 8(AI)=FMV, 9(AJ)=Co-Investors
        const rawPortfolio = valueRanges[0]?.values || [];
        const portfolioData = rawPortfolio
            .filter((row: string[]) => row[1] && row[1] !== "Company Name")
            .map((row: string[], i: number) => {
                const investedStr = row[7] || "0";
                const fmvStr = row[8] || "0";

                const investedVal = parseFloat(investedStr.replace(/,/g, '')) || 0;
                const fmvVal = parseFloat(fmvStr.replace(/,/g, '')) || 0;

                // Calculate Trend: ((FMV - Invested) / Invested) * 100
                let trend = "0%";
                if (investedVal > 0) {
                    const trendVal = ((fmvVal - investedVal) / investedVal) * 100;
                    trend = `${trendVal > 0 ? "+" : ""}${trendVal.toFixed(1)}%`;
                }

                return {
                    id: i + 1,
                    name: row[1] || "Unknown",
                    location: row[2] || "India",
                    description: row[5] || "",
                    sector: row[6] || "Tech",
                    investedNum: investedVal,
                    fmvNum: fmvVal,
                    invested: `₹${investedVal.toLocaleString()}`,
                    valuation: `₹${fmvVal.toLocaleString()}`, // FMV
                    status: "Active", // Default
                    trend: trend,
                    stage: "Seed" // Default
                };
            });

        // 2. Cashflow (N-U)
        // Indices relative to N: 0(N), 1(O), 2(P), 3(Q)... 6(T), 7(U)
        // Mapping Hypothesis (Shifted B-I to N-U):
        // N(0)=Date, O(1)=Desc, P(2)=Debit/Amount?, Q(3)=Credit?, T(6)=Type, U(7)=Category
        const rawBankData = valueRanges[1]?.values || [];
        const bankStatementData = rawBankData.map((row: string[], i: number) => ({
            id: i,
            date: row[0] || "",
            description: row[1] || "",
            // Logic: P(2) is Debit, Q(3) is Credit.
            // If P(2) exists, it's outflow (-). If Q(3), inflow (+).
            amount: row[2] && row[2] !== "0" && row[2] !== "" ? `-${row[2].replace(/,/g, '')}` : (row[3] ? row[3] : "0"),
            type: row[6] || "General",
            category: row[7] || "",
            fullRow: row
        })).filter((r: any) => r.date && r.amount && r.date !== "Date");

        // 3. Summary (W-Y)
        // Indices relative to W: 0(W), 1(X), 2(Y)
        // Heuristic: Label=0, Value=1 or 2
        const rawFundStatus = valueRanges[2]?.values || [];
        const fundStatusData = rawFundStatus.map((row: string[]) => {
            const label = row[0];
            let value = row[1] || "0";
            // If label has "Bank Balance", usually value is in the 3rd col (index 2)
            if (label && label.toLowerCase().includes("bank balance") && row[2]) {
                value = row[2];
            } else {
                value = row[1] || row[2] || "0";
            }
            return { label, value };
        }).filter((r: any) => r.label && r.label !== "Details");

        // 4. LPs (A-J)
        // Indices relative to A: 0(A)...9(J)
        // Mapping: A(0)=Name, G(6)=Contrib, H(7)=Due, J(9)=Percent
        const rawLpData = valueRanges[3]?.values || [];
        const lpData = rawLpData.map((row: string[]) => {
            const name = row[0];
            const contribution = row[6] || "0";
            const due = row[7] || "0";

            // Percentage: Column J (row[9])
            let percentStr = row[9] || "-";
            if (!percentStr.includes('%') && percentStr !== "-") {
                const pVal = parseFloat(percentStr);
                if (!isNaN(pVal)) {
                    if (pVal <= 1 && pVal > 0) percentStr = `${(pVal * 100).toFixed(2)}%`;
                    else percentStr = `${pVal}%`;
                }
            }

            const dueAmount = parseFloat(due.replace(/,/g, ''));
            const status = dueAmount > 0 ? "Call Pending" : "Active";

            return {
                name,
                contribution: `₹${contribution}`,
                status,
                percent: percentStr,
                due
            };
        }).filter((r: any) => r.name && r.name !== "Entity name");

        return {
            portfolioData,
            lpData,
            bankStatementData,
            fundStatusData
        };

    } catch (error) {
        console.error("Error fetching google sheets:", error);
        return null;
    }
}
