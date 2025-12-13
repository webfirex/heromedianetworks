// app/api/admin/admins/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db-prisma';
import bcrypt from 'bcryptjs';

const secret = process.env.NEXTAUTH_SECRET;

// --- GET Method: List Administrators ---
export async function GET(req: Request) {
  try {
    const token = await getToken({ req: req as NextRequest, secret });

    if (!token || token.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [admins, totalCount] = await Promise.all([
      prisma.admin.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.admin.count(),
    ]);

    return NextResponse.json({ admins, totalCount });
  } catch (error) {
    console.error('Error fetching administrators:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch administrators.' }), { status: 500 });
  }
}

// --- POST Method: Add New Administrator ---
export async function POST(req: Request) {
  try {
    const token = await getToken({ req: req as NextRequest, secret });

    if (!token || token.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { name, email, password, role, status } = await req.json();

    if (!name || !email || !password || !role || !status) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid email format' }), { status: 400 });
    }

    if (password.length < 7) {
      return new NextResponse(JSON.stringify({ error: 'Password must be at least 7 characters long' }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const admin = await prisma.admin.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role as 'admin' | 'super_admin' | 'editor',
          status: status as 'active' | 'inactive' | 'suspended',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          created_at: true,
        },
      });

      return NextResponse.json({ message: 'Administrator added successfully', admin });
    } catch (dbError: any) {
      console.error('Database error:', dbError);

      if (dbError.code === 'P2002') {
        return new NextResponse(JSON.stringify({ error: 'Email already exists.' }), { status: 409 });
      }

      console.error('Database error adding admin:', dbError);
      return new NextResponse(JSON.stringify({ error: 'Database error occurred.' }), { status: 500 });
    }
  } catch (error) {
    console.error('Error adding administrator:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
