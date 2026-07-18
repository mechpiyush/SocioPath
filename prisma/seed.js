const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.booking.deleteMany();
  await prisma.event.deleteMany();

  // Find upcoming Friday and Saturday
  const now = new Date();
  const nextFriday = new Date();
  nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
  nextFriday.setHours(20, 0, 0, 0); // 8 PM

  const nextSaturday = new Date(nextFriday);
  nextSaturday.setDate(nextFriday.getDate() + 1);
  nextSaturday.setHours(20, 0, 0, 0); // 8 PM

  const events = [
    {
      title: 'Friday Night Jam - Pure Music & Karaoke',
      description: 'A secluded, late-night open mic, acoustic jamming, and collaborative group karaoke experience. Overnight villa stay, premium starters, designated food menu, and beverages included (BYOD option fully supported).',
      date: nextFriday,
      price: 1500,
      minCapacity: 10,
      maxCapacity: 20,
      status: 'PENDING',
    },
    {
      title: 'Saturday Night Social - The Complete Stranger Experience',
      description: 'A highly structured night featuring a 2-hour music ice-breaker followed by engaging indoor strategic card/board games specifically designed to pair strangers up, facilitate networking, and forge new friendships. Overnight villa stay, premium starters, designated food menu, and beverages included (BYOD option fully supported).',
      date: nextSaturday,
      price: 1500,
      minCapacity: 10,
      maxCapacity: 20,
      status: 'PENDING',
    }
  ];

  for (const event of events) {
    const created = await prisma.event.create({
      data: event
    });
    console.log(`Created event: ${created.title} on ${created.date}`);
  }

  console.log('Seeding finished.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
