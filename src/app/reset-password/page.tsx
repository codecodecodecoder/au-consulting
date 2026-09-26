"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getSessionAndProfile } from "@/lib/auth";
import AuthShell, { Alert, FullPageLoader, PasswordField, SubmitButton } from "@/components/AuthShell";

/**
 * Two ways in:
 *  1. From the reset email — Supabase puts a recovery session in the URL.
 *  2. From the dashboard's "Change password" link while signed in.
 */
export default function ResetPasswordPage() {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [hasSession, setHasSession] = useState(false);
    const [fromEmail, setFromEmail] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setFromEmail(window.location.hash.includes("type=recovery") || window.location.search.includes("code="));

        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY" || session) {
                setHasSession(true);
                setReady(true);
            }
        });
        // Give the client a moment to read the token from the URL.
        const timer = setTimeout(async () => {
            const { data } = await supabase.auth.getSession();
            setHasSession(!!data.session);
            setReady(true);
        }, 800);
        return () => {
            sub.subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password.length < 8) return setError("Password must be at least 8 characters.");
        if (password !== confirm) return setError("Passwords do not match.");

        setIsLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                setError(updateError.message);
                return;
            }
            const { profile } = await getSessionAndProfile();
            if (!fromEmail && profile?.status === "approved") {
                router.push(profile.is_admin ? "/admin" : "/dashboard");
                return;
            }
            await supabase.auth.signOut();
            router.push("/?notice=password-updated");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!ready) return <FullPageLoader label="Verifying link…" />;

    if (!hasSession) {
        return (
            <AuthShell
                title="Link expired"
                footer={
                    <Link href="/" className="font-semibold text-[var(--primary)] hover:underline">
                        Back to sign in
                    </Link>
                }
            >
                <p className="text-sm text-zinc-600 mb-5">This reset link is invalid or has expired. Request a new one to continue.</p>
                <Link
                    href="/forgot-password"
                    className="block w-full text-center bg-[var(--primary)] text-white font-bold py-3 rounded-md hover:opacity-90"
                >
                    Request a new link
                </Link>
            </AuthShell>
        );
    }

    return (
        <AuthShell title="Set a new password" subtitle="Choose a password with at least 8 characters.">
            {error && <Alert tone="error">{error}</Alert>}
            <form onSubmit={handleSubmit} className="space-y-5">
                <PasswordField label="New password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
                <PasswordField label="Confirm new password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
                <SubmitButton loading={isLoading}>Update password</SubmitButton>
            </form>
        </AuthShell>
    );
}
