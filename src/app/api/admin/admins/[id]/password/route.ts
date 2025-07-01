import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
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

    const result = await pool.query(
      `UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id`,
      [hashedPassword, id]
    );

    if (result.rowCount === 0) {
      return new NextResponse(JSON.stringify({ error: 'Administrator not found.' }), { status: 404 });
    }

    return NextResponse.json({ message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Error updating administrator password:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
