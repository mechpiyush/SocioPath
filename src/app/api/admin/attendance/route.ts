import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

const VALID_STATUSES = ['PENDING', 'PRESENT', 'ABSENT'];

// POST /api/admin/attendance — mark a booking's attendance status (QR scan at entry)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { bookingToken, bookingId, status } = await req.json();

    if (!bookingToken && !bookingId) {
      return NextResponse.json({ error: 'bookingToken or bookingId is required.' }, { status: 400 });
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid attendance status.' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: bookingToken ? { bookingToken } : { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Only confirmed bookings can have attendance marked.' }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { attendance_status: status },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error('Admin attendance error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
