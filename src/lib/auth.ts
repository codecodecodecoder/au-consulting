import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type ProfileStatus = "pending" | "approved" | "rejected";

export type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    username: string | null;
    status: ProfileStatus;
    is_admin: boolean;
    created_at: string;
    approved_at: string | null;
};

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Absolute URL for a page in this app — used in Supabase email links. */
export function appUrl(path: string) {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${BASE_PATH}${path}`;
}

/** Resolves "admin123" style usernames to the account's email. */
export async function resolveLoginEmail(identifier: string): Promise<string | null> {
    const value = identifier.trim().toLowerCase();
    if (value.includes("@")) return value;
    const { data, error } = await supabase.rpc("email_for_username", { p_username: value });
    if (error || !data) return null;
    return data as string;
}

export async function getSessionAndProfile(): Promise<{ session: Session | null; profile: Profile | null }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { session: null, profile: null };
    const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
    return { session, profile: (data as Profile) ?? null };
}

export function statusMessage(status: ProfileStatus | undefined): string {
    if (status === "rejected") {
        return "Your access has not been approved. Please contact the fund administrator.";
    }
    return "Your account is awaiting approval. You'll be able to sign in once an administrator grants you access.";
}
