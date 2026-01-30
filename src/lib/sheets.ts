import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Config variables
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Fix for env variable newlines

export async function fetchDashboardData() {
    if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        throw new Error('Google Sheets credentials missing from environment variables');
    }

    // Initialize Auth
    const serviceAccountAuth = new JWT({
        email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: GOOGLE_PRIVATE_KEY,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);

    try {
        await doc.loadInfo(); // loads document properties and worksheets

        // helper to clean row data
        const getRows = async (sheetIndex: number) => {
            const sheet = doc.sheetsByIndex[sheetIndex];
            if (!sheet) return [];
            const rows = await sheet.getRows();
            return rows.map(row => row.toObject());
        };

        // ASSUMPTION: 
        // Tab 0: Holdings (Companies)
        // Tab 1: Cashflow In (Inflows)
        // Tab 2: Cashflow Out (Outflows)
        // Tab 3: LPs (Limited Partners)
        // This mapping might need adjustment based on actual sheet order

        // Let's try to find sheets by name if possible, otherwise index
        const sheets = doc.sheetsByIndex;

        // Mapping Logic (Robust check)
        const holdingsSheet = sheets.find(s => s.title.toLowerCase().includes('holdings') || s.title.toLowerCase().includes('portfolio')) || sheets[0];
        const cashInSheet = sheets.find(s => s.title.toLowerCase().includes('inflow') || s.title.toLowerCase().includes('cash in')) || sheets[1];
        const cashOutSheet = sheets.find(s => s.title.toLowerCase().includes('outflow') || s.title.toLowerCase().includes('cash out')) || sheets[2];
        const lpSheet = sheets.find(s => s.title.toLowerCase().includes('lp') || s.title.toLowerCase().includes('partners')) || sheets[3];

        const [holdingsRaw, inflowsRaw, outflowsRaw, lpsRaw] = await Promise.all([
            holdingsSheet ? holdingsSheet.getRows() : [],
            cashInSheet ? cashInSheet.getRows() : [],
            cashOutSheet ? cashOutSheet.getRows() : [],
            lpSheet ? lpSheet.getRows() : []
        ]);

        // Transform Data
        const portfolioData = holdingsRaw.map((row, i) => ({
            id: i,
            name: row.get('Company') || row.get('name') || "Unknown",
            sector: row.get('Sector') || "Tech",
            stage: row.get('Stage') || "Seed",
            invested: row.get('Invested') || "0",
            valuation: row.get('Valuation') || "0",
            status: row.get('Status') || "Active",
            trend: row.get('Trend') || "0%"
        }));

        const inflowData = inflowsRaw.map(row => ({
            date: row.get('Date') || "",
            source: row.get('Source') || "",
            capital: row.get('Capital Called') || row.get('Capital') || "0"
        }));

        const outflowData = outflowsRaw.map(row => ({
            date: row.get('Date') || "",
            company: row.get('Company') || "",
            ticker: row.get('Ticker') || "",
            amount: row.get('Amount') || "0"
        }));

        const lpData = lpsRaw.map(row => ({
            name: row.get('LP Name') || row.get('Name') || "Unknown",
            status: row.get('Status') || "Active",
            contribution: row.get('Contribution') || "0",
            percent: row.get('Ownership %') || row.get('Percent') || "0%"
        }));

        return {
            portfolioData,
            inflowData,
            outflowData,
            lpData
        };

    } catch (error) {
        console.error('Data Fetch Error:', error);
        return null;
    }
}
