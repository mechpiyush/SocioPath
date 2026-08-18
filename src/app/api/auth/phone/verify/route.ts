import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setSession } from '@/lib/auth';
import { isValidIndianPhone } from '@/lib/otp';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !isValidIndianPhone(phone)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit Indian mobile number.' }, { status: 400 });
    }
    if (!otp) {
      return NextResponse.json({ error: 'OTP is required.' }, { status: 400 });
    }

    const record = await prisma.phoneOtp.findFirst({
      where: {
        phone,
        otp,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP. Please request a new one.' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          phone,
          phoneVerified: true,
          role: 'USER',
        },
      });
    } else if (!user.phoneVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    }

    await prisma.phoneOtp.update({
      where: { id: record.id },
      data: { verified: true, userId: user.id },
    });

    await setSession({
      id: user.id,
      email: user.email || '',
      name: user.name,
      image: user.image,
      role: user.role,
      gender: user.gender,
      city: user.city,
      hometown: user.hometown,
      occupation: user.occupation,
      mobile: user.mobile,
      dob: user.dob,
      instagram: user.instagram,
      phone: user.phone,
      emailVerified: (user as any).emailVerified,
      phoneVerified: (user as any).phoneVerified,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Phone OTP verify error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
