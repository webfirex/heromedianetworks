import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        offerPublishers: {
          include: {
            publisher: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const result = {
      id: offer.id,
      name: offer.name,
      offer_url: offer.offer_url,
      description: offer.description,
      geo: offer.geo,
      payout: Number(offer.payout),
      currency: offer.currency,
      status: offer.status,
      fixed_conversion_rate: offer.fixed_conversion_rate ? Number(offer.fixed_conversion_rate) : 0,
      creationDate: offer.created_at,
      advertisers: offer.offerPublishers.map((op) => op.publisher.name),
      commissions: offer.offerPublishers.map((op) => ({
        publisher_id: op.publisher.id,
        name: op.publisher.name,
        commission_percent: op.commission_percent ? Number(op.commission_percent) : null,
        commission_cut: op.commission_cut ? Number(op.commission_cut) : null,
      })),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowedFields = ['name', 'payout', 'currency', 'status', 'offer_url', 'description', 'geo'];
  const updateData: any = {};

  for (const key in body) {
    if (allowedFields.includes(key)) {
      updateData[key] = body[key];
    }
  }

  // Handle commission updates if publisher_id is provided with commission fields
  const hasCommissionFields = (body.commission_percent !== undefined || body.commission_cut !== undefined) && body.publisher_id;

  try {
    await prisma.$transaction(async (tx) => {
      // Update offer if there are fields to update
      if (Object.keys(updateData).length > 0) {
        const offer = await tx.offer.findUnique({
          where: { id: parseInt(id, 10) },
        });

        if (!offer) {
          throw new Error('Offer not found');
        }

        await tx.offer.update({
          where: { id: parseInt(id, 10) },
          data: updateData,
        });
      }

      // Update commission if commission fields are provided
      if (hasCommissionFields) {
        const commissionUpdateData: any = {};
        if (body.commission_percent !== undefined && body.commission_percent !== null) {
          commissionUpdateData.commission_percent = body.commission_percent;
        } else if (body.commission_percent === null) {
          commissionUpdateData.commission_percent = null;
        }
        if (body.commission_cut !== undefined && body.commission_cut !== null) {
          commissionUpdateData.commission_cut = body.commission_cut;
        } else if (body.commission_cut === null) {
          commissionUpdateData.commission_cut = null;
        }

        await tx.offerPublisher.update({
          where: {
            offer_id_publisher_id: {
              offer_id: parseInt(id, 10),
              publisher_id: body.publisher_id,
            },
          },
          data: commissionUpdateData,
        });
      }

      // Add advertiser if publisher_id or name is provided
      if ((body.publisher_id || body.name) && body.commission_percent === undefined && body.commission_cut === undefined) {
        let publisherId = body.publisher_id;

        // If name is provided, look up publisher_id by name
        if (body.name) {
          const publisher = await tx.publisher.findFirst({
            where: { name: body.name },
            select: { id: true },
          });

          if (!publisher) {
            throw new Error('Publisher not found');
          }

          publisherId = publisher.id;
        }

        if (!publisherId) {
          throw new Error('publisher_id or valid name required');
        }

        // Check if offer-publisher exists, if not create it
        const existing = await tx.offerPublisher.findUnique({
          where: {
            offer_id_publisher_id: {
              offer_id: parseInt(id, 10),
              publisher_id: publisherId,
            },
          },
        });

        if (!existing) {
          await tx.offerPublisher.create({
            data: {
              offer_id: parseInt(id, 10),
              publisher_id: publisherId,
            },
          });
        }
      }
    });

    // Return success message indicating what was updated
    const updateTypes = [];
    if (Object.keys(updateData).length > 0) updateTypes.push('offer details');
    if (hasCommissionFields) updateTypes.push('commission');

    return NextResponse.json({
      message: `${updateTypes.join(' and ')} updated successfully`,
      updated: true
    });
  } catch (err: any) {
    if (err.message === 'Offer not found' || err.code === 'P2025') {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    if (err.message === 'Publisher not found') {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
    }
    if (err.message === 'publisher_id or valid name required') {
      return NextResponse.json({ error: 'publisher_id or valid name required' }, { status: 400 });
    }
    console.error('PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const {
    name, payout, currency, status, offer_url, description, geo,
    publisher_id, commission_percent, commission_cut
  } = body;

  if (!name || !payout || !currency || !status || !offer_url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const offer = await tx.offer.update({
        where: { id: parseInt(id, 10) },
        data: {
          name,
          payout,
          currency,
          status: status as 'active' | 'inactive' | 'pending' | 'terminated',
          offer_url,
          description,
          geo,
        },
      });

      if (publisher_id && (commission_percent !== undefined || commission_cut !== undefined)) {
        const updateData: any = {};
        if (commission_percent !== undefined) {
          updateData.commission_percent = commission_percent;
        }
        if (commission_cut !== undefined) {
          updateData.commission_cut = commission_cut;
        }

        await tx.offerPublisher.update({
          where: {
            offer_id_publisher_id: {
              offer_id: parseInt(id, 10),
              publisher_id: publisher_id,
            },
          },
          data: updateData,
        });
      }
    });

    const updatedOffer = await prisma.offer.findUnique({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ updated: updatedOffer });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    console.error('PUT error:', err);
    return NextResponse.json({ error: 'Failed to fully update offer' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { publisher_id } = body;

  if (!publisher_id) {
    console.log("MISSING PUB ID", body);
  }

  const offerId = parseInt(id, 10);

  try {
    const queries = [];
  
    // Conditionally add advertiser delete
    if (publisher_id) {
      queries.push(
        prisma.offerPublisher.delete({
          where: {
            offer_id_publisher_id: {
              offer_id: offerId,
              publisher_id,
            },
          },
        })
      );
    }
  
    queries.push(
      prisma.offer.delete({
        where: { id: offerId },
      })
    );
  
    await prisma.$transaction(queries);
  
    return NextResponse.json({
      message: 'Advertiser removed and offer deleted successfully',
    });
  
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    console.error('DELETE error:', err);
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
}

