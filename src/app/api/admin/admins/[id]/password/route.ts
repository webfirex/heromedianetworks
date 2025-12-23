import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db-prisma';
import bcrypt from 'bcryptjs';

const secret = process.env.NEXTAUTH_SECRET;

export async function PATCH(req: NextRequest, {params}: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req, secret });

    if (!token || token.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return new NextResponse(JSON.stringify({ error: 'New password must be at least 8 characters long.' }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'Administrator not found.' }), { status: 404 });
    }
    console.error('Error updating administrator password:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
