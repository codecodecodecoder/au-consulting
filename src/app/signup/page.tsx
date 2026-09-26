"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { appUrl } from "@/lib/auth";
import AuthShell, { Alert, Field, PasswordField, SubmitButton } from "@/components/AuthShell";

export default function SignupPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) return setError("Password must be at least 8 characters.");
        if (password !== confirm) return setError("Passwords do not match.");

        setIsLoading(true);
        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: { full_name: fullName.trim() },
                    emailRedirectTo: appUrl("/"),
                },
            });
            if (signUpError) {
                setError(signUpError.message);
                return;
            }
            // New accounts wait for approval — don't leave a session open.
            await supabase.auth.signOut();
            setDone(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (done) {
        return (
            <AuthShell
                title="Request received"
                footer={
                    <Link href="/" className="font-semibold text-[var(--primary)] hover:underline">
                        Back to sign in
                    </Link>
                }
            >
                <div className="flex gap-3 text-sm text-zinc-600 leading-relaxed">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                    <div className="space-y-3">
                        <p>Thanks, {fullName.split(" ")[0] || "there"}. An administrator will review your request and grant access to the right fund(s).</p>
                        <p>If you received a confirmation email, please click the link in it. You can sign in once your access is approved.</p>
                    </div>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="Request access"
            subtitle="Create your account. An administrator will approve it before you can sign in."
            footer={
                <>
                    Already have an account?{" "}
                    <Link href="/" className="font-semibold text-[var(--primary)] hover:underline">
                        Sign in
                    </Link>
                </>
            }
        >
            {error && <Alert tone="error">{error}</Alert>}
            <form onSubmit={handleSignup} className="space-y-5">
                <Field label="Full name" type="text" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
                <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                <PasswordField label="Password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
                <PasswordField label="Confirm password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
                <SubmitButton loading={isLoading}>Request access</SubmitButton>
            </form>
        </AuthShell>
    );
}
