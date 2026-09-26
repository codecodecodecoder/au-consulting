"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 bg-[#F8F9FB]/90 backdrop-blur-md border-b border-zinc-200"
        >
            <div className="container-custom h-20 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold tracking-tighter text-[var(--primary)] uppercase">
                    Investor Portal
                </Link>
                <Link href="/" className="text-sm font-semibold tracking-wide uppercase text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                    Sign in
                </Link>
            </div>
        </motion.nav>
    );
}
