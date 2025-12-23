// app/api/admin/admins/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db-prisma';

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

    try {
      const admin = await prisma.admin.update({
        where: { id },
        data: {
          name,
          email,
          role: role as 'admin' | 'super_admin' | 'editor',
          status: status as 'active' | 'inactive' | 'suspended',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });

      return NextResponse.json({ message: 'Administrator updated successfully.', admin });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return new NextResponse(JSON.stringify({ error: 'Administrator not found.' }), { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating administrator details:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// --- DELETE Method: Delete Administrator ---
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: req as NextRequest, secret });

    if (!token || token.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await params;

    // Check if admin exists and prevent deletion of super_admin
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!admin) {
      return new NextResponse(JSON.stringify({ error: 'Administrator not found.' }), { status: 404 });
    }

    if (admin.role === 'super_admin') {
      return new NextResponse(JSON.stringify({ error: 'Cannot delete a Super Admin directly.' }), { status: 403 });
    }

    await prisma.admin.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Administrator deleted successfully.' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'Administrator not found.' }), { status: 404 });
    }
    console.error('Error deleting administrator:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
