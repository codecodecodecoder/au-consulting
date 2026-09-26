"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
    Activity, ChevronDown, DollarSign, KeyRound, Layers, LayoutDashboard, LogOut,
    RefreshCw, Search, ShieldCheck, TrendingUp, Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchGoogleSheetsData } from "@/lib/sheets-api";
import { getSessionAndProfile, type Profile } from "@/lib/auth";
import { COMBINED, FUNDS, formatINR } from "@/lib/funds";
import { BrandMark, FullPageLoader } from "@/components/AuthShell";

// ── Types ────────────────────────────────────────────────────────────────────
type Holding = {
    id: number; name: string; location: string; sector: string;
    investedNum: number; fmvNum: number; fund: string;
};
type BankRow = { date: string; description: string; amount: string; type: string; category: string; fund: string };
type LpRow = { name: string; contribution: string; status: string; percent: string; fund: string };
type StatusRow = { label: string; value: string };
type FundData = { holdings: Holding[]; bank: BankRow[]; lps: LpRow[]; status: StatusRow[] };

const TABS = [
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "holdings", label: "Holdings", icon: LayoutDashboard },
    { id: "cashflow", label: "Cashflow", icon: DollarSign },
    { id: "lps", label: "LP Management", icon: Users },
] as const;
type TabId = (typeof TABS)[number]["id"];

const fade = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

