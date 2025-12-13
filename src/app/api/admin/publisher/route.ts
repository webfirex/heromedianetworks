import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db-prisma';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret });

  if (!token || (token.role !== 'admin' && token.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const publishers = await prisma.publisher.findMany({
      where: { status: 'approved' },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(publishers, { status: 200 });
  } catch (error) {
    console.error('Error fetching publishers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
