// /api/debug/db-check/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET() {
  const rows = await prisma.$queryRaw`
    SELECT
      timestamp AS utc_time,
      (timestamp AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata'
    FROM clicks
    ORDER BY timestamp DESC
    LIMIT 10;
  `;

  return NextResponse.json(rows);
}
