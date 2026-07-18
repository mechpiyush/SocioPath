import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, setSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { name, gender, city, hometown, occupation, mobile, dob, instagram } = await req.json();

    // Basic validation
    if (gender && !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      return NextResponse.json({ error: 'Invalid gender value.' }, { status: 400 });
    }

    // Update in database
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        name: name !== undefined ? name : undefined,
        gender: gender !== undefined ? gender : undefined,
        city: city !== undefined ? city : undefined,
        hometown: hometown !== undefined ? hometown : undefined,
        occupation: occupation !== undefined ? occupation : undefined,
        mobile: mobile !== undefined ? mobile : undefined,
        dob: dob !== undefined ? dob : undefined,
        instagram: instagram !== undefined ? instagram : undefined,
      },
    });

    // Update session
    await setSession({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      image: updatedUser.image,
      role: updatedUser.role,
      gender: updatedUser.gender,
      city: updatedUser.city,
      hometown: updatedUser.hometown,
      occupation: updatedUser.occupation,
      mobile: updatedUser.mobile,
      dob: updatedUser.dob,
      instagram: updatedUser.instagram,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
