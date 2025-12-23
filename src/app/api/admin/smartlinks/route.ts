// app/api/admin/smartlinks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') as 'pending' | 'active' | 'terminated' | null;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const where: any = {};

    if (status && ['pending', 'active', 'terminated'].includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { offer: { name: { contains: search, mode: 'insensitive' } } },
        { offer: { offer_url: { contains: search, mode: 'insensitive' } } },
        { publisher: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [smartlinks, total] = await Promise.all([
      prisma.smartlink.findMany({
        where,
        include: {
          offer: {
            select: {
              name: true,
              offer_url: true,
            },
          },
          publisher: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.smartlink.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: smartlinks.map((s) => ({
        id: s.id,
        name: s.offer.name,
        url: s.offer.offer_url,
        creationDate: s.created_at,
        createdBy: s.publisher.name,
        status: s.status,
      })),
      totalPages,
      totalFilteredItems: total,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch smartlinks' }, { status: 500 });
  }
}
