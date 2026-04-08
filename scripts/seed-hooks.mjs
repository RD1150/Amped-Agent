import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

// Create hooks table if it doesn't exist
await conn.execute(`
  CREATE TABLE IF NOT EXISTS \`hooks\` (
    \`id\` int AUTO_INCREMENT PRIMARY KEY,
    \`category\` enum('buyer','seller','investor','local','luxury','relocation','general') NOT NULL,
    \`format\` enum('video','email','social','carousel') NOT NULL,
    \`hookText\` text NOT NULL,
    \`useCase\` text,
    \`exampleExpansion\` text,
    \`isPremium\` boolean DEFAULT false,
    \`usageCount\` int DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log("✅ hooks table created/verified");

// Check if already seeded
const [rows] = await conn.execute("SELECT COUNT(*) as cnt FROM hooks");
if (rows[0].cnt > 0) {
  console.log(`ℹ️  Already seeded with ${rows[0].cnt} hooks. Skipping.`);
  await conn.end();
  process.exit(0);
}

// Seed with 40 proven real estate hooks
const hooks = [
  // BUYER hooks
  { category: "buyer", format: "social", hookText: "Stop renting and start building wealth. Here's what most buyers don't know about getting into the market right now.", useCase: "Targeting first-time buyers or renters considering homeownership", exampleExpansion: "Follow with 3 key stats about rent vs. own costs in your market, then a CTA to schedule a buyer consultation.", isPremium: false },
  { category: "buyer", format: "video", hookText: "I just helped a buyer get a home for $15,000 under asking price — here's exactly how we did it.", useCase: "Showcase negotiation skills and attract motivated buyers", exampleExpansion: "Walk through the offer strategy, inspection leverage, and closing credits that made it happen.", isPremium: false },
  { category: "buyer", format: "social", hookText: "The #1 mistake first-time buyers make (and how to avoid it).", useCase: "Educational content that builds trust with new buyers", exampleExpansion: "Explain the mistake (e.g., skipping pre-approval, waiving inspection) with a real example and the lesson learned.", isPremium: false },
  { category: "buyer", format: "email", hookText: "Interest rates just shifted. Here's what that means for your buying power this month.", useCase: "Timely market update email to buyer leads", exampleExpansion: "Show a before/after monthly payment comparison, then invite them to a free buyer strategy call.", isPremium: false },
  { category: "buyer", format: "carousel", hookText: "5 things to do BEFORE you start house hunting (most people skip #3).", useCase: "Educational carousel for buyers in the research phase", exampleExpansion: "Slide 1: Get pre-approved. Slide 2: Know your must-haves vs nice-to-haves. Slide 3: Research the neighborhood at night. Slide 4: Calculate true monthly cost. Slide 5: Choose the right agent.", isPremium: false },
  { category: "buyer", format: "video", hookText: "What I wish someone had told me before buying my first home.", useCase: "Personal story hook that builds emotional connection", exampleExpansion: "Share 3 genuine lessons — keep it relatable and end with an offer to help them avoid the same mistakes.", isPremium: true },
  { category: "buyer", format: "social", hookText: "The market is shifting. Buyers who act in the next 60 days will thank themselves in 2 years.", useCase: "Create urgency for fence-sitting buyers", exampleExpansion: "Back it up with local inventory data, price trends, and rate projections.", isPremium: false },

  // SELLER hooks
  { category: "seller", format: "social", hookText: "Your home is worth more than you think. Here's what's driving prices up in [City] right now.", useCase: "Attract potential sellers by highlighting appreciation", exampleExpansion: "Share 2-3 recent comparable sales in the area with a CTA to get a free home valuation.", isPremium: false },
  { category: "seller", format: "video", hookText: "I sold this home for $47,000 over asking price. Here's the exact strategy we used.", useCase: "Demonstrate listing expertise and attract sellers", exampleExpansion: "Cover pricing strategy, staging decisions, marketing reach, and the offer review process.", isPremium: false },
  { category: "seller", format: "email", hookText: "Your neighbor just sold for [price]. Here's what your home could be worth today.", useCase: "Hyper-local email to homeowners in a recently sold neighborhood", exampleExpansion: "Include the sold address (if public), price per sqft comparison, and a no-obligation valuation CTA.", isPremium: false },
  { category: "seller", format: "social", hookText: "Thinking about selling? The 3 things you MUST do before listing (or you'll leave money on the table).", useCase: "Pre-listing advice that positions you as the expert", exampleExpansion: "Deep clean + declutter, professional photos, and strategic pricing — explain why each matters.", isPremium: false },
  { category: "seller", format: "carousel", hookText: "How I prepare a home to sell for top dollar — a behind-the-scenes look.", useCase: "Showcase your listing process to attract sellers", exampleExpansion: "Before/after staging photos, marketing plan overview, open house strategy, and results.", isPremium: true },
  { category: "seller", format: "video", hookText: "The biggest mistake sellers make that costs them thousands — and it's not what you think.", useCase: "Curiosity-driven hook for sellers", exampleExpansion: "Reveal the mistake (e.g., overpricing, poor photos, bad timing) with data to back it up.", isPremium: false },
  { category: "seller", format: "social", hookText: "Days on market are dropping in [City]. If you've been waiting to sell, your window is opening.", useCase: "Market timing hook for sellers on the fence", exampleExpansion: "Share local DOM stats and inventory levels, then offer a free seller consultation.", isPremium: false },

  // INVESTOR hooks
  { category: "investor", format: "social", hookText: "This duplex cash flows $1,200/month. Here's how I found it (and how you can too).", useCase: "Attract real estate investors with a real deal example", exampleExpansion: "Break down purchase price, rental income, expenses, and net cash flow. Offer to send similar deals.", isPremium: true },
  { category: "investor", format: "video", hookText: "The BRRRR strategy explained in 60 seconds — and why it's still working in today's market.", useCase: "Educational content for beginner investors", exampleExpansion: "Buy, Rehab, Rent, Refinance, Repeat — use a real local example with rough numbers.", isPremium: false },
  { category: "investor", format: "email", hookText: "3 investment properties just hit the market. Here's which one I'd buy (and why).", useCase: "Investor email newsletter with deal analysis", exampleExpansion: "Compare cap rate, cash-on-cash return, and neighborhood trajectory for each property.", isPremium: true },
  { category: "investor", format: "carousel", hookText: "How to analyze a rental property in 5 minutes (the exact formula I use).", useCase: "Educational carousel for aspiring investors", exampleExpansion: "Slide 1: Gross rent. Slide 2: Vacancy rate. Slide 3: Operating expenses. Slide 4: NOI. Slide 5: Cap rate calculation.", isPremium: false },

  // LOCAL hooks
  { category: "local", format: "social", hookText: "Living in [City] for 10 years taught me these 5 things no one tells you before moving here.", useCase: "Hyperlocal content that builds community authority", exampleExpansion: "Share genuine local insights — traffic patterns, hidden gems, neighborhood personalities, seasonal tips.", isPremium: false },
  { category: "local", format: "video", hookText: "The best neighborhood in [City] for families right now — and why it might surprise you.", useCase: "Neighborhood spotlight video for relocation buyers", exampleExpansion: "Cover schools, parks, commute, community vibe, and recent sales activity.", isPremium: false },
  { category: "local", format: "social", hookText: "[City] real estate in 60 seconds: what's happening in the market this month.", useCase: "Monthly market update for local followers", exampleExpansion: "Median price, days on market, inventory level, and your take on what it means for buyers and sellers.", isPremium: false },
  { category: "local", format: "carousel", hookText: "5 hidden gems in [City] that locals love (and visitors always miss).", useCase: "Community content that attracts local engagement and referrals", exampleExpansion: "Feature local restaurants, parks, shops, or events with photos and why you love them.", isPremium: false },
  { category: "local", format: "email", hookText: "What's really happening in [Neighborhood] real estate — the numbers behind the headlines.", useCase: "Hyperlocal market report email", exampleExpansion: "Pull MLS stats for that specific zip or neighborhood and add your expert commentary.", isPremium: false },

  // LUXURY hooks
  { category: "luxury", format: "social", hookText: "Just listed: a masterpiece of modern architecture in [City]. Here's a private look inside.", useCase: "Luxury listing reveal with exclusivity angle", exampleExpansion: "Share 3-4 hero photos with key features highlighted — architect, materials, views, amenities.", isPremium: true },
  { category: "luxury", format: "video", hookText: "What does $3 million buy you in [City] right now? The answer might surprise you.", useCase: "Luxury market education and curiosity hook", exampleExpansion: "Tour or showcase 2-3 properties at that price point with commentary on value and lifestyle.", isPremium: true },
  { category: "luxury", format: "email", hookText: "An exclusive opportunity just came to market before it hits the MLS. Here's your first look.", useCase: "Off-market luxury property email to VIP buyer list", exampleExpansion: "Property details, key features, pricing, and a private showing invitation.", isPremium: true },
  { category: "luxury", format: "carousel", hookText: "The 5 features luxury buyers demand in 2025 (and which neighborhoods in [City] deliver them).", useCase: "Luxury buyer education carousel", exampleExpansion: "Smart home tech, chef's kitchen, primary suite retreat, outdoor living, and privacy/security.", isPremium: true },

  // RELOCATION hooks
  { category: "relocation", format: "social", hookText: "Moving to [City]? Here's what I tell every out-of-state buyer before they start their search.", useCase: "Attract relocation buyers with local expertise", exampleExpansion: "Cover cost of living, neighborhood overview, commute reality, and the buying process in your state.", isPremium: false },
  { category: "relocation", format: "video", hookText: "I helped 12 families relocate to [City] last year. Here's what they all wished they knew first.", useCase: "Social proof + education for relocation buyers", exampleExpansion: "Share the top 3-4 surprises or lessons from real relocation clients (anonymized).", isPremium: false },
  { category: "relocation", format: "email", hookText: "Relocating to [City]? Here's your 30-day home buying timeline so nothing falls through the cracks.", useCase: "Relocation buyer nurture email", exampleExpansion: "Week-by-week checklist: pre-approval, virtual tours, neighborhood research, offer strategy, closing prep.", isPremium: false },
  { category: "relocation", format: "carousel", hookText: "[City] vs. [Nearby City]: which is the better move for your family?", useCase: "Comparison content for buyers considering multiple markets", exampleExpansion: "Compare cost of living, schools, commute, lifestyle, and home prices side by side.", isPremium: false },

  // GENERAL hooks
  { category: "general", format: "social", hookText: "Real estate is not about timing the market. It's about time IN the market.", useCase: "Motivational hook for hesitant buyers or sellers", exampleExpansion: "Back it up with a 10-year appreciation chart for your local market.", isPremium: false },
  { category: "general", format: "video", hookText: "I've been a real estate agent for [X] years. Here's the one piece of advice I give every client.", useCase: "Authority-building personal insight video", exampleExpansion: "Share your most impactful piece of advice — keep it genuine and specific to your experience.", isPremium: false },
  { category: "general", format: "social", hookText: "The real estate market is confusing right now. Here's how I'm helping my clients navigate it.", useCase: "Timely market commentary that positions you as a trusted guide", exampleExpansion: "Acknowledge the confusion, share your read on the market, and offer a clear next step.", isPremium: false },
  { category: "general", format: "email", hookText: "Quick question: are you closer to buying/selling than you were 6 months ago?", useCase: "Re-engagement email for cold leads", exampleExpansion: "Short, conversational email that invites a reply. No hard sell — just check in and offer value.", isPremium: false },
  { category: "general", format: "carousel", hookText: "Real estate myths that are costing people money in 2025.", useCase: "Myth-busting content that builds credibility", exampleExpansion: "Myth 1: You need 20% down. Myth 2: Spring is always the best time to sell. Myth 3: You should always start low. Myth 4: The listing agent works for you.", isPremium: false },
  { category: "general", format: "video", hookText: "3 questions you should ask every real estate agent before hiring them.", useCase: "Transparent content that attracts serious buyers/sellers", exampleExpansion: "How many homes have you sold in this area? What's your average list-to-sale ratio? How do you communicate with clients?", isPremium: false },
  { category: "general", format: "social", hookText: "Hot take: the best time to buy real estate is always now — if you're financially ready.", useCase: "Opinion-based hook that sparks engagement", exampleExpansion: "Explain the logic: appreciation over time, building equity vs. renting, and the cost of waiting.", isPremium: false },
  { category: "general", format: "social", hookText: "I've seen the market go up, down, and sideways. Here's what never changes.", useCase: "Experience-based authority hook", exampleExpansion: "Location matters. Condition matters. Pricing matters. The fundamentals always win.", isPremium: false },
];

// Insert all hooks
let inserted = 0;
for (const hook of hooks) {
  await conn.execute(
    `INSERT INTO hooks (category, format, hookText, useCase, exampleExpansion, isPremium, usageCount) VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [hook.category, hook.format, hook.hookText, hook.useCase, hook.exampleExpansion, hook.isPremium ? 1 : 0]
  );
  inserted++;
}

console.log(`✅ Seeded ${inserted} hooks successfully`);
await conn.end();
