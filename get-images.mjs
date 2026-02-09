import { db } from './server/db.js';
import { propertyTours } from './drizzle/schema.js';
import { desc } from 'drizzle-orm';

const recent = await db.select().from(propertyTours).orderBy(desc(propertyTours.createdAt)).limit(1);
if (recent.length > 0) {
  console.log('Most recent property tour:');
  console.log('Address:', recent[0].address);
  const images = JSON.parse(recent[0].imageUrls);
  console.log('Images:', images);
  console.log('\nFirst image URL:', images[0]);
} else {
  console.log('No property tours found');
}
process.exit(0);
