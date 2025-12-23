// /app/api/admin/publishers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publisherId = searchParams.get('publisherId');

    if (publisherId) {
      // Get specific publisher with stats
      const publisher = await prisma.publisher.findUnique({
        where: { id: publisherId },
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          status: true,
        },
      });

      if (!publisher) {
        return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
      }

      // Get stats in parallel
      const [clicksCount, conversionsData, linksCount, offerPublishers] = await Promise.all([
        prisma.click.count({
          where: { pub_id: publisherId },
        }),
        prisma.conversion.aggregate({
          where: { pub_id: publisherId },
          _count: { id: true },
          _sum: { amount: true },
        }),
        prisma.link.count({
          where: { publisher_id: publisherId },
        }),
        prisma.offerPublisher.findMany({
          where: { publisher_id: publisherId },
          include: {
            offer: {
              include: {
                clicks: {
                  where: { pub_id: publisherId },
                },
                conversions: {
                  where: { pub_id: publisherId },
                },
              },
            },
          },
        }),
      ]);

      const offers = offerPublishers.map((op) => ({
        offerName: op.offer.name,
        clicks: op.offer.clicks.length,
        conversions: op.offer.conversions.length,
        commissionPercent: op.commission_percent,
        commissionCut: op.commission_cut,
        totalEarning: op.offer.conversions.reduce((sum, c) => sum + Number(c.amount), 0),
      }));

      return NextResponse.json({
        ...publisher,
        clicks: clicksCount,
        conversions: conversionsData._count.id,
        earnings: Number(conversionsData._sum.amount || 0),
        totalLinks: linksCount,
        offers,
      });
    }

    // List publishers with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const query = searchParams.get('query')?.toLowerCase() || '';
    const offset = (page - 1) * limit;

    const where: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.status = status;
    }
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.publisher.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          created_at: true,
          status: true,
          company: true,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.publisher.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      data,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error('[GET /api/admin/publishers]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
