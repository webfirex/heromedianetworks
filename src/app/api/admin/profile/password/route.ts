// app/api/admin/profile/password/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db-prisma';
import bcrypt from 'bcryptjs';

const secret = process.env.NEXTAUTH_SECRET; // Your NextAuth secret

// --- PATCH Method: Update Current User's Password ---
export async function PATCH(req: Request) {
  try {
    // Get the session token
    const token = await getToken({ req: req as NextRequest, secret });

    // Ensure the user is authenticated and the token contains their ID
    if (!token || !token.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized: No active session or user ID in token.' }), { status: 401 });
    }

    const { newPassword } = await req.json();

    // Basic validation for the new password
    if (!newPassword || newPassword.length < 8) {
      return new NextResponse(JSON.stringify({ error: 'New password must be at least 8 characters long.' }), { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Get the user ID from the token
    const userId = token.id;

    // Update the password in the database
    try {
      await prisma.admin.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return new NextResponse(JSON.stringify({ error: 'User not found in database.' }), { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Error resetting current user password:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}