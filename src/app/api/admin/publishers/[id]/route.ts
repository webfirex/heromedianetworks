// /app/api/admin/publishers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { status } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const publisher = await prisma.publisher.update({
      where: { id },
      data: { status: status as 'approved' | 'rejected' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        created_at: true,
        company: true,
      },
    });

    return NextResponse.json({ message: 'Status updated successfully', publisher });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
    }
    console.error('[PATCH /api/admin/publishers/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const token = await getToken({ req: _req as NextRequest, secret });

  if (!token || token.role !== 'admin') {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const { id } = await params;

  try {
    await prisma.publisher.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Publisher deleted successfully',
    });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Publisher not found' },
        { status: 404 }
      );
    }

    console.error('[DELETE /api/admin/publishers/:id]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}