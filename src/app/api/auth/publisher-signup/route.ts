import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db"; // Your PostgreSQL connection pool

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

    const exists = await pool.query(
  "SELECT id FROM publishers WHERE email = $1",
  [body.email]
);

if (exists && typeof exists.rowCount === "number" && exists.rowCount > 0) {
  return NextResponse.json(
    { message: "Email" },
    { status: 409 }
  );
} else {
  // Proceed to insert
  const hashedPassword = await bcrypt.hash(body.password, 10);

  await pool.query(
    `INSERT INTO publishers (name, email, company, phone, password) 
     VALUES ($1, $2, $3, $4, $5)`,
    [body.name, body.email, body.company, body.phone, hashedPassword]
  );

  return NextResponse.json({ message: "Signup successful" }, { status: 201 });
}

  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
