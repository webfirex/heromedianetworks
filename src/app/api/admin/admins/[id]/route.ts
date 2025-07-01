// app/api/admin/admins/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';

const secret = process.env.NEXTAUTH_SECRET;

// --- PATCH Method: Update Administrator Details (Name, Email, Role, Status) ---
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: req as NextRequest, secret });

    if (!token || token.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;
    const { name, email, role, status } = await req.json();

    if (!name || !email || !role || !status) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields for update.' }), { status: 400 });
    }

    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(role)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid role provided.' }), { status: 400 });
    }

    const allowedStatuses = ['active', 'inactive', 'suspended'];
    if (!allowedStatuses.includes(status)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid status provided.' }), { status: 400 });
    }

    const result = await pool.query(
      `UPDATE admins SET name = $1, email = $2, role = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, name, email, role, status`,
      [name, email, role, status, id]
    );

    if (result.rowCount === 0) {
      return new NextResponse(JSON.stringify({ error: 'Administrator not found.' }), { status: 404 });
    }

    return NextResponse.json({ message: 'Administrator updated successfully.', admin: result.rows[0] });

  } catch (error) {
    console.error('Error updating administrator details:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// --- DELETE Method: Delete Administrator --- (NEW)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: req as NextRequest, secret });

    // Authorization: Only 'admin' role can delete administrators
    // You might want to add a check here to prevent a 'super_admin' from deleting themselves,
    // or to prevent deletion of the *last* 'super_admin'.
    if (!token || token.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params; // Get the admin ID from the URL parameters

    // Prevent deletion of 'super_admin' if this is a critical safeguard
    // This is a simple check; more robust logic might be needed for real-world scenarios.
    const adminQueryResult = await pool.query('SELECT role FROM admins WHERE id = $1', [id]);
    if (adminQueryResult.rowCount === 0) {
      return new NextResponse(JSON.stringify({ error: 'Administrator not found.' }), { status: 404 });
    }
    if (adminQueryResult.rows[0].role === 'super_admin') {
        // You might want to implement more sophisticated logic for super_admin deletion
        // e.g., only another super_admin can delete a super_admin, or deny if it's the last one.
        // For now, we'll just return a forbidden message for simplicity.
        // If you want to allow deletion of super_admins, remove or modify this check.
        return new NextResponse(JSON.stringify({ error: 'Cannot delete a Super Admin directly.' }), { status: 403 });
    }


    const result = await pool.query(
      `DELETE FROM admins WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return new NextResponse(JSON.stringify({ error: 'Administrator not found.' }), { status: 404 });
    }

    return NextResponse.json({ message: 'Administrator deleted successfully.' });

  } catch (error) {
    console.error('Error deleting administrator:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
