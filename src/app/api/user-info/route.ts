// app/api/user-info/route.ts or pages/api/user-info.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  try {
    const publisher = await prisma.publisher.findUnique({
      where: { email },
      select: { created_at: true },
    });

    if (!publisher) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ registeredAt: publisher.created_at });
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}