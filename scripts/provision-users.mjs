#!/usr/bin/env node
/**
 * Investor Portal - User Provisioning Script
 * 
 * This script:
 * 1. Reads LP email addresses from the Google Sheet (both AU Capital and IR Capital tabs)
 * 2. Generates secure passwords for each user
 * 3. Creates Supabase Auth users
 * 4. Records which fund(s) each user belongs to in the user_funds table
 * 5. Outputs a CSV of credentials so you can email them
 * 
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GOOGLE_SHEETS_API_KEY=... GOOGLE_SHEET_ID=... node scripts/provision-users.mjs
 * 
 * Or if you have a .env.local file, use:
 *   node -r dotenv/config scripts/provision-users.mjs dotenv_config_path=.env.local
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || process.env.GOOGLE_SHEETS_API_KEY;
const SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_ID;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GOOGLE_API_KEY || !SHEET_ID) {
    console.error('❌ Missing environment variables. Required:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    console.error('   NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY (or GOOGLE_SHEETS_API_KEY)');
    console.error('   NEXT_PUBLIC_GOOGLE_SHEET_ID (or GOOGLE_SHEET_ID)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function generatePassword(length = 12) {
    const charset = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$';
    let password = '';
    const bytes = randomBytes(length);
    for (let i = 0; i < length; i++) {
        password += charset[bytes[i] % charset.length];
    }
    return password;
}

async function fetchEmailsFromSheet(sheetName) {
    // Emails are in Column F (rows 2+) — Column A = Entity Name, F = EMAIL header
    const range = `'${sheetName}'!F2:F`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${GOOGLE_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
        console.warn(`  ⚠️  Could not fetch sheet "${sheetName}": ${res.status} ${res.statusText}`);
        return [];
    }
    const json = await res.json();
    const rows = json.values || [];

    const emails = rows
        .flat()
        .map(v => String(v).trim().toLowerCase())
        .filter(v => v.includes('@') && v !== 'email');

    console.log(`  📋  Found ${emails.length} emails in "${sheetName}"`);
    return emails;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🚀 Investor Portal - User Provisioning Script\n');

    // 1. Fetch emails from both sheets
    console.log('📊 Fetching emails from Google Sheets...');
    const auEmails = new Set(await fetchEmailsFromSheet('AU Capital'));
    const irEmails = new Set(await fetchEmailsFromSheet('IR Capital'));

    // Combine all unique emails
    const allEmails = new Set([...auEmails, ...irEmails]);
    console.log(`\n📧 Total unique emails: ${allEmails.size}`);
    console.log(`   AU Capital only: ${[...allEmails].filter(e => auEmails.has(e) && !irEmails.has(e)).length}`);
    console.log(`   IR Capital only: ${[...allEmails].filter(e => !auEmails.has(e) && irEmails.has(e)).length}`);
    console.log(`   Both funds:      ${[...allEmails].filter(e => auEmails.has(e) && irEmails.has(e)).length}`);

    if (allEmails.size === 0) {
        console.error('\n❌ No emails found. Check your Google Sheet column F for LP emails.');
        console.error('   Note: The script looks for email addresses (containing @) in column F.');
        process.exit(1);
    }

    // 2. Create users and track results
    const results = [];
    console.log('\n👤 Creating Supabase users...\n');

    for (const email of allEmails) {
        const password = generatePassword();
        const funds = [];
        if (auEmails.has(email)) funds.push('AU Consulting');
        if (irEmails.has(email)) funds.push('IR Capital');

        try {
            // Check if user already exists
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existing = existingUsers?.users?.find(u => u.email === email);

            let userId;

            if (existing) {
                console.log(`  ↩️  User already exists: ${email} — updating password`);
                const { data, error } = await supabase.auth.admin.updateUserById(existing.id, { password });
                if (error) throw error;
                userId = existing.id;
            } else {
                // Create new user
                const { data, error } = await supabase.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true, // Mark email as confirmed so they can login immediately
                    user_metadata: {
                        created_by: 'investor-portal-admin',
                        created_at: new Date().toISOString()
                    }
                });
                if (error) throw error;
                userId = data.user.id;
                console.log(`  ✅ Created: ${email}`);
            }

            // Pre-approved: provisioned users skip the approval queue
            await supabase
                .from('profiles')
                .upsert({ id: userId, email, status: 'approved', approved_at: new Date().toISOString() }, { onConflict: 'id' });

            // 3. Assign fund access
            for (const fund of funds) {
                await supabase
                    .from('user_funds')
                    .upsert({ user_id: userId, fund_name: fund }, { onConflict: 'user_id,fund_name' });
            }

            results.push({ email, password, funds: funds.join(' + '), status: 'OK' });

        } catch (err) {
            console.error(`  ❌ Failed for ${email}: ${err.message}`);
            results.push({ email, password, funds: funds.join(' + '), status: `ERROR: ${err.message}` });
        }
    }

    // 4. Output CSV of credentials
    const __dir = dirname(fileURLToPath(import.meta.url));
    const csvPath = join(__dir, '..', 'user-credentials.csv');
    const stream = createWriteStream(csvPath);

    stream.write('Email,Password,Funds,Status\n');
    for (const r of results) {
        stream.write(`${r.email},"${r.password}","${r.funds}",${r.status}\n`);
    }
    stream.end();

    const ok = results.filter(r => r.status === 'OK').length;
    const fail = results.filter(r => r.status !== 'OK').length;

    console.log(`\n✨ Done! ${ok} users processed, ${fail} failed.`);
    console.log(`📄 Credentials saved to: user-credentials.csv`);
    console.log(`\n⚠️  Keep user-credentials.csv secure! Delete it after emailing credentials.\n`);

    // Print table to console
    console.log('─'.repeat(80));
    console.log('EMAIL'.padEnd(40) + 'PASSWORD'.padEnd(20) + 'FUNDS');
    console.log('─'.repeat(80));
    for (const r of results) {
        if (r.status === 'OK') {
            console.log(r.email.padEnd(40) + r.password.padEnd(20) + r.funds);
        }
    }
    console.log('─'.repeat(80));
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
