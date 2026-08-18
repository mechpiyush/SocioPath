import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOtp, isValidIndianPhone, sendOtp } from '@/lib/otp';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !isValidIndianPhone(phone)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit Indian mobile number.' }, { status: 400 });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.phoneOtp.create({
      data: {
        id: crypto.randomUUID(),
        phone,
        otp,
        expiresAt,
      },
    });

    await sendOtp(phone, otp);

    return NextResponse.json({ success: true, message: 'OTP sent.' });
  } catch (error) {
    console.error('Phone OTP send error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
