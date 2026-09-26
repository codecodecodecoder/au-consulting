"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Check, LayoutDashboard, Loader2, LogOut, RefreshCw, Search, ShieldCheck, UserX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSessionAndProfile, type Profile, type ProfileStatus } from "@/lib/auth";
import { FUNDS } from "@/lib/funds";
import { BrandMark, FullPageLoader } from "@/components/AuthShell";

type Row = Profile & { funds: string[] };
type Filter = ProfileStatus | "all";

const STATUS_STYLES: Record<ProfileStatus, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-zinc-100 text-zinc-600 border-zinc-200",
};
const STATUS_LABEL: Record<ProfileStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "No access",
};

export default function AdminPage() {
    const router = useRouter();
    const [me, setMe] = useState<Profile | null>(null);
    const [rows, setRows] = useState<Row[]>([]);
    const [draft, setDraft] = useState<Record<string, string[]>>({});
    const [filter, setFilter] = useState<Filter>("pending");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [toast, setToast] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const [{ data: profiles, error: pErr }, { data: funds, error: fErr }] = await Promise.all([
            supabase.from("profiles").select("*").order("created_at", { ascending: false }),
            supabase.from("user_funds").select("user_id, fund_name"),
        ]);
        if (pErr || fErr) {
            setToast({ tone: "err", text: (pErr || fErr)!.message });
            setLoading(false);
            return;
        }
        const byUser = new Map<string, string[]>();
        for (const f of funds ?? []) {
            byUser.set(f.user_id, [...(byUser.get(f.user_id) ?? []), f.fund_name]);
        }
        const next = (profiles as Profile[]).map((p) => ({ ...p, funds: byUser.get(p.id) ?? [] }));
        setRows(next);
        setDraft(Object.fromEntries(next.map((r) => [r.id, r.funds])));
        setLoading(false);
    }, []);

    useEffect(() => {
        getSessionAndProfile().then(({ session, profile }) => {
            if (!session) return router.replace("/");
            if (!profile?.is_admin || profile.status !== "approved") return router.replace("/dashboard");
            setMe(profile);
            load();
        });
    }, [router, load]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    const counts = useMemo(
        () => ({
            pending: rows.filter((r) => r.status === "pending").length,
            approved: rows.filter((r) => r.status === "approved").length,
            rejected: rows.filter((r) => r.status === "rejected").length,
            all: rows.length,
        }),
        [rows],
    );

    const visible = rows.filter((r) => {
        if (filter !== "all" && r.status !== filter) return false;
        const q = search.trim().toLowerCase();
        return !q || r.email.includes(q) || (r.full_name ?? "").toLowerCase().includes(q);
    });

    const toggleFund = (id: string, fund: string) => {
        setDraft((d) => {
            const cur = d[id] ?? [];
            return { ...d, [id]: cur.includes(fund) ? cur.filter((f) => f !== fund) : [...cur, fund] };
        });
    };

    const setAccess = async (row: Row, status: ProfileStatus) => {
        const funds = status === "approved" ? draft[row.id] ?? [] : [];
        if (status === "approved" && funds.length === 0) {
            setToast({ tone: "err", text: "Select at least one fund before approving." });
            return;
        }
        setBusy(row.id);
        const { error } = await supabase.rpc("admin_set_access", { p_user: row.id, p_status: status, p_funds: funds });
        setBusy(null);
        if (error) {
            setToast({ tone: "err", text: error.message });
            return;
        }
        const who = row.full_name || row.email;
        setToast({
            tone: "ok",
            text:
                status === "approved"
                    ? `${who} can now see ${funds.join(" + ")}.`
                    : `${who}'s access has been ${row.status === "pending" ? "declined" : "revoked"}.`,
        });
        load();
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push("/?notice=signed-out");
    };

    if (!me) return <FullPageLoader label="Checking access…" />;

    return (
        <div className="min-h-screen bg-[#F8F9FB] text-[#001A41]">
            {/* Top bar */}
            <header className="bg-[#001A41] text-white">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
                    <BrandMark light />
                    <nav className="flex items-center gap-1 md:gap-2 text-sm font-medium">
                        <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-blue-100/80 hover:bg-white/10 hover:text-white">
                            <LayoutDashboard size={16} /> <span className="hidden sm:inline">Dashboard</span>
                        </Link>
                        <button onClick={signOut} className="flex items-center gap-2 px-3 py-2 rounded-lg text-blue-100/80 hover:bg-red-500/15 hover:text-red-300">
                            <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
                        </button>
                    </nav>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <ShieldCheck className="text-blue-600" /> Investor access
                        </h1>
                        <p className="text-[var(--muted-foreground)] mt-1">
                            Approve new investors and choose which funds each one can see.
                        </p>
                    </div>
                    <button onClick={load} className="self-start md:self-auto flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-[var(--primary)]">
                        <RefreshCw size={16} className={clsx(loading && "animate-spin")} /> Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-5">
                    <div className="flex flex-wrap gap-2">
                        {(["pending", "approved", "rejected", "all"] as Filter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={clsx(
                                    "px-4 py-2 rounded-full text-sm font-semibold border transition-colors",
                                    filter === f
                                        ? "bg-[#001A41] text-white border-[#001A41]"
                                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400",
                                )}
                            >
                                {f === "all" ? "All" : STATUS_LABEL[f]}
                                <span className={clsx("ml-2 text-xs", filter === f ? "text-blue-200" : "text-zinc-400")}>{counts[f]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name or email"
                            className="bg-white border border-zinc-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--primary)] w-full md:w-72"
                        />
                    </div>
                </div>

                {/* User list */}
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm divide-y divide-zinc-100">
                    {loading && rows.length === 0 ? (
                        <div className="p-10 flex justify-center">
                            <Loader2 className="animate-spin text-zinc-400" />
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="p-10 text-center text-zinc-400">
                            {filter === "pending" ? "No one is waiting for approval." : "No users match."}
                        </div>
                    ) : (
                        visible.map((row) => {
                            const selected = draft[row.id] ?? [];
                            const isMe = row.id === me.id;
                            const dirty =
                                row.status === "approved" &&
                                (selected.length !== row.funds.length || selected.some((f) => !row.funds.includes(f)));
                            return (
                                <div key={row.id} className="p-5 md:p-6 flex flex-col lg:flex-row lg:items-center gap-5">
                                    {/* Who */}
                                    <div className="flex items-center gap-4 lg:w-80 min-w-0">
                                        <div className="w-11 h-11 rounded-full bg-[#001A41]/5 text-[#001A41] flex items-center justify-center font-bold shrink-0">
                                            {(row.full_name || row.email)[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold truncate flex items-center gap-2">
                                                {row.full_name || row.email.split("@")[0]}
                                                {row.is_admin && (
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">Admin</span>
                                                )}
                                            </div>
                                            <div className="text-sm text-zinc-500 truncate">{row.email}</div>
                                            <div className="text-xs text-zinc-400 mt-0.5">
                                                Joined {new Date(row.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="lg:w-28">
                                        <span className={clsx("inline-block text-xs font-bold px-2.5 py-1 rounded-full border", STATUS_STYLES[row.status])}>
                                            {STATUS_LABEL[row.status]}
                                        </span>
                                    </div>

                                    {/* Fund access */}
                                    <div className="flex-1">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Fund access</p>
                                        <div className="flex flex-wrap gap-2">
                                            {FUNDS.map((fund) => {
                                                const on = selected.includes(fund);
                                                return (
                                                    <button
                                                        key={fund}
                                                        type="button"
                                                        disabled={isMe}
                                                        onClick={() => toggleFund(row.id, fund)}
                                                        aria-pressed={on}
                                                        className={clsx(
                                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
                                                            on ? "bg-blue-50 border-blue-300 text-blue-800" : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400",
                                                        )}
                                                    >
                                                        <span className={clsx("w-4 h-4 rounded border flex items-center justify-center", on ? "bg-blue-600 border-blue-600" : "border-zinc-300")}>
                                                            {on && <Check size={12} className="text-white" strokeWidth={3} />}
                                                        </span>
                                                        {fund}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 lg:justify-end lg:w-56">
                                        {isMe ? (
                                            <span className="text-xs text-zinc-400">This is you</span>
                                        ) : busy === row.id ? (
                                            <Loader2 className="animate-spin text-zinc-400" />
                                        ) : row.status === "approved" ? (
                                            <>
                                                <button
                                                    disabled={!dirty}
                                                    onClick={() => setAccess(row, "approved")}
                                                    className="px-4 py-2 rounded-lg text-sm font-bold bg-[#001A41] text-white hover:opacity-90 disabled:opacity-30"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setAccess(row, "rejected")}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
                                                >
                                                    <UserX size={16} /> Revoke
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setAccess(row, "approved")}
                                                    className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                                                >
                                                    Approve
                                                </button>
                                                {row.status === "pending" && (
                                                    <button
                                                        onClick={() => setAccess(row, "rejected")}
                                                        className="px-3 py-2 rounded-lg text-sm font-semibold text-zinc-500 hover:bg-zinc-100"
                                                    >
                                                        Decline
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {toast && (
                <div
                    role="status"
                    className={clsx(
                        "fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg shadow-lg text-sm font-medium max-w-[90vw]",
                        toast.tone === "ok" ? "bg-[#001A41] text-white" : "bg-red-600 text-white",
                    )}
                >
                    {toast.text}
                </div>
            )}
        </div>
    );
}
