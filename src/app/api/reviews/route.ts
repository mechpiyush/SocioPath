import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            name: true,
            image: true,
            gender: true,
            occupation: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Load latest 20 reviews
    });

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { rating, comment } = await req.json();

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating. Must be between 1 and 5.' }, { status: 400 });
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment cannot be empty.' }, { status: 400 });
    }

    // Auto-provision user in this container if they don't exist yet
    let user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      await prisma.user.create({
        data: {
          id: session.id,
          email: session.email,
          name: session.name,
          image: session.image,
          role: session.role,
        },
      });
    }

    const review = await prisma.review.create({
      data: {
        userId: session.id,
        rating: Math.round(rating),
        comment: comment.trim(),
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            gender: true,
            occupation: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
