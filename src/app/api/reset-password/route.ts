// app/api/reset-password/route.ts or pages/api/reset-password.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';
import bcrypt from 'bcryptjs'; // For hashing passwords

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 is a good salt rounds value

    // Update the publisher's password in the database
    const publisher = await prisma.publisher.update({
      where: { email },
      data: { password: hashedPassword },
      select: { id: true },
    });

    if (!publisher) {
      return NextResponse.json({ error: 'User not found or password not changed' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });

  } catch (error: any) {
    if (error.code === 'P2025') {
      // Prisma record not found
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Failed to reset password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}