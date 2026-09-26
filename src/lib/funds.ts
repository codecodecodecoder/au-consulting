/** Funds available in the portal. Names must match user_funds.fund_name. */
export const FUNDS = ["AU Consulting", "IR Capital"] as const;
export type FundName = (typeof FUNDS)[number];

/** Sentinel value for the "all my funds" view in the dashboard. */
export const COMBINED = "__combined__";

/** Indian-style currency formatting: ₹4.25 Cr, ₹75.00 L, ₹12,500. */
export function formatINR(value: number): string {
    const sign = value < 0 ? "-" : "";
    const n = Math.abs(value);
    if (n >= 1e7) return `${sign}₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `${sign}₹${(n / 1e5).toFixed(2)} L`;
    return `${sign}₹${Math.round(n).toLocaleString("en-IN")}`;
}
