/**
 * SocioPath — Full Database Seed
 * Populates: Users (admin + internal + external), Events, Reviews, ActionLogs
 *
 * Initial user base:
 *   iiit.piyush@gmail.com  → ADMIN
 *   shubsspa@gmail.com     → External (USER)
 *   + 3 internal test users
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

// ── Date helpers ─────────────────────────────────────────────────────────────
function getNextWeekday(dayOfWeek, hour = 20) {
  // dayOfWeek: 0=Sun, 1=Mon, 5=Fri, 6=Sat
  const now = new Date();
  const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
  const d = new Date(now);
  d.setDate(now.getDate() + daysUntil);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function getLastWeekdayOfMonth(dayOfWeek, hour = 18) {
  // dayOfWeek: 0=Sun, 6=Sat
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of this month
  let d = new Date(lastDay);
  while (d.getDay() !== dayOfWeek) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(hour, 0, 0, 0);
  // If that date is already past, return next occurrence
  if (d < now) {
    const next = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    while (next.getDay() !== dayOfWeek) next.setDate(next.getDate() - 1);
    next.setHours(hour, 0, 0, 0);
    return next;
  }
  return d;
}

// ── Past date helper for reviews / past events ────────────────────────────────
function daysAgo(n, hour = 20) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Starting SocioPath database seed...\n');

  // ── 1. Wipe existing data (order matters due to FK constraints) ──────────────
  console.log('🗑  Clearing old data...');
  await prisma.actionLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // ── 2. Users ──────────────────────────────────────────────────────────────────
  console.log('👥 Creating users...');

  const admin = await prisma.user.create({
    data: {
      id: 'user-admin-piyush',
      email: 'iiit.piyush@gmail.com',
      name: 'Piyush Sharma',
      role: 'ADMIN',
      gender: 'MALE',
      city: 'Mumbai',
      hometown: 'Jaipur',
      occupation: 'Software Engineer',
      mobile: '9876543210',
      dob: '1998-03-15',
      instagram: '@piyush.builds',
    },
  });

  const externalUser = await prisma.user.create({
    data: {
      id: 'user-external-shubham',
      email: 'shubsspa@gmail.com',
      name: 'Shubham Sharma',
      role: 'USER',
      gender: 'MALE',
      city: 'Mumbai',
      hometown: 'Lucknow',
      occupation: 'Product Manager',
      mobile: '9123456789',
      dob: '1997-07-22',
      instagram: '@shubham.spa',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      id: 'user-priya-mehta',
      email: 'priya.mehta@gmail.com',
      name: 'Priya Mehta',
      role: 'USER',
      gender: 'FEMALE',
      city: 'Mumbai',
      hometown: 'Pune',
      occupation: 'UI/UX Designer',
      mobile: '9234567890',
      dob: '2000-01-10',
      instagram: '@priya.creates',
    },
  });

  const user4 = await prisma.user.create({
    data: {
      id: 'user-arjun-kapoor',
      email: 'arjun.kapoor@gmail.com',
      name: 'Arjun Kapoor',
      role: 'USER',
      gender: 'MALE',
      city: 'Mumbai',
      hometown: 'Delhi',
      occupation: 'Startup Founder',
      mobile: '9345678901',
      dob: '1996-11-03',
      instagram: '@arjun.builds',
    },
  });

  const user5 = await prisma.user.create({
    data: {
      id: 'user-ananya-singh',
      email: 'ananya.singh@gmail.com',
      name: 'Ananya Singh',
      role: 'USER',
      gender: 'FEMALE',
      city: 'Mumbai',
      hometown: 'Varanasi',
      occupation: 'Marketing Manager',
      mobile: '9456789012',
      dob: '1999-05-25',
      instagram: '@ananya.vibes',
    },
  });

  console.log(`   ✓ ${[admin, externalUser, user3, user4, user5].length} users created`);

  // ── 3. Events ─────────────────────────────────────────────────────────────────
  console.log('🎉 Creating events...');

  const nextFriday    = getNextWeekday(5, 20); // 8 PM
  const nextSaturday  = getNextWeekday(6, 20);
  const lastSaturday  = getLastWeekdayOfMonth(6, 19); // 7 PM
  const lastSunday    = getLastWeekdayOfMonth(0, 16); // 4 PM

  const events = await Promise.all([
    prisma.event.create({
      data: {
        id: 'evt-friday-jam',
        title: 'Friday Night Jam — Pure Music & Karaoke',
        description:
          'A secluded, late-night open mic, acoustic jamming, and collaborative group karaoke experience. Overnight villa stay, premium starters, designated food menu, and beverages included (BYOD option fully supported). The perfect way to kick off your weekend with kindred spirits.',
        date: nextFriday,
        price: 1500,
        femaleDiscount: 300,
        genderPricingEnabled: true,
        minCapacity: 10,
        maxCapacity: 20,
        status: 'PENDING',
      },
    }),

    prisma.event.create({
      data: {
        id: 'evt-saturday-social',
        title: 'Saturday Night Social — The Complete Stranger Experience',
        description:
          'A highly structured night featuring a 2-hour music ice-breaker followed by engaging indoor strategic card/board games specifically designed to pair strangers, facilitate networking, and forge new friendships. Overnight villa stay, premium starters, designated food menu, and beverages included.',
        date: nextSaturday,
        price: 1500,
        femaleDiscount: 300,
        genderPricingEnabled: true,
        minCapacity: 10,
        maxCapacity: 20,
        status: 'PENDING',
      },
    }),

    prisma.event.create({
      data: {
        id: 'evt-bhajan-sat',
        title: 'Bhajan Jamming — Evening of Devotional Music',
        description:
          'An intimate sunset bhajan session at a scenic Mumbai villa — join a soulful circle of devotional music lovers for an evening of bhajans, harmonium, tabla, and collective singing. No experience needed, just an open heart. Light sattvic dinner and chai included. The perfect way to find community, peace, and inner stillness.',
        date: lastSaturday,
        price: 800,
        femaleDiscount: 0,
        genderPricingEnabled: false,
        minCapacity: 8,
        maxCapacity: 15,
        status: 'PENDING',
      },
    }),

    prisma.event.create({
      data: {
        id: 'evt-bhajan-sun',
        title: 'Bhajan Jamming — Sunday Soul Gathering',
        description:
          'End your weekend on a high note with an afternoon bhajan circle. Brought to you by the SocioPath community, this Sunday soul gathering blends traditional bhajan singing with modern acoustic instruments in a cozy villa setting. Sattvic snacks and herbal tea served. All are welcome — no singing experience required.',
        date: lastSunday,
        price: 800,
        femaleDiscount: 0,
        genderPricingEnabled: false,
        minCapacity: 8,
        maxCapacity: 15,
        status: 'PENDING',
      },
    }),
  ]);

  console.log(`   ✓ ${events.length} events created`);
  events.forEach(e => console.log(`     → [${e.id}] ${e.title} on ${e.date.toDateString()}`));

  // ── 4. Reviews ────────────────────────────────────────────────────────────────
  console.log('⭐ Creating reviews...');

  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        userId: user3.id,
        rating: 5,
        comment: 'Absolutely loved the Friday Night Jam! The villa was beautiful, the music was incredible, and I made friends I\'ll have for life. SocioPath events are genuinely unlike anything else in Mumbai.',
        createdAt: daysAgo(12),
      },
    }),
    prisma.review.create({
      data: {
        userId: externalUser.id,
        rating: 5,
        comment: 'The Stranger Experience was mind-blowing. I walked in not knowing a single person and left with a WhatsApp group of 15 new friends. The games were so cleverly designed to get people talking authentically.',
        createdAt: daysAgo(8),
      },
    }),
    prisma.review.create({
      data: {
        userId: user4.id,
        rating: 4,
        comment: 'Great vibes, great crowd, amazing food. As a founder I\'m always "networking" — this was the first time it felt completely natural and human. Will definitely be back.',
        createdAt: daysAgo(5),
      },
    }),
    prisma.review.create({
      data: {
        userId: user5.id,
        rating: 5,
        comment: 'Attended the bhajan session last month and it was the most peaceful evening I\'ve had in years. The harmonium player was phenomenal and the sattvic dinner was surprisingly delicious. ✨',
        createdAt: daysAgo(3),
      },
    }),
    prisma.review.create({
      data: {
        userId: user3.id,
        rating: 5,
        comment: 'I\'ve been to 3 SocioPath events now and every single one has exceeded expectations. The curation, the crowd quality, the venue — all world-class. This is the hidden gem of Mumbai nightlife.',
        createdAt: daysAgo(1),
      },
    }),
  ]);

  console.log(`   ✓ ${reviews.length} reviews created`);

  // ── 5. Action Logs ────────────────────────────────────────────────────────────
  console.log('📋 Creating action logs...');

  const logs = await Promise.all([
    prisma.actionLog.create({ data: { userId: admin.id, action: 'LOGIN', metadata: '{"provider":"google"}', createdAt: daysAgo(30) } }),
    prisma.actionLog.create({ data: { userId: admin.id, action: 'EVENT_CREATED', metadata: `{"eventId":"evt-friday-jam"}`, createdAt: daysAgo(25) } }),
    prisma.actionLog.create({ data: { userId: admin.id, action: 'EVENT_CREATED', metadata: `{"eventId":"evt-saturday-social"}`, createdAt: daysAgo(25) } }),
    prisma.actionLog.create({ data: { userId: admin.id, action: 'EVENT_CREATED', metadata: `{"eventId":"evt-bhajan-sat"}`, createdAt: daysAgo(10) } }),
    prisma.actionLog.create({ data: { userId: admin.id, action: 'EVENT_CREATED', metadata: `{"eventId":"evt-bhajan-sun"}`, createdAt: daysAgo(10) } }),
    prisma.actionLog.create({ data: { userId: externalUser.id, action: 'LOGIN', metadata: '{"provider":"google"}', createdAt: daysAgo(20) } }),
    prisma.actionLog.create({ data: { userId: externalUser.id, action: 'PROFILE_UPDATED', metadata: '{"fields":["gender","city"]}', createdAt: daysAgo(20) } }),
    prisma.actionLog.create({ data: { userId: user3.id, action: 'LOGIN', metadata: '{"provider":"mock"}', createdAt: daysAgo(15) } }),
    prisma.actionLog.create({ data: { userId: user4.id, action: 'LOGIN', metadata: '{"provider":"mock"}', createdAt: daysAgo(8) } }),
    prisma.actionLog.create({ data: { userId: user5.id, action: 'LOGIN', metadata: '{"provider":"mock"}', createdAt: daysAgo(4) } }),
  ]);

  console.log(`   ✓ ${logs.length} action logs created`);

  console.log('\n✅ Seeding complete!\n');
  console.log('Summary:');
  console.log(`  👥 Users: 5 (1 admin, 4 regular)`);
  console.log(`  🎉 Events: ${events.length}`);
  console.log(`  ⭐ Reviews: ${reviews.length}`);
  console.log(`  📋 Action logs: ${logs.length}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
