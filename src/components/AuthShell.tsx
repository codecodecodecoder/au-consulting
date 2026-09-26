"use client";

import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function BrandMark({ light = false }: { light?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
                <span className="font-bold text-sm text-white tracking-tight">IP</span>
            </div>
            <div>
                <p className={`font-bold text-xl tracking-tight leading-none ${light ? "text-white" : "text-[var(--primary)]"}`}>
                    Investor Portal
                </p>
                <p className={`text-[10px] font-semibold tracking-widest uppercase mt-1 ${light ? "text-blue-200/60" : "text-[var(--muted-foreground)]"}`}>
                    Fund Performance
                </p>
            </div>
        </div>
    );
}

export default function AuthShell({
    title,
    subtitle,
    children,
    footer,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FB]">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 flex justify-center">
                    <BrandMark />
                </div>
                <div className="bg-white border border-zinc-200 p-8 rounded-xl shadow-sm">
                    <div className="mb-7">
                        <h1 className="text-2xl font-bold mb-1.5 text-[var(--primary)]">{title}</h1>
                        {subtitle && <p className="text-[var(--muted-foreground)] text-sm">{subtitle}</p>}
                    </div>
                    {children}
                </div>
                {footer && <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">{footer}</div>}
            </motion.div>
        </div>
    );
}

export function Alert({ tone, children }: { tone: "error" | "info" | "success"; children: React.ReactNode }) {
    const styles = {
        error: "bg-red-50 border-red-200 text-red-700",
        info: "bg-amber-50 border-amber-200 text-amber-800",
        success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    }[tone];
    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role={tone === "error" ? "alert" : "status"}
            className={`mb-5 p-3 border rounded-md text-sm font-medium ${styles}`}
        >
            {children}
        </motion.div>
    );
}

const inputClass =
    "w-full bg-[#F8F9FB] border border-zinc-200 rounded-md px-4 py-3 text-[var(--primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all";

export function Field({
    label,
    ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="block">
            <span className="block text-xs font-bold text-[var(--primary)] mb-2 uppercase tracking-wide">{label}</span>
            <input {...props} className={inputClass} />
        </label>
    );
}

export function PasswordField({
    label,
    ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    const [show, setShow] = useState(false);
    return (
        <label className="block">
            <span className="block text-xs font-bold text-[var(--primary)] mb-2 uppercase tracking-wide">{label}</span>
            <span className="relative block">
                <input {...props} type={show ? "text" : "password"} className={`${inputClass} pr-12`} />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </span>
        </label>
    );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--primary)] text-white font-bold py-3 rounded-md hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center"
        >
            {loading ? <Loader2 className="animate-spin" size={20} /> : children}
        </button>
    );
}

export function FullPageLoader({ label }: { label: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-[#001A41]" size={32} />
                <p className="text-sm text-zinc-500 font-medium">{label}</p>
            </div>
        </div>
    );
}
