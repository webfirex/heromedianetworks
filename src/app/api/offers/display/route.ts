import { NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(request: Request) {
  try {
    // Support search query param
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim() || '';

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { geo: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const offers = await prisma.offer.findMany({
      where,
      select: {
        id: true,
        name: true,
        payout: true,
        geo: true,
        description: true,
        offer_url: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error('Failed to fetch offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers.' }, { status: 500 });
  }
}
