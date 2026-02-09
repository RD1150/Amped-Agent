import { getDb } from './server/db.js';
import { propertyTours } from './drizzle/schema.js';
import { desc } from 'drizzle-orm';

const db = getDb();
const recent = await db.select().from(propertyTours).orderBy(desc(propertyTours.createdAt)).limit(1);

if (recent.length > 0) {
  const tour = recent[0];
  console.log('Most recent property tour:');
  console.log('ID:', tour.id);
  console.log('Address:', tour.address);
  console.log('Status:', tour.status);
  console.log('Video Mode:', tour.videoMode);
  console.log('Error Message:', tour.errorMessage || 'None');
  console.log('Created:', tour.createdAt);
} else {
  console.log('No property tours found');
}
process.exit(0);
