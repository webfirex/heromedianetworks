import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token || !token.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: token.email },
      select: { created_at: true },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ registeredAt: admin.created_at });
  } catch (error) {
    console.error('[GET /api/admin/profile/info]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
