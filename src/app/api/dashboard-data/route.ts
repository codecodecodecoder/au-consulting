import { NextResponse } from 'next/server';
import { fetchDashboardData } from '@/lib/sheets';

export async function GET() {
    try {
        const data = await fetchDashboardData();

        if (!data) {
            // If env vars are missing or sheet fails, return null to fallback to mock
            return NextResponse.json({ success: false, message: 'Failed to fetch' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
