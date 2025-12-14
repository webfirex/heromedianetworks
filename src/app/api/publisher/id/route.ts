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
      select: { id: true, status: true },
    });

    if (!publisher) {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
    }

    return NextResponse.json({ id: publisher.id, status: publisher.status });
  } catch (error) {
    console.error('Failed to fetch publisher id and status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}