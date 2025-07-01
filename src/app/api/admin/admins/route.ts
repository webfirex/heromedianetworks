// app/api/admin/admins/route.ts
import { NextResponse, NextRequest } from 'next/server'; // Import NextRequest
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

const secret = process.env.NEXTAUTH_SECRET;

// --- GET Method: List Administrators ---
export async function GET(req: Request) { // 'req' is of type Request
  try {
    // Cast 'req' to NextRequest for getToken
    const token = await getToken({ req: req as NextRequest, secret });

    if (!token || token.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const countResult = await pool.query('SELECT COUNT(*) FROM admins');
    const totalCount = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT id, name, email, role, status, created_at, updated_at
       FROM admins
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return NextResponse.json({ admins: result.rows, totalCount });
  } catch (error) {
    console.error('Error fetching administrators:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch administrators.' }), { status: 500 });
  }
}

// --- POST Method: Add New Administrator ---
export async function POST(req: Request) { // 'req' is of type Request
  try {
    // Cast 'req' to NextRequest for getToken
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
      const result = await pool.query(
        `INSERT INTO admins (name, email, password, role, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, status, created_at`,
        [name, email, hashedPassword, role, status]
      );
      return NextResponse.json({ message: 'Administrator added successfully', admin: result.rows[0] });
    } catch (dbError) {
  console.error('Database error:', dbError);

  if (typeof dbError === 'object' && dbError !== null && 'code' in dbError) {
    const pgError = dbError as { code: string };

    if (pgError.code === '23505') {
      return new NextResponse(JSON.stringify({ error: 'Email already exists.' }), { status: 409 });
    }
  }
      console.error('Database error adding admin:', dbError);
      return new NextResponse(JSON.stringify({ error: 'Database error occurred.' }), { status: 500 });
    }

  } catch (error) {
    console.error('Error adding administrator:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Cast 'req' to NextRequest for getToken
    const token = await getToken({ req: req as NextRequest, secret });

    // Authorization: Only 'admin' role can update other admin details
    if (!token || token.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params; // Get the admin ID from the URL parameters
    const { name, email, role, status } = await req.json(); // Get updated fields from request body

    // Basic validation (add more as needed for your specific requirements)
    if (!name || !email || !role || !status) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields for update.' }), { status: 400 });
    }

    // You might want to add more specific validation for email format, role values, status values etc.
    // Example:
    const allowedRoles = ['admin', 'super_admin', 'editor']; // Ensure this matches your frontend and database enum/constraint
    if (!allowedRoles.includes(role)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid role provided.' }), { status: 400 });
    }

    const allowedStatuses = ['active', 'inactive', 'suspended']; // Ensure this matches
    if (!allowedStatuses.includes(status)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid status provided.' }), { status: 400 });
    }


    // Construct the SQL query dynamically based on provided fields
    // This example updates all four fields. If you want true partial updates,
    // you'd build the query conditionally. For now, we'll assume all 4 are always sent.
    const result = await pool.query(
      `UPDATE admins SET name = $1, email = $2, role = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, name, email, role, status`,
      [name, email, role, status, id]
    );

    if (result.rowCount === 0) {
      return new NextResponse(JSON.stringify({ error: 'Administrator not found.' }), { status: 404 });
    }

    // Return the updated administrator's details (or a success message)
    return NextResponse.json({ message: 'Administrator updated successfully.', admin: result.rows[0] });

  } catch (error) {
    console.error('Error updating administrator details:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}