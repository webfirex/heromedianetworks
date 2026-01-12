// /api/admin/postback/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db-prisma';

const secret = process.env.NEXTAUTH_SECRET;

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}

interface ClickSummary {
  clickId: string;
  ipAddress: string;
  userAgent: string;
  publisherId: string | null;
  publisherName: string | null;
  converted: boolean;
}

interface OfferWithClicks {
  offerId: string;
  offerName: string;
  offerUrl: string;
  publisherId: string;
  publisherName: string;
  linkId: string;
  linkName: string;
  clicks: ClickSummary[];
  totalConversions: number;
}

export async function GET(request: NextRequest) {
  if (!secret) {
    console.error('NEXTAUTH_SECRET is not defined!');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const token = await getToken({ req: request, secret });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const search = searchParams.get('search')?.toLowerCase() || '';

  try {
    const where: any = {};

    if (search) {
      where.offer = {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      };
    }

    // Get links with all related data
    const links = await prisma.link.findMany({
      where,
      include: {
        offer: {
          select: {
            id: true,
            name: true,
            offer_url: true,
          },
        },
        publisher: {
          select: {
            id: true,
            name: true,
          },
        },
        clicks: {
          include: {
            publisher: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        conversions: {
          where: {
            offer: where.offer ? { name: { contains: search, mode: 'insensitive' } } : undefined,
          },
        },
      },
      orderBy: [
        { offer: { id: 'asc' } },
        { id: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count
    const totalCount = await prisma.link.count({ where });

    // Format the response
    const offers: OfferWithClicks[] = links.map((link) => {
      const uniqueClicks = Array.from(
        new Map(link.clicks.map((c) => [c.click_id, c])).values()
      );

      const convertedClickIds = new Set(
        link.conversions
          .map((c) => c.click_id)
          .filter((id): id is string => Boolean(id))
      )

      return {
        offerId: link.offer.id.toString(),
        offerName: link.offer.name,
        offerUrl: link.offer.offer_url,
        linkId: link.id,
        linkName: link.name || '',
        publisherId: link.publisher.id,
        publisherName: link.publisher.name,
        totalConversions: link.conversions.length,
        clicks: uniqueClicks.map((click) => ({
          clickId: click.click_id,
          ipAddress: click.ip_address || '',
          userAgent: click.user_agent || '',
          publisherId: click.publisher?.id || null,
          publisherName: click.publisher?.name || null,
          converted: convertedClickIds.has(click.click_id)
        })),
      };
    });

    return NextResponse.json({ offers, totalCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin click data:', error);
    return NextResponse.json({ error: 'Failed to fetch click data' }, { status: 500 });
  }
}
