"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Search, LayoutDashboard, PieChart, LogOut, TrendingUp, DollarSign, Activity, Users, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { useEffect } from "react";

// Mock Data (Fallback)
const initialPortfolioData = [
    { id: 1, name: "FinFlow", sector: "Fintech", stage: "Seed", invested: "₹50L", valuation: "₹45Cr", status: "Active", trend: "+120%" },
    { id: 2, name: "AgriSense", sector: "Agri-tech", stage: "Pre-seed", invested: "₹25L", valuation: "₹18Cr", status: "Active", trend: "+45%" },
    { id: 3, name: "MediConnect", sector: "Healthtech", stage: "Seed", invested: "₹60L", valuation: "₹55Cr", status: "Active", trend: "+80%" },
    { id: 4, name: "AutoExport", sector: "SaaS", stage: "Pre-seed", invested: "₹30L", valuation: "₹22Cr", status: "Stealth", trend: "0%" },
    { id: 5, name: "GreenSupply", sector: "Climate", stage: "Seed", invested: "₹45L", valuation: "₹38Cr", status: "Active", trend: "+60%" },
    { id: 6, name: "ConsumerX", sector: "D2C", stage: "Pre-seed", invested: "₹25L", valuation: "₹15Cr", status: "Active", trend: "+15%" },
    { id: 7, name: "AI Foundry", sector: "AI/ML", stage: "Seed", invested: "₹75L", valuation: "₹90Cr", status: "Breakout", trend: "+300%" },
    { id: 8, name: "LocalGen", sector: "GenAI", stage: "Pre-seed", invested: "₹40L", valuation: "₹30Cr", status: "Active", trend: "+90%" },
];

const initialInflowData = [
    { date: "14-Sep-20", source: "A", capital: "500,000" },
    { date: "16-Sep-20", source: "B", capital: "497,500" },
    { date: "03-Oct-20", source: "C", capital: "40,120" },
    { date: "23-Nov-20", source: "D", capital: "250,000" },
]; // truncated fallback

const initialOutflowData = [
    { date: "16-Sep-20", company: "Mailmodo", ticker: "#N/A", amount: "997,500" },
    { date: "07-Jan-21", company: "GoKwik", ticker: "GK", amount: "500,000" },
]; // truncated fallback

