"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { ArrowRight } from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function Home() {
  return (
    <main className="min-h-screen relative z-0 text-[#001A41]">
      <Navbar />
      <div className="sparrow-gradient" />

      {/* Hero Section */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-4 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tighter leading-[0.9] text-[var(--primary)]">
            Catalyzing India's <br /> Next Generation
          </h1>
          <p className="text-xl md:text-2xl text-[var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed font-light mt-8">
            Strategic early-stage capital for high-impact startups.
          </p>
        </motion.div>
      </section>

      {/* Investment Thesis - Navy Banner Style */}
      <section className="bg-[var(--primary)] text-white py-24">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <motion.div {...fadeIn} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Stage</h3>
              <p className="text-4xl md:text-5xl font-bold">Pre-seed to Seed</p>
              <p className="text-zinc-400">Backing conviction early.</p>
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Ticket</h3>
              <p className="text-4xl md:text-5xl font-bold">₹25L – ₹75L</p>
              <p className="text-zinc-400">With distinct follow-on reserves.</p>
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Focus</h3>
              <p className="text-4xl md:text-5xl font-bold">High Impact</p>
              <p className="text-zinc-400">Sustainable growth & value.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sector Focus - Clean Grid */}
      <section className="py-32 container-custom">
        <motion.h2 {...fadeIn} className="text-4xl font-bold mb-16 text-[var(--primary)] tracking-tight">Core Areas of Interest</motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16">
          {[
            { title: "Fintech", desc: "Lending, insurance tech, embedded finance." },
            { title: "Healthtech", desc: "Affordable diagnostics, digital clinics." },
            { title: "Climate & Agri", desc: "Sustainable inputs, supply chain tech." },
            { title: "SaaS & B2B", desc: "Automation, export-ready solutions." },
            { title: "Consumer Brands", desc: "Digital-first distribution, high margins." },
            { title: "Artificial Intelligence", desc: "Foundational tooling, Vertical AI Agents." },
          ].map((item, i) => (
            <motion.div
              key={i}
              {...fadeIn}
              transition={{ delay: i * 0.05 }}
              className="group border-t border-zinc-300 pt-6 hover:border-[var(--primary)] transition-colors duration-500"
            >
              <h3 className="text-2xl font-bold mb-3 group-hover:translate-x-2 transition-transform duration-300">{item.title}</h3>
              <p className="text-[var(--muted-foreground)] text-lg leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Rationale - Typography Heavy */}
      <section className="py-32 bg-white">
        <div className="container-custom">
          <motion.h2 {...fadeIn} className="text-4xl font-bold mb-16 text-[var(--primary)] tracking-tight">The Opportunity</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div className="space-y-12">
              <motion.div {...fadeIn}>
                <h3 className="text-xl font-bold mb-2">Digital Tailwinds</h3>
                <p className="text-[var(--muted-foreground)] text-lg">600M+ internet users, UPI-led fintech boom, and ONDC maturing.</p>
              </motion.div>
              <motion.div {...fadeIn}>
                <h3 className="text-xl font-bold mb-2">AI Momentum</h3>
                <p className="text-[var(--muted-foreground)] text-lg">Global hub for cost-efficient AI engineering and localization.</p>
              </motion.div>
            </div>
            <div className="space-y-12">
              <motion.div {...fadeIn}>
                <h3 className="text-xl font-bold mb-2">Valuation Arbitrage</h3>
                <p className="text-[var(--muted-foreground)] text-lg">Early-stage valuations in India offer high IRR vs Global peers.</p>
              </motion.div>
              <motion.div {...fadeIn}>
                <h3 className="text-xl font-bold mb-2">Talent Surge</h3>
                <p className="text-[var(--muted-foreground)] text-lg">Returnee founders and strong engineering pool.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section className="py-24 container-custom text-center">
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-4xl font-bold text-[var(--primary)] tracking-tight">Partner with Us</h2>
          <p className="text-xl text-[var(--muted-foreground)]">We are always looking for visionary founders. Reach out to start a conversation.</p>
          <a href="mailto:auconsultingpartners@gmail.com" className="inline-block px-8 py-4 bg-[var(--primary)] text-white font-bold rounded-sm hover:opacity-90 transition-opacity">
            auconsultingpartners@gmail.com
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-200">
        <div className="container-custom flex flex-col md:flex-row justify-between items-center text-sm text-[var(--muted-foreground)]">
          <p>© {new Date().getFullYear()} AU Consulting Partners.</p>
          <div className="flex gap-8 mt-4 md:mt-0 uppercase tracking-widest font-semibold text-xs">
            <span>Contact</span>
            <span>LinkedIn</span>
            <span>Twitter</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
