"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Search, LayoutDashboard, PieChart, LogOut } from "lucide-react";

// Mock Data
const portfolioData = [
    { id: 1, name: "FinFlow", sector: "Fintech", stage: "Seed", invested: "₹50L", valuation: "₹45Cr", status: "Active", trend: "+120%" },
    { id: 2, name: "AgriSense", sector: "Agri-tech", stage: "Pre-seed", invested: "₹25L", valuation: "₹18Cr", status: "Active", trend: "+45%" },
    { id: 3, name: "MediConnect", sector: "Healthtech", stage: "Seed", invested: "₹60L", valuation: "₹55Cr", status: "Active", trend: "+80%" },
    { id: 4, name: "AutoExport", sector: "SaaS", stage: "Pre-seed", invested: "₹30L", valuation: "₹22Cr", status: "Stealth", trend: "0%" },
    { id: 5, name: "GreenSupply", sector: "Climate", stage: "Seed", invested: "₹45L", valuation: "₹38Cr", status: "Active", trend: "+60%" },
    { id: 6, name: "ConsumerX", sector: "D2C", stage: "Pre-seed", invested: "₹25L", valuation: "₹15Cr", status: "Active", trend: "+15%" },
    { id: 7, name: "AI Foundry", sector: "AI/ML", stage: "Seed", invested: "₹75L", valuation: "₹90Cr", status: "Breakout", trend: "+300%" },
    { id: 8, name: "LocalGen", sector: "GenAI", stage: "Pre-seed", invested: "₹40L", valuation: "₹30Cr", status: "Active", trend: "+90%" },
];

export default function DashboardPage() {
    const [searchTerm, setSearchTerm] = useState("");

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
                    <Link href="#" className="flex items-center gap-3 px-4 py-3 bg-[#F1F5F9] text-[var(--primary)] rounded-md font-medium">
                        <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    <Link href="#" className="flex items-center gap-3 px-4 py-3 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[#F1F5F9] rounded-md transition-colors font-medium">
                        <PieChart size={18} /> Analytics
                    </Link>
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
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                        <p className="text-[var(--muted-foreground)] mt-1">Welcome back, Partner.</p>
                    </div>
                    <div className="flex items-center gap-4">
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
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm">
                            AU
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { label: "Total Invested", value: "₹3.5 Cr", trend: "+12%" },
                        { label: "Portfolio Value", value: "₹5.2 Cr", trend: "+48%" },
                        { label: "Active Startups", value: "8", trend: null }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-8 rounded-sm border border-zinc-200 shadow-sm">
                            <span className="text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                            <div className="flex items-end gap-3 mt-2">
                                <p className="text-3xl font-bold text-[var(--primary)]">{stat.value}</p>
                                {stat.trend && <span className="text-emerald-600 text-sm font-medium mb-1">{stat.trend}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-sm border border-zinc-200 shadow-sm overflow-hidden">
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
                </div>
            </main>
        </div>
    );
}
