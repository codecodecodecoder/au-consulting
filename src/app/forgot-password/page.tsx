"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { appUrl, resolveLoginEmail } from "@/lib/auth";
import AuthShell, { Alert, Field, SubmitButton } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
    const [identifier, setIdentifier] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const email = await resolveLoginEmail(identifier);
            if (email) {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: appUrl("/reset-password/"),
                });
                if (resetError && resetError.status === 429) {
                    setError("Too many requests. Please wait a minute and try again.");
                    return;
                }
            }
            // Same message whether or not the account exists.
            setSent(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell
            title="Reset your password"
            subtitle="Enter your email and we'll send you a link to set a new password."
            footer={
                <Link href="/" className="font-semibold text-[var(--primary)] hover:underline">
                    Back to sign in
                </Link>
            }
        >
            {error && <Alert tone="error">{error}</Alert>}
            {sent ? (
                <Alert tone="success">If an account exists for that address, a reset link is on its way. Check your inbox.</Alert>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Field label="Email or username" type="text" autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com" />
                    <SubmitButton loading={isLoading}>Send reset link</SubmitButton>
                </form>
            )}
        </AuthShell>
    );
}
