import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db-prisma";

interface PublisherSignupRequest {
  name: string;
  email: string;
  company: string;
  phone: string;
  password: string;
}

export async function POST(req: Request) {
  try {
    const body: PublisherSignupRequest = await req.json();

    if (!body.email || !body.password || !body.name || !body.company || !body.phone) {
      return NextResponse.json({ message: "Missing" }, { status: 400 });
    }

    // Check if publisher already exists
    const existing = await prisma.publisher.findUnique({
      where: { email: body.email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Email" },
        { status: 409 }
      );
    }

    // Hash password and create publisher
    const hashedPassword = await bcrypt.hash(body.password, 10);

    await prisma.publisher.create({
      data: {
        name: body.name,
        email: body.email,
        company: body.company,
        phone: body.phone,
        password: hashedPassword,
        status: 'pending',
      },
    });

    return NextResponse.json({ message: "Signup successful" }, { status: 201 });
  } catch (err) {
    console.error('Publisher signup error:', err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
