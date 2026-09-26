"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getSessionAndProfile, resolveLoginEmail, statusMessage } from "@/lib/auth";
import AuthShell, { Alert, Field, FullPageLoader, PasswordField, SubmitButton } from "@/components/AuthShell";

const NOTICES: Record<string, { tone: "info" | "success"; text: string }> = {
    "password-updated": { tone: "success", text: "Password updated. Please sign in with your new password." },
    "signed-out": { tone: "success", text: "You have been signed out." },
};

export default function LoginPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ tone: "info" | "success"; text: string } | null>(null);

    // Already signed in and approved? Skip straight to the right place.
    useEffect(() => {
        const key = new URLSearchParams(window.location.search).get("notice");
        if (key && NOTICES[key]) setNotice(NOTICES[key]);

        getSessionAndProfile().then(({ session, profile }) => {
            if (session && profile?.status === "approved") {
                router.replace(profile.is_admin ? "/admin" : "/dashboard");
                return;
            }
            if (session) supabase.auth.signOut();
            setChecking(false);
        });
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setNotice(null);
        setIsLoading(true);

        try {
            const email = await resolveLoginEmail(identifier);
            if (!email) {
                setError("Invalid username/email or password.");
                return;
            }

            const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError || !data.session) {
                setError(
                    signInError?.message.toLowerCase().includes("not confirmed")
                        ? "Please confirm your email address first — check your inbox for the link."
                        : "Invalid username/email or password.",
                );
                return;
            }

            const { profile } = await getSessionAndProfile();
            if (!profile || profile.status !== "approved") {
                await supabase.auth.signOut();
                setNotice({ tone: "info", text: statusMessage(profile?.status) });
                return;
            }

            router.push(profile.is_admin ? "/admin" : "/dashboard");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (checking) return <FullPageLoader label="Loading…" />;

    return (
        <AuthShell
            title="Sign in"
            subtitle="Access your fund performance and reports."
            footer={
                <>
                    New investor?{" "}
                    <Link href="/signup" className="font-semibold text-[var(--primary)] hover:underline">
                        Request access
                    </Link>
                </>
            }
        >
            {error && <Alert tone="error">{error}</Alert>}
            {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

            <form onSubmit={handleLogin} className="space-y-5">
                <Field
                    label="Email or username"
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com"
                />
                <div>
                    <PasswordField
                        label="Password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                    <div className="mt-2 text-right">
                        <Link href="/forgot-password" className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)]">
                            Forgot password?
                        </Link>
                    </div>
                </div>
                <SubmitButton loading={isLoading}>Sign in</SubmitButton>
            </form>
        </AuthShell>
    );
}
