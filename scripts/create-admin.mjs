#!/usr/bin/env node
/**
 * Investor Portal — create (or reset) the admin account.
 *
 * Run AFTER supabase/schema.sql has been applied:
 *   node scripts/create-admin.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * Override the defaults with env vars if you like:
 *   ADMIN_USERNAME=admin123 ADMIN_PASSWORD=admin123 ADMIN_EMAIL=you@example.com node scripts/create-admin.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ── Load .env.local (no dotenv dependency) ─────────────────────────────────
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m || process.env[m[1]]) continue;
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USERNAME = (process.env.ADMIN_USERNAME || 'admin123').toLowerCase();
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const EMAIL = (process.env.ADMIN_EMAIL || `${USERNAME}@investorportal.app`).toLowerCase();
const FUNDS = ['AU Consulting', 'IR Capital'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (in .env.local).');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
    for (let page = 1; page < 50; page++) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        const hit = data.users.find(u => u.email?.toLowerCase() === email);
        if (hit) return hit;
        if (data.users.length < 200) return null;
    }
    return null;
}

async function main() {
    console.log(`\n🔐 Setting up admin "${USERNAME}" (${EMAIL})\n`);

    let user = await findUserByEmail(EMAIL);
    if (user) {
        const { error } = await supabase.auth.admin.updateUserById(user.id, {
            password: PASSWORD,
            email_confirm: true,
        });
        if (error) throw error;
        console.log('  ↩️  Admin user existed — password reset.');
    } else {
        const { data, error } = await supabase.auth.admin.createUser({
            email: EMAIL,
            password: PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: 'Administrator' },
        });
        if (error) throw error;
        user = data.user;
        console.log('  ✅ Admin user created.');
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: EMAIL,
        full_name: 'Administrator',
        username: USERNAME,
        status: 'approved',
        is_admin: true,
        approved_at: new Date().toISOString(),
    });
    if (profileError) {
        if (profileError.message.includes('profiles')) {
            console.error('  ❌ The profiles table is missing — run supabase/schema.sql first.');
        }
        throw profileError;
    }

    for (const fund of FUNDS) {
        await supabase.from('user_funds').upsert(
            { user_id: user.id, fund_name: fund },
            { onConflict: 'user_id,fund_name' },
        );
    }

    console.log(`\n✨ Done. Sign in with username "${USERNAME}" and your password.\n`);
}

main().catch(err => {
    console.error('Fatal:', err.message || err);
    process.exit(1);
});
