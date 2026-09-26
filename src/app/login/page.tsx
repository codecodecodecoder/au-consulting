"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FullPageLoader } from "@/components/AuthShell";

// The sign-in page now lives at the site root. Keep /login working for old links.
export default function LoginRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/");
    }, [router]);
    return <FullPageLoader label="Redirecting…" />;
}