const initialLpData = [
    { name: "Global Ventures LLC", status: "Active", contribution: "₹15.0 Cr", percent: "37.5%" },
    { name: "Tech Foundations Trust", status: "Active", contribution: "₹10.0 Cr", percent: "25.0%" },
]; // truncated fallback

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("performance"); // performance, cashflow, holdings, lps
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // State for data
    const [portfolioData] = useState(initialPortfolioData);
    const [inflowData] = useState(initialInflowData);
    const [outflowData] = useState(initialOutflowData);
    const [lpData] = useState(initialLpData);

    // NOTE: Cloud Fetching removed to fix GitHub Pages build error. 
    // GitHub Pages only supports static sites, not API routes.
    // To restore dynamic data, we must use "Public CSV" fetching client-side.

    /*
    const fetchData = async () => {
        // Client-side CSV fetching logic would go here
    };
    */

    const filteredData = portfolioData.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sector.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex text-[#001A41]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-200 bg-white p-6 hidden md:block">
                <div className="mb-10">
                    <h1 className="font-bold text-xl tracking-tight text-[var(--primary)] uppercase">AU Consulting</h1>
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mt-1">Portfolio Manager</p>
                </div>

                <nav className="space-y-1">
                    <button
                        onClick={() => setActiveTab("performance")}
                        className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors", activeTab === "performance" ? "bg-[#F1F5F9] text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[#F1F5F9]")}
                    >
                        <TrendingUp size={18} /> Performance
                    </button>
                    <button
                        onClick={() => setActiveTab("cashflow")}
                        className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors", activeTab === "cashflow" ? "bg-[#F1F5F9] text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[#F1F5F9]")}
                    >
                        <DollarSign size={18} /> Cashflow
                    </button>
                    <button
                        onClick={() => setActiveTab("lps")}
                        className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors", activeTab === "lps" ? "bg-[#F1F5F9] text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[#F1F5F9]")}
                    >
                        <Users size={18} /> LP Management
                    </button>
                    <button
                        onClick={() => setActiveTab("holdings")}
                        className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors", activeTab === "holdings" ? "bg-[#F1F5F9] text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[#F1F5F9]")}
                    >
                        <LayoutDashboard size={18} /> Holdings
                    </button>
                </nav>

                <div className="absolute bottom-6 left-6">
                    <Link href="/" className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-red-500 transition-colors text-sm font-medium">
                        <LogOut size={16} /> Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight capitalize">{activeTab === "lps" ? "LP Management" : activeTab + " Overview"}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-[var(--muted-foreground)]">Real-time fund metrics.</p>
                            {lastUpdated && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Synced {lastUpdated.toLocaleTimeString()}</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {activeTab === "holdings" && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search companies..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white border border-zinc-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--primary)] w-64 shadow-sm"
                                />
                            </div>
                        )}
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm">
                            AU
                        </div>
                    </div>
                </header>

                {activeTab === "performance" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Summary Card */}
                        <div className="bg-white p-8 rounded-sm border border-zinc-200 shadow-sm">
                            <h3 className="text-lg font-bold mb-6 text-[var(--primary)] uppercase tracking-wide border-b border-zinc-100 pb-2">Overall Portfolio Performance</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div>
                                    <span className="text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider block mb-1">Total Investments</span>
                                    <span className="text-2xl font-bold">16</span>
                                    <span className="text-sm text-zinc-500 ml-2">(39.15M INR)</span>
                                </div>
                                <div>
                                    <span className="text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider block mb-1">Total Markups</span>
                                    <span className="text-2xl font-bold">12</span>
                                </div>
                                <div>
                                    <span className="text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider block mb-1">Total Value</span>
                                    <span className="text-2xl font-bold text-[var(--primary)]">181.8M INR</span>
                                </div>
                                <div>
                                    <span className="text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider block mb-1">Gross IRR</span>
                                    <span className="text-2xl font-bold text-emerald-600">56%</span>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Metrics Table */}
                        <div className="bg-white rounded-sm border border-zinc-200 shadow-sm overflow-hidden p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div>
                                    <h4 className="font-bold mb-4 flex items-center gap-2"><Activity size={16} /> Asset Value</h4>
                                    <div className="divide-y divide-zinc-100">
                                        <div className="flex justify-between py-3">
                                            <span className="text-zinc-500">Fair Market Value</span>
                                            <span className="font-mono font-bold">175.9M INR</span>
                                        </div>
                                        <div className="flex justify-between py-3">
                                            <span className="text-zinc-500">Realised Value</span>
                                            <span className="font-mono font-bold">5.9M INR</span>
                                        </div>
                                        <div className="flex justify-between py-3 border-t border-zinc-200 pt-3">
                                            <span className="text-zinc-800 font-bold">Total Value</span>
                                            <span className="font-mono font-bold text-[var(--primary)]">181.8M INR</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={16} /> Multiples</h4>
                                    <div className="divide-y divide-zinc-100">
                                        <div className="flex justify-between py-3">
                                            <span className="text-zinc-500">MOIC</span>
                                            <span className="font-mono font-bold">4.64x</span>
                                        </div>
                                        <div className="flex justify-between py-3">
                                            <span className="text-zinc-500">TVPI</span>
                                            <span className="font-mono font-bold">4.55x</span>
                                        </div>
                                        <div className="flex justify-between py-3">
                                            <span className="text-zinc-500">DPI</span>
                                            <span className="font-mono font-bold">0.15x</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "cashflow" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Inflows */}
                        <div className="bg-white rounded-sm border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                                <h3 className="font-bold text-[var(--primary)]">Cash Inflow Schedule</h3>
                                <p className="text-xs text-zinc-500">Capital Calls & Contributions</p>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 font-medium">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Source</th>
                                        <th className="p-4 text-right">Capital</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {inflowData.map((row, i) => (
                                        <tr key={i} className="hover:bg-zinc-50">
                                            <td className="p-4 text-zinc-600">{row.date}</td>
                                            <td className="p-4 font-medium">{row.source}</td>
                                            <td className="p-4 text-right font-mono text-emerald-600">+{row.capital}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Outflows */}
                        <div className="bg-white rounded-sm border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                                <h3 className="font-bold text-[var(--primary)]">Cash Outflow Schedule</h3>
                                <p className="text-xs text-zinc-500">Investments & Expenses</p>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 font-medium">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Company</th>
                                        <th className="p-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {outflowData.map((row, i) => (
                                        <tr key={i} className="hover:bg-zinc-50">
                                            <td className="p-4 text-zinc-600">{row.date}</td>
                                            <td className="p-4 font-medium">{row.company}</td>
                                            <td className="p-4 text-right font-mono text-red-500">-{row.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === "lps" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-sm border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                            <div>
                                <h3 className="font-bold text-[var(--primary)] text-lg">Limited Partners</h3>
                                <p className="text-xs text-zinc-500">Capital contribution status and ownership split.</p>
                            </div>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 font-medium">
                                <tr>
                                    <th className="p-5 border-b border-zinc-200">LP Name</th>
                                    <th className="p-5 border-b border-zinc-200">Status</th>
                                    <th className="p-5 border-b border-zinc-200 text-right">Contribution</th>
                                    <th className="p-5 border-b border-zinc-200 text-right">Ownership %</th>
                                    <th className="p-5 border-b border-zinc-200 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {lpData.map((lp, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="hover:bg-zinc-50 transition-colors"
                                    >
                                        <td className="p-5 font-semibold text-[var(--primary)]">{lp.name}</td>
                                        <td className="p-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${lp.status === "Active" ? "bg-emerald-100 text-emerald-700" :
                                                "bg-amber-100 text-amber-700"
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${lp.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                {lp.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right font-mono text-zinc-700 font-medium">{lp.contribution}</td>
                                        <td className="p-5 text-right font-mono text-[var(--primary)] font-bold">{lp.percent}</td>
                                        <td className="p-5 text-right">
                                            <button className="text-zinc-400 hover:text-[var(--primary)] transition-colors text-xs uppercase font-bold tracking-wide">
                                                View Details
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}

                {activeTab === "holdings" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-sm border border-zinc-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#F8F9FB] text-xs uppercase text-[var(--muted-foreground)] font-bold tracking-wider">
                                <tr>
                                    <th className="p-5 border-b border-zinc-200">Company</th>
                                    <th className="p-5 border-b border-zinc-200">Sector</th>
                                    <th className="p-5 border-b border-zinc-200">Stage</th>
                                    <th className="p-5 border-b border-zinc-200 text-right">Invested</th>
                                    <th className="p-5 border-b border-zinc-200 text-right">Valuation</th>
                                    <th className="p-5 border-b border-zinc-200">Status</th>
                                    <th className="p-5 border-b border-zinc-200"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredData.map((item, i) => (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="hover:bg-zinc-50 transition-colors"
                                    >
                                        <td className="p-5 font-semibold text-[var(--primary)]">{item.name}</td>
                                        <td className="p-5 text-zinc-500 text-sm">{item.sector}</td>
                                        <td className="p-5 text-zinc-500 text-sm">{item.stage}</td>
                                        <td className="p-5 text-right text-zinc-600 font-mono text-sm">{item.invested}</td>
                                        <td className="p-5 text-right text-[var(--primary)] font-mono text-sm font-medium">{item.valuation}</td>
                                        <td className="p-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${item.status === "Breakout" ? "bg-purple-100 text-purple-700" :
                                                item.status === "Stealth" ? "bg-zinc-100 text-zinc-600" :
                                                    "bg-emerald-100 text-emerald-700"
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button className="text-zinc-400 hover:text-[var(--primary)] transition-colors">
                                                <ArrowUpRight size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
