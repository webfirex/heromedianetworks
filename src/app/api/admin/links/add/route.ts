import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { offer_id, publisher_ids, name, fixed_conversion_rate } = await req.json();

    if (!offer_id) {
      return NextResponse.json({ error: 'Offer is required.' }, { status: 400 });
    }

    // Validate fixed conversion rate
    let fixedRate = 0;
    if (fixed_conversion_rate !== undefined && fixed_conversion_rate !== null && fixed_conversion_rate !== '') {
      const rate = Number(fixed_conversion_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json(
          { error: 'Fixed conversion rate must be between 0 and 100' },
          { status: 400 }
        );
      }
      fixedRate = rate;
    }

    let publisherIdsToInsert: string[] = [];

    if (!publisher_ids || publisher_ids.length === 0) {
      const approvedPublishers = await prisma.publisher.findMany({
        where: { status: 'approved' },
        select: { id: true },
      });
      publisherIdsToInsert = approvedPublishers.map((p) => p.id);
    } else {
      publisherIdsToInsert = publisher_ids;
    }

    if (publisherIdsToInsert.length === 0) {
      return NextResponse.json({ error: 'No publishers found.' }, { status: 400 });
    }

    const linksData = publisherIdsToInsert.map((pubId) => ({
      id: randomUUID(),
      offer_id: parseInt(offer_id, 10),
      publisher_id: pubId,
      name: name || null,
      fixed_conversion_rate: fixedRate,
    }));

    await prisma.link.createMany({
      data: linksData,
      skipDuplicates: true,
    });

    return NextResponse.json({ message: 'Links added successfully.' });
  } catch (err) {
    console.error('Error adding links:', err);
    return NextResponse.json({ error: 'Failed to add links.' }, { status: 500 });
  }
}
