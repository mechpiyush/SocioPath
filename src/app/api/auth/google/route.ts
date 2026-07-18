import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/db';
import { setSession } from '@/lib/auth';

const clientId = process.env.GOOGLE_CLIENT_ID;
const client = clientId ? new OAuth2Client(clientId) : null;

export async function POST(req: NextRequest) {
  try {
    const { credential, isMock, mockData } = await req.json();

    let email: string;
    let name: string | null = null;
    let image: string | null = null;

    if (isMock || !client) {
      // Simulate mock login
      if (!mockData || !mockData.email) {
        return NextResponse.json({ error: 'Mock login requires email' }, { status: 400 });
      }
      email = mockData.email;
      name = mockData.name || 'Mock User';
      image = mockData.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
    } else {
      // Real Google token verification
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
        }
        email = payload.email;
        name = payload.name || null;
        image = payload.picture || null;
      } catch (err) {
        console.error('Google token verification failed:', err);
        return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
      }
    }

    // Provision or update user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
          role: 'USER',
        },
      });
    } else {
      // Update name/image if changed
      user = await prisma.user.update({
        where: { email },
        data: {
          name: name || user.name,
          image: image || user.image,
        },
      });
    }

    // Set the secure session cookie
    await setSession({
      id: user.id,
      email: user.email,
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
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Auth endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
