"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate auth delay
        setTimeout(() => {
            router.push("/dashboard");
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FB]">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Link href="/" className="inline-flex items-center text-[var(--muted-foreground)] hover:text-[var(--primary)] mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft size={16} className="mr-2" /> Back to Home
                </Link>

                <div className="bg-white p-10 rounded-sm shadow-sm border border-zinc-200">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold mb-2 text-[var(--primary)]">Partner Access</h1>
                        <p className="text-[var(--muted-foreground)] text-sm">Welcome back. Please enter your details.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-[var(--primary)] mb-2 uppercase tracking-wide">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-sm px-4 py-3 text-[var(--primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                placeholder="investor@auconsulting.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[var(--primary)] mb-2 uppercase tracking-wide">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-sm px-4 py-3 text-[var(--primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[var(--primary)] text-white font-bold py-3 rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
