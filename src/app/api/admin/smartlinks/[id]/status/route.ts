// app/api/admin/smartlinks/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const {id} = await params;
  const body = await req.json();
  const { status } = body;

  if (!['active', 'terminated'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  try {
    await prisma.smartlink.update({
      where: { id },
      data: { status: status as 'active' | 'terminated' },
    });

    return NextResponse.json({ success: true, message: `Smartlink ${status} successfully` });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Smartlink not found' }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Failed to update smartlink status' }, { status: 500 });
  }
}