function moic(invested: number, value: number) {
    return invested > 0 ? value / invested : 0;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userFunds, setUserFunds] = useState<string[]>([]);
    const [selected, setSelected] = useState<string>("");
    const [tab, setTab] = useState<TabId>("performance");
    const [data, setData] = useState<Record<string, FundData>>({});
    const [failed, setFailed] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [search, setSearch] = useState("");
    const [cashflowFilter, setCashflowFilter] = useState("All");

    // Auth + approval + fund access
    useEffect(() => {
        (async () => {
            const { session, profile } = await getSessionAndProfile();
            if (!session) return router.replace("/");
            if (!profile || profile.status !== "approved") {
                await supabase.auth.signOut();
                return router.replace("/");
            }
            let funds: string[];
            if (profile.is_admin) {
                funds = [...FUNDS];
            } else {
                const { data: rows } = await supabase.from("user_funds").select("fund_name").eq("user_id", session.user.id);
                funds = FUNDS.filter((f) => (rows ?? []).some((r) => r.fund_name === f));
            }
            setProfile(profile);
            setUserFunds(funds);
            setSelected(funds.length > 1 ? COMBINED : funds[0] ?? "");
        })();
    }, [router]);

    const loadData = useCallback(async (funds: string[]) => {
        if (funds.length === 0) return;
        setLoading(true);
        const results = await Promise.all(funds.map((f) => fetchGoogleSheetsData(f)));
        const next: Record<string, FundData> = {};
        const bad: string[] = [];
        results.forEach((r, i) => {
            const fund = funds[i];
            if (!r) return bad.push(fund);
            next[fund] = {
                holdings: r.portfolioData.map((h: Omit<Holding, "fund">) => ({ ...h, fund })),
                bank: r.bankStatementData.map((b: Omit<BankRow, "fund">) => ({ ...b, fund })),
                lps: r.lpData.map((l: Omit<LpRow, "fund">) => ({ ...l, fund })),
                status: r.fundStatusData,
            };
        });
        setData(next);
        setFailed(bad);
        setLastUpdated(new Date());
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData(userFunds);
    }, [userFunds, loadData]);

    // Funds shown in the current view
    const isCombined = selected === COMBINED;
    const viewFunds = useMemo(() => (isCombined ? userFunds : [selected]), [isCombined, userFunds, selected]);
    const view = useMemo(() => {
        const parts = viewFunds.map((f) => data[f]).filter(Boolean);
        return {
            holdings: parts.flatMap((p) => p.holdings),
            bank: parts.flatMap((p) => p.bank),
            lps: parts.flatMap((p) => p.lps),
        };
    }, [data, viewFunds]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/?notice=signed-out");
    };

    if (!profile) return <FullPageLoader label="Loading your portfolio…" />;

    const viewLabel = isCombined ? "All funds (combined)" : selected;

    const fundOptions = (
        <FundSelector funds={userFunds} value={selected} onChange={setSelected} />
    );

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex text-[#001A41]">
            {/* Sidebar (desktop) */}
            <aside className="w-72 bg-[#001A41] text-white p-6 hidden md:flex flex-col shadow-2xl z-20 shrink-0 sticky top-0 h-screen">
                <div className="mb-8">
                    <div className="mb-6"><BrandMark light /></div>
                    {fundOptions}
                </div>

                <nav className="space-y-1.5 flex-1">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={clsx(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all relative",
                                tab === t.id ? "bg-blue-600/20 text-blue-100" : "text-blue-200/60 hover:text-white hover:bg-white/5",
                            )}
                        >
                            {tab === t.id && <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />}
                            <t.icon size={18} className={tab === t.id ? "text-blue-400" : "text-blue-300/40"} />
                            {t.label}
                        </button>
                    ))}
                    {profile.is_admin && (
                        <Link href="/admin" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-blue-200/60 hover:text-white hover:bg-white/5">
                            <ShieldCheck size={18} className="text-blue-300/40" /> Investor access
                        </Link>
                    )}
                </nav>

                <div className="mt-auto pt-5 border-t border-blue-900/50 space-y-1">
                    <div className="px-4 py-2">
                        <p className="text-[10px] text-blue-200/40 uppercase tracking-widest font-bold">Signed in as</p>
                        <p className="text-blue-200/70 text-xs truncate mt-0.5">{profile.full_name || profile.email}</p>
                    </div>
                    <Link href="/reset-password" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-blue-200/60 hover:text-white hover:bg-white/5 text-sm font-medium">
                        <KeyRound size={16} /> Change password
                    </Link>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-blue-200/60 hover:text-red-400 hover:bg-red-500/10 text-sm font-medium">
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </aside>

            <div className="flex-1 min-w-0">
                {/* Mobile header */}
                <div className="md:hidden bg-[#001A41] text-white px-4 pt-4 pb-3 space-y-4">
                    <div className="flex items-center justify-between">
                        <BrandMark light />
                        <div className="flex items-center gap-1">
                            {profile.is_admin && (
                                <Link href="/admin" aria-label="Investor access" className="p-2 text-blue-200/70"><ShieldCheck size={20} /></Link>
                            )}
                            <Link href="/reset-password" aria-label="Change password" className="p-2 text-blue-200/70"><KeyRound size={20} /></Link>
                            <button onClick={handleSignOut} aria-label="Sign out" className="p-2 text-blue-200/70"><LogOut size={20} /></button>
                        </div>
                    </div>
                    {fundOptions}
                    <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={clsx("px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap", tab === t.id ? "bg-blue-600/30 text-white" : "text-blue-200/60")}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <main className="p-4 md:p-10 max-w-7xl">
                    <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">{viewLabel}</p>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{TABS.find((t) => t.id === tab)?.label}</h1>
                            {lastUpdated && (
                                <p className="text-xs text-zinc-400 mt-1">Synced {lastUpdated.toLocaleTimeString()}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {tab === "holdings" && (
                                <div className="relative flex-1 md:flex-none">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <input
                                        placeholder="Search companies…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="bg-white border border-zinc-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--primary)] w-full md:w-64 shadow-sm"
                                    />
                                </div>
                            )}
                            <button onClick={() => loadData(userFunds)} className="p-2 text-zinc-400 hover:text-[var(--primary)]" title="Reload data" aria-label="Reload data">
                                <RefreshCw size={20} className={clsx(loading && "animate-spin")} />
                            </button>
                        </div>
                    </header>

                    {userFunds.length === 0 ? (
                        <EmptyState text="Your account is approved but no funds have been assigned yet. Please contact the fund administrator." />
                    ) : (
                        <>
                            {failed.filter((f) => viewFunds.includes(f)).length > 0 && (
                                <div className="mb-6 p-3 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                                    Couldn&apos;t load data for {failed.filter((f) => viewFunds.includes(f)).join(", ")}. Try refreshing.
                                </div>
                            )}
                            {loading && Object.keys(data).length === 0 ? (
                                <div className="py-24"><FullPageLoaderInline /></div>
                            ) : (
                                <>
                                    {tab === "performance" && <PerformanceTab holdings={view.holdings} funds={viewFunds} data={data} combined={isCombined} />}
                                    {tab === "holdings" && <HoldingsTab holdings={view.holdings} search={search} combined={isCombined} />}
                                    {tab === "cashflow" && (
                                        <CashflowTab
                                            bank={view.bank}
                                            funds={viewFunds}
                                            data={data}
                                            combined={isCombined}
                                            filter={cashflowFilter}
                                            setFilter={setCashflowFilter}
                                        />
                                    )}
                                    {tab === "lps" && <LpTab lps={view.lps} combined={isCombined} />}
                                </>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

// ── Pieces ───────────────────────────────────────────────────────────────────
function FundSelector({ funds, value, onChange }: { funds: string[]; value: string; onChange: (v: string) => void }) {
    if (funds.length <= 1) {
        return (
            <div className="flex items-center gap-2.5 bg-[#0B254A] border border-blue-800/50 rounded-xl px-4 py-3">
                <Activity size={16} className="text-blue-300/70 shrink-0" />
                <span className="text-blue-100 text-sm font-medium">{funds[0] ?? "No fund assigned"}</span>
            </div>
        );
    }
    return (
        <div className="relative">
            <Layers size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/70 pointer-events-none" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label="Select fund"
                className="w-full appearance-none bg-[#0B254A] border border-blue-800/50 hover:border-blue-500/50 text-blue-100 text-sm font-medium py-3 pl-10 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
                <option value={COMBINED}>All funds (combined)</option>
                {funds.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/70 pointer-events-none" size={16} />
        </div>
    );
}

function FullPageLoaderInline() {
    return (
        <div className="flex flex-col items-center gap-3 text-zinc-400">
            <RefreshCw className="animate-spin" size={24} />
            <p className="text-sm">Loading fund data…</p>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-500">{text}</div>;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={clsx("bg-white rounded-xl border border-zinc-200 shadow-sm", className)}>{children}</div>;
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: React.ReactNode; accent?: string }) {
    return (
        <Card className="p-5">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">{label}</span>
            <span className={clsx("text-2xl md:text-3xl font-bold tracking-tight", accent ?? "text-[#001A41]")}>{value}</span>
            {sub && <div className="mt-2 text-xs font-medium text-slate-400">{sub}</div>}
        </Card>
    );
}

function FundTag({ fund }: { fund: string }) {
    return <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">{fund}</span>;
}

// ── Performance ──────────────────────────────────────────────────────────────
function PerformanceTab({ holdings, funds, data, combined }: { holdings: Holding[]; funds: string[]; data: Record<string, FundData>; combined: boolean }) {
    const invested = holdings.reduce((s, h) => s + h.investedNum, 0);
    const value = holdings.reduce((s, h) => s + h.fmvNum, 0);
    const gain = value - invested;
    const multiple = moic(invested, value);

    if (holdings.length === 0) return <EmptyState text="No holdings found for this view." />;

    const top = [...holdings].sort((a, b) => b.fmvNum - a.fmvNum).slice(0, 8);
    const maxTop = Math.max(...top.map((h) => Math.max(h.fmvNum, h.investedNum)), 1);

    const sectors = Object.entries(
        holdings.reduce<Record<string, number>>((acc, h) => {
            acc[h.sector] = (acc[h.sector] ?? 0) + h.fmvNum;
            return acc;
        }, {}),
    ).sort((a, b) => b[1] - a[1]);

    return (
        <motion.div {...fade} className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi label="Invested" value={formatINR(invested)} sub={`${holdings.length} companies`} />
                <Kpi label="Current value" value={formatINR(value)} sub="Fair market value" />
                <Kpi label="Multiple (MOIC)" value={`${multiple.toFixed(2)}x`} accent="text-blue-600" sub="Value ÷ invested" />
                <Kpi
                    label="Unrealised gain"
                    value={formatINR(gain)}
                    accent={gain >= 0 ? "text-emerald-600" : "text-red-600"}
                    sub={invested > 0 ? `${gain >= 0 ? "+" : ""}${((gain / invested) * 100).toFixed(1)}% on cost` : undefined}
                />
            </div>

            {combined && (
                <Card className="overflow-hidden">
                    <div className="p-5 border-b border-zinc-100">
                        <h3 className="font-bold">By fund</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                                <tr>
                                    <th className="p-4 text-left">Fund</th>
                                    <th className="p-4 text-right">Companies</th>
                                    <th className="p-4 text-right">Invested</th>
                                    <th className="p-4 text-right">Current value</th>
                                    <th className="p-4 text-right">MOIC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {funds.map((f) => {
                                    const hs = data[f]?.holdings ?? [];
                                    const inv = hs.reduce((s, h) => s + h.investedNum, 0);
                                    const val = hs.reduce((s, h) => s + h.fmvNum, 0);
                                    return (
                                        <tr key={f}>
                                            <td className="p-4 font-semibold">{f}</td>
                                            <td className="p-4 text-right tabular-nums">{hs.length}</td>
                                            <td className="p-4 text-right tabular-nums">{formatINR(inv)}</td>
                                            <td className="p-4 text-right tabular-nums font-semibold">{formatINR(val)}</td>
                                            <td className="p-4 text-right tabular-nums font-bold text-blue-600">{moic(inv, val).toFixed(2)}x</td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-zinc-50 font-bold">
                                    <td className="p-4">Total</td>
                                    <td className="p-4 text-right tabular-nums">{holdings.length}</td>
                                    <td className="p-4 text-right tabular-nums">{formatINR(invested)}</td>
                                    <td className="p-4 text-right tabular-nums">{formatINR(value)}</td>
                                    <td className="p-4 text-right tabular-nums text-blue-600">{multiple.toFixed(2)}x</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                        <h3 className="font-bold">Top holdings by value</h3>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-blue-600" /> Current value</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-blue-200" /> Invested</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {top.map((h) => (
                            <div key={`${h.fund}-${h.id}`}>
                                <div className="flex justify-between text-sm mb-1.5 gap-3">
                                    <span className="font-semibold truncate">
                                        {h.name}
                                        {combined && <span className="ml-2 font-normal text-xs text-zinc-400">{h.fund}</span>}
                                    </span>
                                    <span className="tabular-nums text-zinc-600 shrink-0">
                                        {formatINR(h.fmvNum)} <span className="text-blue-600 font-semibold ml-1">{moic(h.investedNum, h.fmvNum).toFixed(1)}x</span>
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(h.fmvNum / maxTop) * 100}%` }} />
                                    </div>
                                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-200 rounded-full" style={{ width: `${(h.investedNum / maxTop) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-bold mb-5">Value by sector</h3>
                    <div className="space-y-4">
                        {sectors.map(([sector, v]) => (
                            <div key={sector}>
                                <div className="flex justify-between text-sm mb-1.5 gap-3">
                                    <span className="text-zinc-600 truncate">{sector}</span>
                                    <span className="tabular-nums font-semibold shrink-0">{value > 0 ? ((v / value) * 100).toFixed(1) : "0"}%</span>
                                </div>
                                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${value > 0 ? (v / value) * 100 : 0}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </motion.div>
    );
}

// ── Holdings ─────────────────────────────────────────────────────────────────
function HoldingsTab({ holdings, search, combined }: { holdings: Holding[]; search: string; combined: boolean }) {
    const q = search.toLowerCase();
    const rows = holdings.filter((h) => h.name.toLowerCase().includes(q) || h.sector.toLowerCase().includes(q));
    return (
        <motion.div {...fade}>
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F8F9FB] text-xs uppercase text-[var(--muted-foreground)] font-bold tracking-wider">
                            <tr>
                                <th className="p-4 md:p-5">Company</th>
                                {combined && <th className="p-4 md:p-5">Fund</th>}
                                <th className="p-4 md:p-5">Sector</th>
                                <th className="p-4 md:p-5 text-right">Invested</th>
                                <th className="p-4 md:p-5 text-right">Current value</th>
                                <th className="p-4 md:p-5 text-right">Multiple</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {rows.map((h) => {
                                const m = moic(h.investedNum, h.fmvNum);
                                return (
                                    <tr key={`${h.fund}-${h.id}`} className="hover:bg-zinc-50">
                                        <td className="p-4 md:p-5">
                                            <div className="font-bold">{h.name}</div>
                                            <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mt-0.5">{h.location}</div>
                                        </td>
                                        {combined && <td className="p-4 md:p-5"><FundTag fund={h.fund} /></td>}
                                        <td className="p-4 md:p-5">
                                            <span className="inline-block px-2 py-1 bg-zinc-100 rounded text-xs font-semibold text-zinc-600 uppercase tracking-wide">{h.sector}</span>
                                        </td>
                                        <td className="p-4 md:p-5 text-right tabular-nums text-zinc-600 whitespace-nowrap">{formatINR(h.investedNum)}</td>
                                        <td className="p-4 md:p-5 text-right tabular-nums font-bold whitespace-nowrap">{formatINR(h.fmvNum)}</td>
                                        <td className={clsx("p-4 md:p-5 text-right tabular-nums font-bold", m > 1 ? "text-emerald-600" : m < 1 ? "text-red-500" : "text-zinc-500")}>
                                            {m.toFixed(2)}x
                                        </td>
                                    </tr>
                                );
                            })}
                            {rows.length === 0 && (
                                <tr><td colSpan={combined ? 6 : 5} className="p-10 text-center text-zinc-400">No companies match.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </motion.div>
    );
}

// ── Cashflow ─────────────────────────────────────────────────────────────────
function CashflowTab({
    bank, funds, data, combined, filter, setFilter,
}: {
    bank: BankRow[]; funds: string[]; data: Record<string, FundData>; combined: boolean;
    filter: string; setFilter: (v: string) => void;
}) {
    const types = Array.from(new Set(bank.map((b) => b.type).filter(Boolean)));
    const rows = bank.filter((b) => filter === "All" || b.type === filter);
    return (
        <motion.div {...fade} className="space-y-6">
            {funds.map((f) => {
                const status = data[f]?.status ?? [];
                if (status.length === 0) return null;
                return (
                    <Card key={f} className="p-6">
                        <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-zinc-500">
                            Fund status{combined && <> · <span className="text-[var(--primary)]">{f}</span></>}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {status.map((s, i) => (
                                <div key={i} className="bg-zinc-50 p-4 rounded-lg">
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-1">{s.label}</span>
                                    <span className={clsx("text-lg font-bold tabular-nums", s.value.includes("(") ? "text-red-500" : "text-[var(--primary)]")}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                );
            })}

            <Card className="overflow-hidden">
                <div className="p-5 border-b border-zinc-100 flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <h3 className="font-bold">Bank statement</h3>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        aria-label="Filter by type"
                        className="text-sm border border-zinc-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:border-[var(--primary)]"
                    >
                        <option value="All">All transactions</option>
                        {types.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 font-medium">
                            <tr>
                                <th className="p-4">Date</th>
                                {combined && <th className="p-4">Fund</th>}
                                <th className="p-4">Description</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Type</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {rows.map((r, i) => (
                                <tr key={i} className="hover:bg-zinc-50">
                                    <td className="p-4 text-zinc-600">{r.date}</td>
                                    {combined && <td className="p-4"><FundTag fund={r.fund} /></td>}
                                    <td className="p-4 font-medium max-w-xs truncate" title={r.description}>{r.description}</td>
                                    <td className="p-4 text-zinc-600">{r.category}</td>
                                    <td className="p-4"><span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-xs">{r.type}</span></td>
                                    <td className={clsx("p-4 text-right tabular-nums font-bold", r.amount.includes("-") || r.amount.includes("(") ? "text-red-500" : "text-emerald-600")}>
                                        {r.amount}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan={combined ? 6 : 5} className="p-10 text-center text-zinc-400">No transactions.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </motion.div>
    );
}

// ── LPs ──────────────────────────────────────────────────────────────────────
function LpTab({ lps, combined }: { lps: LpRow[]; combined: boolean }) {
    return (
        <motion.div {...fade}>
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 font-medium">
                            <tr>
                                <th className="p-4 md:p-5">LP name</th>
                                {combined && <th className="p-4 md:p-5">Fund</th>}
                                <th className="p-4 md:p-5">Status</th>
                                <th className="p-4 md:p-5 text-right">Contribution</th>
                                <th className="p-4 md:p-5 text-right">Ownership</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {lps.map((lp, i) => (
                                <tr key={i} className="hover:bg-zinc-50">
                                    <td className="p-4 md:p-5 font-semibold">{lp.name}</td>
                                    {combined && <td className="p-4 md:p-5"><FundTag fund={lp.fund} /></td>}
                                    <td className="p-4 md:p-5">
                                        <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold", lp.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                                            <span className={clsx("w-1.5 h-1.5 rounded-full", lp.status === "Active" ? "bg-emerald-500" : "bg-amber-500")} />
                                            {lp.status}
                                        </span>
                                    </td>
                                    <td className="p-4 md:p-5 text-right tabular-nums text-zinc-700 whitespace-nowrap">{lp.contribution}</td>
                                    <td className="p-4 md:p-5 text-right tabular-nums font-bold">{lp.percent}</td>
                                </tr>
                            ))}
                            {lps.length === 0 && (
                                <tr><td colSpan={combined ? 5 : 4} className="p-10 text-center text-zinc-400">No LP records.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </motion.div>
    );
}
