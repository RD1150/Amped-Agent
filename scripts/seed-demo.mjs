/**
 * seed-demo.mjs
 * Seeds the demo@ampedagent.com account with realistic data
 * so auditors see a fully populated, lived-in experience.
 * Run: node scripts/seed-demo.mjs
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const DEMO_EMAIL = 'demo@ampedagent.com';
const DEMO_PASSWORD = 'AmpedDemo2026!';
const DEMO_NAME = 'Sarah Mitchell';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ── 1. Ensure demo user exists ─────────────────────────────────────────────
const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
const openId = 'email_' + crypto.createHash('sha256').update(DEMO_EMAIL).digest('hex').slice(0, 32);

const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [DEMO_EMAIL]);
let demoId;
if (existing.length > 0) {
  demoId = existing[0].id;
  await conn.execute(
    `UPDATE users SET name=?, passwordHash=?, hasCompletedOnboarding=1, creditBalance=250, role='user' WHERE id=?`,
    [DEMO_NAME, hash, demoId]
  );
  console.log('✓ Demo user updated, id:', demoId);
} else {
  const [ins] = await conn.execute(
    `INSERT INTO users (openId,email,name,loginMethod,role,passwordHash,hasCompletedOnboarding,creditBalance)
     VALUES (?,?,?,'email','user',?,1,250)`,
    [openId, DEMO_EMAIL, DEMO_NAME, hash]
  );
  demoId = ins.insertId;
  console.log('✓ Demo user created, id:', demoId);
}

async function clearTable(table) {
  await conn.execute(`DELETE FROM ${table} WHERE userId = ?`, [demoId]);
}

// ── 2. Persona ─────────────────────────────────────────────────────────────
await clearTable('personas');
await conn.execute(`
  INSERT INTO personas (userId, agentName, brokerage, primaryCity, primaryState, phoneNumber, emailAddress,
    bio, yearsExperience, localHighlights, targetNeighborhoods,
    targetZipCodes, brandVoice, tagline, socialHandles, isCompleted)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`, [
  demoId,
  'Sarah Mitchell',
  'Compass Real Estate',
  'Austin', 'TX',
  '(512) 555-0192',
  'sarah@compassaustin.com',
  "With over 12 years helping buyers and sellers navigate Austin's dynamic market, I specialize in luxury homes, new construction, and relocation. My deep roots in the community mean I know every neighborhood, school district, and hidden gem — so you always get the inside edge.",
  '12',
  JSON.stringify(['Barton Creek Greenbelt', 'South Congress Ave', 'Domain Northside', 'Lady Bird Lake', 'Rainey Street District', 'Mueller Farmers Market', 'Barton Springs Pool']),
  JSON.stringify(['Westlake Hills', 'Tarrytown', 'Barton Hills', 'Travis Heights', 'Rollingwood', 'West Lake Hills']),
  JSON.stringify(['78746', '78703', '78704', '78731', '78730']),
  'luxury',
  "Austin's Luxury Market Expert | 12 Years | Westlake Specialist",
  JSON.stringify({ instagram: '@sarahmitchellaustin', facebook: 'Sarah Mitchell Realtor Austin', linkedin: 'sarah-mitchell-realtor' }),
  1
]);
console.log('✓ Persona seeded');

// ── 3. Content Posts ───────────────────────────────────────────────────────
await clearTable('content_posts');
const posts = [
  {
    title: 'Just SOLD in Westlake Hills',
    content: "🏡 Just SOLD in Westlake Hills — $1.4M in 6 days with 4 offers!\n\nMy sellers were nervous about the market. But with the right pricing strategy and our signature staging approach, we created a bidding war that pushed us $47K over asking.\n\nIf you're thinking about selling your Westlake home this spring, let's talk. The buyers are ready — are you?\n\n#AustinRealEstate #WestlakeHills #JustSold #LuxuryHomes #AustinHomes",
    platforms: JSON.stringify(['instagram']),
    status: 'published',
    scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    contentType: 'custom'
  },
  {
    title: 'Austin Market Update April 2026',
    content: "📊 AUSTIN MARKET UPDATE — April 2026\n\nHere's what's happening in the neighborhoods I specialize in:\n\n✅ Westlake Hills: Median price up 8% YoY, avg 12 days on market\n✅ Tarrytown: Inventory down 22%, sellers have strong leverage\n✅ Barton Hills: New construction driving up comps — great time to list\n\nThinking about your next move? Drop a 🏠 in the comments and I'll send you a personalized market report for your neighborhood.\n\n#AustinRealEstate #MarketUpdate #AustinHomes",
    platforms: JSON.stringify(['facebook', 'instagram']),
    status: 'published',
    scheduledAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    imageUrl: null,
    contentType: 'market_report'
  },
  {
    title: '5 Things Austin Buyers Get Wrong',
    content: "5 things Austin buyers are getting WRONG in 2026 👇\n\n1️⃣ Waiting for rates to drop (they might not)\n2️⃣ Skipping the pre-approval (you'll lose to cash buyers)\n3️⃣ Ignoring new construction (huge incentives right now)\n4️⃣ Lowballing in hot neighborhoods (insults sellers, kills deals)\n5️⃣ Not having a local agent (Zillow doesn't know about the pocket listings)\n\nSave this post and share it with a friend who's been sitting on the fence! 🙌\n\n#AustinBuyers #HomeBuying #AustinRealEstate #FirstTimeHomeBuyer",
    platforms: JSON.stringify(['instagram']),
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    imageUrl: null,
    contentType: 'tips'
  },
  {
    title: 'Austin Luxury Market Shift — LinkedIn',
    content: "The Austin luxury market is shifting — and here's what it means for sellers.\n\nAfter 18 months of rapid appreciation, we're seeing a normalization in the $1M+ segment. Days on market have increased from 8 to 19 days on average. But here's the nuance most agents miss: well-priced, well-staged homes are still moving fast.\n\nThe difference between a 7-day sale and a 90-day price reduction? Strategy.\n\n#RealEstate #LuxuryRealEstate #AustinRealEstate #MarketAnalysis",
    platforms: JSON.stringify(['linkedin']),
    status: 'published',
    scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    imageUrl: null,
    contentType: 'custom'
  },
  {
    title: 'Neighborhood Spotlight: Tarrytown',
    content: "✨ NEIGHBORHOOD SPOTLIGHT: Tarrytown\n\nIf you haven't explored Tarrytown lately, you're missing Austin's best-kept secret. Here's why my buyers are obsessed:\n\n🌳 Tree-lined streets with mature oaks\n🚶 Walkable to Mozart's Coffee and Lake Austin\n🏫 Zoned to Casis Elementary (top-rated)\n🏡 Mix of historic bungalows and modern new builds\n💰 Strong appreciation — up 11% in 2025\n\nDM me 'TARRYTOWN' for my complete neighborhood guide with off-market listings!\n\n#Tarrytown #AustinNeighborhoods #AustinRealEstate #LuxuryHomes",
    platforms: JSON.stringify(['instagram']),
    status: 'draft',
    scheduledAt: null,
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    contentType: 'neighborhood'
  }
];

for (const p of posts) {
  await conn.execute(
    `INSERT INTO content_posts (userId, title, content, contentType, platforms, status, scheduledAt, imageUrl, aiGenerated, createdAt)
     VALUES (?,?,?,?,?,?,?,?,1,NOW())`,
    [demoId, p.title, p.content, p.contentType, p.platforms, p.status, p.scheduledAt, p.imageUrl]
  );
}
console.log('✓ Content posts seeded:', posts.length);

// ── 4. CRM Leads ───────────────────────────────────────────────────────────
await clearTable('crm_leads');
const leads = [
  { name: 'James & Patricia Holloway', email: 'jholloway@gmail.com', phone: '(512) 555-0234', stage: 'appointment_set', source: 'referral', notes: "Looking for 4BR in Westlake, budget $1.2-1.5M. Pre-approved. Want to move before school year starts in August.", tags: JSON.stringify(['buyer', 'pre-approved', 'urgent']) },
  { name: 'Marcus Chen', email: 'mchen@techcorp.com', phone: '(512) 555-0187', stage: 'nurturing', source: 'social', notes: "Relocating from San Francisco for new job at Tesla. First-time Austin buyer. Interested in Tarrytown or Travis Heights.", tags: JSON.stringify(['buyer', 'relocation', 'tech']) },
  { name: 'Diana Reyes', email: 'dreyes@outlook.com', phone: '(512) 555-0341', stage: 'nurturing', source: 'manual', notes: "Downsizing from 5BR home in Rollingwood. Wants luxury condo downtown or in 78703. Timeline: 6 months.", tags: JSON.stringify(['seller', 'buyer', 'downsizing']) },
  { name: 'Robert & Susan Kline', email: 'rskline@gmail.com', phone: '(512) 555-0456', stage: 'contacted', source: 'open_house', notes: "Met at 4521 Barton Creek open house. Not in a rush, exploring options. Have a home to sell first.", tags: JSON.stringify(['seller', 'buyer']) },
  { name: 'Tyler Nguyen', email: 'tnguyen@gmail.com', phone: '(512) 555-0523', stage: 'appointment_set', source: 'referral', notes: "Referred by the Holloways. Cash buyer, investor. Looking for duplex or small multifamily in 78704.", tags: JSON.stringify(['investor', 'cash-buyer', 'urgent']) },
  { name: 'Amanda Foster', email: 'afoster@icloud.com', phone: '(512) 555-0612', stage: 'new', source: 'social', notes: "First-time buyer, pre-approval in progress. Budget $450-550K. Interested in Mueller or East Austin.", tags: JSON.stringify(['buyer', 'first-time']) },
];

for (const l of leads) {
  await conn.execute(
    `INSERT INTO crm_leads (userId, name, email, phone, stage, source, notes, tags, createdAt)
     VALUES (?,?,?,?,?,?,?,?,NOW())`,
    [demoId, l.name, l.email, l.phone, l.stage, l.source, l.notes, l.tags]
  );
}
console.log('✓ CRM leads seeded:', leads.length);

// ── 5. Calendar Events ─────────────────────────────────────────────────────
await clearTable('calendar_events');
const now = new Date();
const events = [
  { title: 'Buyer Consultation — Holloway Family', eventDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), eventType: 'task', description: 'Zoom call, 10am. Review Westlake listings, discuss offer strategy.' },
  { title: 'Open House — 2847 Scenic Dr, Westlake', eventDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), eventType: 'reminder', description: '1pm-4pm. Catered event, 200+ RSVPs. Listing price $1.35M.' },
  { title: 'Listing Appointment — Kline Residence', eventDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), eventType: 'task', description: 'CMA presentation at 3pm. Estimated list price $1.1-1.2M.' },
  { title: 'Instagram Reel — Market Update', eventDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), eventType: 'post', description: 'Film April market update reel. Use new Westlake stats.' },
  { title: 'Closing — 4521 Barton Creek Blvd', eventDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), eventType: 'reminder', description: 'Title company at 2pm. Commission: $38,500.' },
  { title: 'Networking — Austin Board of Realtors Mixer', eventDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), eventType: 'reminder', description: '6pm at JW Marriott. Bring business cards.' },
  { title: 'Content Batch Day', eventDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), eventType: 'task', description: 'Film 4 reels, write 8 posts for next 2 weeks. Use AmpedAgent.' },
];

for (const e of events) {
  await conn.execute(
    `INSERT INTO calendar_events (userId, title, description, eventDate, eventType, isAllDay, createdAt)
     VALUES (?,?,?,?,?,1,NOW())`,
    [demoId, e.title, e.description, e.eventDate, e.eventType]
  );
}
console.log('✓ Calendar events seeded:', events.length);

// ── 6. AI Reels ────────────────────────────────────────────────────────────
await clearTable('ai_reels');
const reels = [
  {
    title: 'Austin Market Record Prices',
    script: "Austin home prices just hit a new record — here's what that means for you. If you bought in Westlake 3 years ago, your home is worth 34% more today. If you're thinking about selling, the window is open. Call me and let's talk about your equity.",
    hook: 'Austin home prices just hit a new record',
    caption: 'Is your home worth more than you think? DM me for a free equity analysis. #AustinRealEstate #HomeEquity',
    status: 'completed',
    reelType: 'authority_reel',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    title: '3 Things Every Austin Buyer Needs to Know',
    script: "Three things every Austin buyer needs to know right now. Number one: get pre-approved before you look at a single house. Number two: the best homes are gone in 48 hours — you need an agent who moves fast. Number three: I'm that agent. DM me and let's get started.",
    hook: 'Three things every Austin buyer needs to know right now',
    caption: 'Ready to buy in Austin? Let me be your guide. DM me "READY" to get started. #AustinBuyers #HomeBuying',
    status: 'completed',
    reelType: 'authority_reel',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Tarrytown Neighborhood Spotlight',
    script: "This is Tarrytown — and it might be Austin's most underrated neighborhood. Tree-lined streets, walkable to the lake, top-rated schools, and homes that hold their value. I have three off-market listings here right now. Want to see them? Drop a comment below.",
    hook: "This is Tarrytown — Austin's most underrated neighborhood",
    caption: 'Thinking about Tarrytown? I have off-market listings. Drop a comment or DM me! #Tarrytown #AustinHomes',
    status: 'processing',
    reelType: 'authority_reel',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
];

for (const r of reels) {
  await conn.execute(
    `INSERT INTO ai_reels (userId, title, script, hook, caption, status, reelType, expiresAt, createdAt)
     VALUES (?,?,?,?,?,?,?,?,NOW())`,
    [demoId, r.title, r.script, r.hook, r.caption, r.status, r.reelType, r.expiresAt]
  );
}
console.log('✓ AI reels seeded:', reels.length);

// ── 7. Testimonials ────────────────────────────────────────────────────────
await clearTable('testimonials');
const testimonials = [
  { clientName: 'James & Patricia Holloway', clientEmail: 'jholloway@gmail.com', rating: 5, reviewText: "Sarah sold our Westlake home in 6 days for $47K over asking. Her staging advice and pricing strategy were spot-on. We've referred her to three friends already.", status: 'received' },
  { clientName: 'Marcus Chen', clientEmail: 'mchen@techcorp.com', rating: 5, reviewText: "Relocated from San Francisco and Sarah made the whole process seamless. She knew every neighborhood, every school district, and found us the perfect home in Tarrytown before it even hit the MLS.", status: 'received' },
  { clientName: 'Diana Reyes', clientEmail: 'dreyes@outlook.com', rating: 5, reviewText: "I was nervous about downsizing after 20 years in my home. Sarah was patient, knowledgeable, and found me the perfect condo. She negotiated $25K off the asking price. Couldn't be happier.", status: 'received' },
];

for (const t of testimonials) {
  await conn.execute(
    `INSERT INTO testimonials (userId, clientName, clientEmail, rating, reviewText, source, status, createdAt)
     VALUES (?,?,?,?,?,'manual',?,NOW())`,
    [demoId, t.clientName, t.clientEmail, t.rating, t.reviewText, t.status]
  );
}
console.log('✓ Testimonials seeded:', testimonials.length);

// ── 8. Update user profile ─────────────────────────────────────────────────
await conn.execute(
  `UPDATE users SET hasCompletedOnboarding=1, onboardingStep=6, creditBalance=250 WHERE id=?`,
  [demoId]
);
console.log('✓ User profile updated');

await conn.end();
console.log('\n✅ Demo account fully seeded!');
console.log('Email:', DEMO_EMAIL);
console.log('Password:', DEMO_PASSWORD);
console.log('User ID:', demoId);
