// app/api/reset-password/route.ts or pages/api/reset-password.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // Your database connection pool
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
    const { rowCount } = await pool.query(
      'UPDATE publishers SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    if (rowCount === 0) {
      return NextResponse.json({ error: 'User not found or password not changed' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Failed to reset password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}