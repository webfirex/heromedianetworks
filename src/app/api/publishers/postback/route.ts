// File: pages/api/publishers/postback.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db-prisma';

const secret = process.env.NEXTAUTH_SECRET;

// Extend JWT interface if not already done globally
declare module "next-auth/jwt" {
  interface JWT {
    id?: string; // Assuming 'sub' from token is 'id'
    role?: string; // If you plan to add roles to publishers as well
  }
}

interface ClickSummary {
  clickId: string;
  ipAddress: string;
  userAgent: string;
  converted: boolean;
}

interface OfferWithClicks {
  offerId: string;
  offerName: string;
  offerUrl: string;
  linkId: string;
  linkName: string;
  totalClicks: number;
  totalConversions: number; // ADDED: Total conversions for this offer-link combo
  clicks: ClickSummary[];
}

export async function GET(request: NextRequest) {
  if (!secret) {
    console.error('Missing NEXTAUTH_SECRET');
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const token = await getToken({ req: request, secret });
  if (!token || !token.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const publisherId = searchParams.get('publisher_id');
  const search = searchParams.get('search')?.toLowerCase() || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  if (!publisherId || publisherId !== token.sub) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Build where clause for search
    const whereClause: any = {
      publisher_id: publisherId,
    };

    if (search) {
      whereClause.offer = {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      };
    }

    // Get links with offers, clicks, and conversions
    const links = await prisma.link.findMany({
      where: whereClause,
      include: {
        offer: true,
        clicks: {
          select: {
            click_id: true,
            ip_address: true,
            user_agent: true,
          },
        },
        conversions: {
          select: {
            id: true,
            click_id: true
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const totalCount = await prisma.link.count({
      where: whereClause,
    });

    // Format the response
    const offers: OfferWithClicks[] = links.map((link) => {
      const uniqueClicks = Array.from(
        new Map(link.clicks.map((c) => [c.click_id, c])).values()
      );

      const convertedClickIds = new Set(
        link.conversions
        .map((c) =>c.click_id)
        .filter((id): id is string => Boolean(id))
      )

      return {
        offerId: link.offer.id.toString(),
        offerName: link.offer.name,
        offerUrl: link.offer.offer_url,
        linkId: link.id,
        linkName: link.name || '',
        totalClicks: uniqueClicks.length,
        totalConversions: link.conversions.length,
        clicks: uniqueClicks.map((click) => ({
          clickId: click.click_id,
          ipAddress: click.ip_address || '',
          userAgent: click.user_agent || '',
          converted: convertedClickIds.has(click.click_id)
        })),
      };
    });

    return NextResponse.json({ offers, totalCount }, { status: 200 });
  } catch (err) {
    console.error('Error fetching publisher click data:', err);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}