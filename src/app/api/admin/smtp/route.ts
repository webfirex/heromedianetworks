// POST /api/admin/smtp
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Ideally, store this in a secure DB table instead of .env
let smtpSettings: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
} | null = null;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { host, port, secure, user, pass, from } = body;

  if (!host || !port || !user || !pass || !from) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Save to memory or DB
  smtpSettings = { host, port: Number(port), secure, user, pass, from };

  return NextResponse.json({ message: 'SMTP settings saved' });
}

export async function GET() {
  if (!smtpSettings) {
    return NextResponse.json({ error: 'No SMTP settings found' }, { status: 404 });
  }

  return NextResponse.json(smtpSettings);
}

// POST /api/admin/smtp/test
export async function PUT(req: NextRequest) {
  const { to } = await req.json();

  if (!smtpSettings) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      auth: {
        user: smtpSettings.user,
        pass: smtpSettings.pass,
      },
    });

    await transporter.sendMail({
      from: smtpSettings.from,
      to,
      subject: 'SMTP Test Email',
      text: 'Your SMTP settings are working!',
    });

    return NextResponse.json({ message: 'Test email sent' });
  } catch (err) {
    console.log("Error", err)
    return NextResponse.json({ status: 500 });
  }
}
