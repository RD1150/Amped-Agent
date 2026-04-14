/**
 * letterTemplates.ts
 * Pre-written real estate email & letter templates for the Letters & Emails library.
 * Each template has a subject line, body with {{AGENT_NAME}}, {{BROKERAGE}}, {{CITY}},
 * {{PHONE}}, {{AGENT_EMAIL}} placeholders that get replaced with the agent's persona data.
 */

export type LetterCategory =
  | "Holiday & Events"
  | "Buyer Drip"
  | "Seller Drip"
  | "Post-Closing"
  | "Expired Listing"
  | "FSBO"
  | "Open House"
  | "New Listing"
  | "Just Sold"
  | "Sphere of Influence"
  | "Market Update"
  | "First-Time Buyer"
  | "Investor"
  | "Renter to Owner"
  | "Recruiting";

export type LetterType = "email" | "letter";

export interface LetterTemplate {
  id: string;
  title: string;
  category: LetterCategory;
  type: LetterType;
  subject: string; // email subject line
  date?: string; // for holiday templates e.g. "Jan 1"
  month?: string; // for grouping holiday templates
  body: string; // body with {{PLACEHOLDERS}}
  tags?: string[];
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  // ─── Holiday & Events — January ──────────────────────────────────────────────
  {
    id: "holiday-new-year",
    title: "New Year",
    category: "Holiday & Events",
    type: "email",
    subject: "Real estate can feel like Times Square on NYE...or not!",
    date: "Jan 1",
    month: "January",
    body: `Hi {{FIRST_NAME}},

Happy New Year from {{AGENT_NAME}} at {{BROKERAGE}}!

Real estate can feel a lot like Times Square on New Year's Eve — exciting, a little overwhelming, and full of people all trying to get to the same place at the same time.

But here's the difference: when you work with the right agent, you don't have to fight the crowd.

Whether you're thinking about buying, selling, or just curious about what your home is worth in {{CITY}} right now — I'm here to make it simple.

Wishing you a prosperous and joyful 2025!

Warmly,
{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "january", "new year"],
  },
  {
    id: "holiday-mlk-day",
    title: "Martin Luther King Day",
    category: "Holiday & Events",
    type: "email",
    subject: "What Does MLK Have To Do With Real Estate?",
    date: "Jan 19",
    month: "January",
    body: `Hi {{FIRST_NAME}},

"Injustice anywhere is a threat to justice everywhere." — Dr. Martin Luther King Jr.

On this day, I'm reminded that homeownership has always been one of the most powerful paths to building generational wealth — and that access to that path should be equal for everyone.

As your real estate resource in {{CITY}}, I'm committed to making sure every client I work with gets the same level of dedication, honesty, and advocacy.

If you or someone you know is thinking about buying or selling this year, I'd love to help.

With respect and gratitude,
{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "january", "mlk"],
  },
  // ─── Holiday & Events — February ─────────────────────────────────────────────
  {
    id: "holiday-groundhog-day",
    title: "Groundhog Day",
    category: "Holiday & Events",
    type: "email",
    subject: "Will 2025 be like the 'Groundhog Day' movie plot?",
    date: "Feb 2",
    month: "February",
    body: `Hi {{FIRST_NAME}},

You know the movie Groundhog Day — where the same day keeps repeating over and over?

Some buyers and sellers feel like they're living that movie. They think about making a move, then talk themselves out of it, then think about it again... and nothing changes.

If that sounds familiar, let's break the cycle.

The {{CITY}} market is moving. Interest rates are shifting. And the best opportunities don't wait for "the perfect time."

Let me show you what's actually happening right now — no pressure, just real information.

Reply to this email or call me at {{PHONE}} and let's talk.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "february", "groundhog day"],
  },
  {
    id: "holiday-super-bowl-v1",
    title: "Super Bowl Sunday [Ver 1]",
    category: "Holiday & Events",
    type: "email",
    subject: "The last 2 minutes of football... and real estate",
    date: "Feb 8",
    month: "February",
    body: `Hi {{FIRST_NAME}},

The last 2 minutes of a Super Bowl game can change everything.

Real estate is the same way. The final stretch of a negotiation — the inspection period, the appraisal, the closing table — is where deals are won or lost.

That's where having an experienced agent in your corner makes all the difference.

Whether you're buying or selling in {{CITY}}, I've been in those final-2-minute situations hundreds of times. I know how to protect your interests when it matters most.

Enjoy the game this weekend — and when you're ready to make your next move, I'm here.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "february", "super bowl"],
  },
  {
    id: "holiday-super-bowl-v2",
    title: "Super Bowl Sunday [Ver 2]",
    category: "Holiday & Events",
    type: "email",
    subject: "As good a reason as any to watch the Super Bowl...or call me",
    date: "Feb 8",
    month: "February",
    body: `Hi {{FIRST_NAME}},

Big game this weekend! Whether you're a die-hard fan or just in it for the commercials and the food — I hope you have a great time.

And if at some point during halftime you find yourself thinking, "We really need more space for gatherings like this..." — that's my cue.

I'd love to help you find a home in {{CITY}} that fits your life. Or if you're thinking about selling, I can tell you exactly what your current home is worth.

No pressure — just a friendly reminder that I'm here when you're ready.

Enjoy the game!

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "february", "super bowl"],
  },
  {
    id: "holiday-valentines-v1",
    title: "Valentine's Day [Ver 1]",
    category: "Holiday & Events",
    type: "email",
    subject: "House Hunting is Like Booking a Valentine's Day Dinner...",
    date: "Feb 14",
    month: "February",
    body: `Hi {{FIRST_NAME}},

House hunting is a lot like booking a Valentine's Day dinner at a great restaurant.

If you wait too long, the best spots are taken. If you move too fast, you end up somewhere you didn't really want to be. And the best experiences? They take a little planning — but they're absolutely worth it.

This Valentine's Day, if you're dreaming about a home you'd truly love in {{CITY}}, let's start planning now.

I'd love to help you find the one.

Happy Valentine's Day!

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "february", "valentines"],
  },
  {
    id: "holiday-presidents-day",
    title: "President's Day",
    category: "Holiday & Events",
    type: "email",
    subject: "What Abraham Lincoln Said About Real Estate (Probably)",
    date: "Feb 16",
    month: "February",
    body: `Hi {{FIRST_NAME}},

"Give me six hours to chop down a tree and I will spend the first four sharpening the axe." — Abraham Lincoln

Preparation is everything — in leadership and in real estate.

The agents who get the best results for their clients don't wing it. They come to every appointment prepared, every negotiation researched, and every listing priced with data.

If you're thinking about buying or selling in {{CITY}}, I'd love to show you what a prepared, strategic approach looks like.

Let's talk.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "february", "presidents day"],
  },
  // ─── Holiday & Events — March ─────────────────────────────────────────────────
  {
    id: "holiday-st-patricks",
    title: "St. Patrick's Day",
    category: "Holiday & Events",
    type: "email",
    subject: "You Don't Need Luck to Find a Great Home in {{CITY}}",
    date: "Mar 17",
    month: "March",
    body: `Hi {{FIRST_NAME}},

Happy St. Patrick's Day!

They say luck of the Irish can help you find a pot of gold at the end of a rainbow. But when it comes to finding a great home in {{CITY}}? You don't need luck — you need the right agent.

The spring market is heating up. Inventory is moving fast. And the buyers who are prepared — pre-approved, clear on their criteria, working with an experienced agent — are the ones who win.

If you're thinking about making a move this spring, let's get you ready.

Wearing green today,
{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "march", "st patricks"],
  },
  {
    id: "holiday-spring-market",
    title: "Spring Market",
    category: "Holiday & Events",
    type: "email",
    subject: "The Spring Market Is Here — Here's What That Means for You",
    date: "Mar 20",
    month: "March",
    body: `Hi {{FIRST_NAME}},

Spring is officially here — and in real estate, that means one thing: things are about to get busy.

The {{CITY}} market typically sees its highest activity between March and June. More listings. More buyers. More competition.

Here's what that means for you:

If you're SELLING: Now is the time to list. Demand is high, and well-priced homes are moving quickly.

If you're BUYING: Get pre-approved now. The best homes go fast, and you'll want to be ready to move when the right one appears.

I'd love to give you a personalized update on what's happening in your specific neighborhood. Reply to this email or call me at {{PHONE}}.

Let's make this your best spring yet.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "march", "spring market"],
  },
  // ─── Buyer Drip ───────────────────────────────────────────────────────────────
  {
    id: "buyer-drip-1",
    title: "Buyer Follow-Up #1 — Nice to Meet You",
    category: "Buyer Drip",
    type: "email",
    subject: "Great meeting you — here's what happens next",
    body: `Hi {{FIRST_NAME}},

It was great connecting with you! I'm excited to help you find your next home in {{CITY}}.

Here's what I'll be doing for you over the next few days:

✓ Setting up a custom search based on your criteria
✓ Monitoring new listings the moment they hit the market
✓ Identifying any off-market opportunities in your target neighborhoods

In the meantime, I'd love to know — is there anything specific you're looking for that we didn't cover? Sometimes the details that matter most are the ones that don't make it onto the standard checklist.

Looking forward to finding you the perfect home.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["buyer", "drip", "follow-up"],
  },
  {
    id: "buyer-drip-2",
    title: "Buyer Follow-Up #2 — Market Overview",
    category: "Buyer Drip",
    type: "email",
    subject: "What's actually happening in the {{CITY}} market right now",
    body: `Hi {{FIRST_NAME}},

I wanted to give you a quick snapshot of what's happening in the {{CITY}} market right now, so you can make informed decisions as we search together.

Here's what I'm seeing:

📊 Inventory: [Current inventory levels in your target area]
📈 Days on Market: [Average DOM]
💰 Price Trends: [Recent price movement]
🏆 Competition: [Buyer competition level]

The bottom line: [Your honest assessment of the market for buyers right now].

This is exactly why I want to make sure you're pre-approved and ready to move quickly when the right home comes along.

Have you connected with a lender yet? If not, I have a few trusted partners I can introduce you to — no obligation.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["buyer", "drip", "market update"],
  },
  {
    id: "buyer-drip-3",
    title: "Buyer Follow-Up #3 — The Pre-Approval Nudge",
    category: "Buyer Drip",
    type: "email",
    subject: "One step that will make you a stronger buyer",
    body: `Hi {{FIRST_NAME}},

I wanted to share something I've seen make a real difference for buyers in {{CITY}}:

Getting pre-approved before you start seriously touring homes.

Here's why it matters:

1. You'll know exactly what you can afford — no surprises
2. Sellers take pre-approved offers more seriously
3. In a competitive situation, a pre-approval letter can be the difference between getting the home and losing it
4. It speeds up the closing process significantly

I work with several excellent lenders who can get you pre-approved quickly — often within 24-48 hours. Would you like an introduction?

Just reply to this email and I'll make the connection.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["buyer", "drip", "pre-approval"],
  },
  {
    id: "buyer-drip-4",
    title: "Buyer Follow-Up #4 — Neighborhood Spotlight",
    category: "Buyer Drip",
    type: "email",
    subject: "Have you considered this neighborhood in {{CITY}}?",
    body: `Hi {{FIRST_NAME}},

I've been thinking about your search, and I wanted to highlight a neighborhood that might be worth a closer look: [NEIGHBORHOOD NAME].

Here's why it caught my attention for you:

🏘️ [Reason 1 — fits their criteria]
🏫 [Reason 2 — schools, walkability, etc.]
💰 [Reason 3 — value relative to comparable areas]
📈 [Reason 4 — appreciation trend or development]

Homes in this area are typically priced between [PRICE RANGE], and they tend to move [quickly/steadily] once listed.

Would you be open to scheduling a quick drive-through this weekend? Sometimes seeing a neighborhood in person changes everything.

Let me know!

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["buyer", "drip", "neighborhood"],
  },
  // ─── Seller Drip ──────────────────────────────────────────────────────────────
  {
    id: "seller-drip-1",
    title: "Seller Follow-Up #1 — Thank You for Meeting",
    category: "Seller Drip",
    type: "email",
    subject: "Thank you for your time — here's my commitment to you",
    body: `Hi {{FIRST_NAME}},

Thank you for taking the time to meet with me about selling your home. I know you have choices when it comes to representation, and I don't take that lightly.

Here's my commitment to you as your listing agent:

✓ Honest pricing — based on data, not what you want to hear
✓ Maximum exposure — professional photography, video, social media, MLS, and targeted digital advertising
✓ Skilled negotiation — I'll protect your interests at every step
✓ Clear communication — you'll always know what's happening with your sale

I'll be following up shortly with a detailed marketing plan for your property. In the meantime, please don't hesitate to reach out with any questions.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["seller", "drip", "follow-up"],
  },
  {
    id: "seller-drip-2",
    title: "Seller Follow-Up #2 — Pricing Strategy",
    category: "Seller Drip",
    type: "email",
    subject: "The pricing mistake that costs sellers thousands",
    body: `Hi {{FIRST_NAME}},

I want to share something I've seen happen too many times in {{CITY}}:

A seller prices their home too high, hoping to leave room to negotiate. The home sits on the market. Buyers start to wonder what's wrong with it. Price reductions follow. The home eventually sells — but for less than it would have if it had been priced correctly from the start.

The data is clear: homes priced right from day one sell faster and for more money than homes that go through price reductions.

When we meet to discuss your home's value, I'll show you exactly what the market data says — not what you want to hear, but what will actually get you the best result.

Ready to see the numbers?

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["seller", "drip", "pricing"],
  },
  {
    id: "seller-drip-3",
    title: "Seller Follow-Up #3 — Preparing Your Home",
    category: "Seller Drip",
    type: "email",
    subject: "The 5 things that make buyers fall in love (or walk away)",
    body: `Hi {{FIRST_NAME}},

Before your home hits the market, I want to share the 5 things that consistently make buyers fall in love — or walk away:

1. 🚪 Curb appeal — First impressions happen before they even walk in the door
2. 🌿 Declutter and depersonalize — Buyers need to picture themselves living there
3. 💡 Light and brightness — Open blinds, replace bulbs, clean windows
4. 🎨 Neutral paint — Fresh, neutral colors make spaces feel larger and newer
5. 🧹 Deep clean — A spotless home signals a well-maintained home

The good news? Most of these cost little to nothing. And the return on investment is significant.

I'll walk through your home with you and give you a personalized prep list before we list. Would you like to schedule that walkthrough?

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["seller", "drip", "home prep"],
  },
  // ─── Post-Closing ─────────────────────────────────────────────────────────────
  {
    id: "post-closing-1",
    title: "Post-Closing — Congratulations",
    category: "Post-Closing",
    type: "email",
    subject: "Congratulations on your new home! 🎉",
    body: `Hi {{FIRST_NAME}},

Congratulations — you're officially a homeowner!

It has been an absolute pleasure working with you through this process. Watching you get the keys to your new home in {{CITY}} is exactly why I do what I do.

A few things to keep in mind as you settle in:

🔑 Change your locks — it's a simple step that gives you peace of mind
📋 Keep all your closing documents in a safe place
🏠 Set up a home maintenance schedule — small issues are much cheaper than big ones
💰 Track your home improvements — they may be tax-deductible when you sell

I'm always here if you have questions, need a referral for a contractor, or just want to know what your home is worth down the road.

Welcome home!

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["post-closing", "congratulations"],
  },
  {
    id: "post-closing-30-days",
    title: "Post-Closing — 30-Day Check-In",
    category: "Post-Closing",
    type: "email",
    subject: "30 days in — how's the new home treating you?",
    body: `Hi {{FIRST_NAME}},

It's been about a month since you closed on your home in {{CITY}} — I hope you're settling in and loving every minute of it!

I wanted to check in and see how things are going. A few questions:

🏠 Is everything working as expected with the home?
🔧 Do you need any contractor or service provider referrals?
📬 Have you updated your address everywhere it needs to be?
🌳 Are you getting to know the neighborhood?

If anything has come up that you'd like to talk through, I'm always just a call or text away.

And if you know anyone who's thinking about buying or selling in {{CITY}}, I'd be honored if you'd pass my name along. Referrals from happy clients are the greatest compliment I can receive.

Enjoy your home!

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["post-closing", "check-in", "30 days"],
  },
  {
    id: "post-closing-anniversary",
    title: "Post-Closing — 1-Year Anniversary",
    category: "Post-Closing",
    type: "email",
    subject: "Happy 1-year home anniversary! 🏡",
    body: `Hi {{FIRST_NAME}},

One year ago today, you got the keys to your home in {{CITY}}. Happy home anniversary!

A lot can change in a year — and so can the real estate market. I wanted to reach out with a few things that might be useful:

📊 Your home's value: The {{CITY}} market has shifted since you bought. Would you like a free, no-obligation update on what your home is worth today?

🔧 Home maintenance: Year 1 is a great time to schedule an HVAC service, check your roof, and clean your gutters before winter.

💰 Refinancing: If rates have changed since you closed, it might be worth a conversation with your lender.

As always, I'm here for any real estate questions — big or small. And if you know anyone who's thinking about making a move, I'd love to help them the way I helped you.

Here's to many more years in your home!

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["post-closing", "anniversary", "1 year"],
  },
  // ─── Expired Listing ──────────────────────────────────────────────────────────
  {
    id: "expired-1",
    title: "Expired Listing — First Contact",
    category: "Expired Listing",
    type: "letter",
    subject: "Your home didn't sell — here's why (and how to fix it)",
    body: `Dear {{FIRST_NAME}},

I noticed that your listing at [PROPERTY ADDRESS] recently expired without selling, and I wanted to reach out.

I know how frustrating that can be. You prepared your home, disrupted your life for showings, and waited — only to end up back where you started.

The good news? Most expired listings sell successfully the second time around — when the right changes are made.

In my experience working in {{CITY}}, expired listings typically fall into one of three categories:

1. Priced too high for current market conditions
2. Insufficient marketing reach and buyer exposure
3. Presentation issues that can be addressed before relisting

I'd love to do a complimentary analysis of your listing and share exactly what I would do differently to get your home sold.

There's no obligation, and I promise to be honest — even if the truth isn't what you want to hear.

May I call you this week to set up a brief meeting?

Sincerely,
{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["expired", "listing", "prospecting"],
  },
  {
    id: "expired-2",
    title: "Expired Listing — Follow-Up",
    category: "Expired Listing",
    type: "email",
    subject: "Still thinking about selling your home at [ADDRESS]?",
    body: `Hi {{FIRST_NAME}},

I reached out recently about your home at [PROPERTY ADDRESS], and I wanted to follow up.

I understand you may be taking some time to regroup and decide your next steps — that's completely understandable.

I just wanted to share one thing: the {{CITY}} market is [CURRENT MARKET CONDITION]. Buyers are [ACTIVE/LOOKING/MOTIVATED], and homes that are priced and presented correctly are [SELLING QUICKLY/RECEIVING STRONG OFFERS].

If you're still thinking about selling, now might be a better time than you think.

I'd love to spend 20 minutes with you — no pressure, no sales pitch — just an honest conversation about what's possible.

Would that be worth your time?

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["expired", "follow-up"],
  },
  // ─── FSBO ─────────────────────────────────────────────────────────────────────
  {
    id: "fsbo-1",
    title: "FSBO — First Contact",
    category: "FSBO",
    type: "letter",
    subject: "Selling your home yourself? I respect that — here's what I've seen",
    body: `Dear {{FIRST_NAME}},

I noticed you're selling your home at [PROPERTY ADDRESS] on your own, and I wanted to reach out — not to talk you out of it, but to offer some information that might be useful regardless of how you proceed.

I've worked with many FSBO sellers in {{CITY}} over the years. Some have been very successful. Others have run into challenges they didn't anticipate — pricing, negotiations, legal disclosures, and the sheer volume of time required to manage the process.

I'm not here to tell you what to do. But I would love to offer you a few things at no cost:

✓ A current market analysis so you know if your price is competitive
✓ A disclosure checklist to make sure you're legally protected
✓ My honest assessment of what professional representation would add (or not) in your specific situation

No pressure, no obligation. Just information.

Would you be open to a brief conversation?

Respectfully,
{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["fsbo", "prospecting"],
  },
  {
    id: "fsbo-2",
    title: "FSBO — The Statistics Email",
    category: "FSBO",
    type: "email",
    subject: "The FSBO statistic most sellers don't know",
    body: `Hi {{FIRST_NAME}},

I wanted to share something that might be relevant as you sell your home at [PROPERTY ADDRESS].

According to the National Association of Realtors, the typical FSBO home sells for significantly less than agent-represented homes — even after accounting for commission savings.

Why? A few reasons:

📊 Pricing: Most FSBO sellers price based on emotion or Zillow estimates, not actual market data
🔍 Exposure: Agent-listed homes reach 10x more qualified buyers through MLS, syndication, and professional networks
💬 Negotiation: Buyers know FSBO sellers are unrepresented and often negotiate harder
📋 Paperwork: Real estate contracts are complex — mistakes can be costly

I'm not sharing this to scare you. I'm sharing it because I want you to make the most informed decision possible.

If you'd like to see the actual numbers for {{CITY}}, I'm happy to share them — no strings attached.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["fsbo", "statistics"],
  },
  // ─── Open House ───────────────────────────────────────────────────────────────
  {
    id: "open-house-follow-up",
    title: "Open House Follow-Up",
    category: "Open House",
    type: "email",
    subject: "Thanks for stopping by — a few things I wanted to share",
    body: `Hi {{FIRST_NAME}},

Thank you for visiting the open house at [PROPERTY ADDRESS] this weekend! It was great to meet you.

I wanted to follow up with a few things:

🏠 About the home: [Brief note about the property — what makes it special]
📊 The market: Homes like this in {{CITY}} are [moving quickly/generating strong interest/priced competitively]
📋 Next steps: If you're interested in scheduling a private showing or making an offer, I'd love to help you move quickly

And if this particular home isn't quite right for you, I'd love to learn more about what you're looking for. I may have other listings — or know of upcoming ones — that could be a better fit.

Would you be open to a brief call this week?

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["open house", "follow-up"],
  },
  {
    id: "open-house-neighbor-invite",
    title: "Open House — Neighbor Invite",
    category: "Open House",
    type: "letter",
    subject: "You're invited to see your neighbor's home",
    body: `Dear Neighbor,

I wanted to personally invite you to the open house at [PROPERTY ADDRESS] this [DAY], [DATE] from [TIME].

As a neighbor, you have a unique perspective on this community — and you may know someone who would love to live here.

Beyond the open house, I'd love to take a moment to introduce myself. I'm {{AGENT_NAME}} with {{BROKERAGE}}, and I specialize in [NEIGHBORHOOD/CITY] real estate.

If you've ever been curious about what your own home might be worth in today's market, I'd be happy to share that information — no obligation, no pressure.

I hope to see you this weekend!

Warmly,
{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["open house", "neighbor", "invite"],
  },
  // ─── Just Sold ────────────────────────────────────────────────────────────────
  {
    id: "just-sold-neighbor",
    title: "Just Sold — Neighbor Letter",
    category: "Just Sold",
    type: "letter",
    subject: "Your neighbor just sold — here's what it means for your home",
    body: `Dear Neighbor,

I'm excited to share some great news: [PROPERTY ADDRESS] just sold for [SALE PRICE]!

This is great news for everyone in the neighborhood — strong sales like this help support and increase property values for all homeowners nearby.

If you've been thinking about selling your own home, this is a great time to find out what it might be worth. The demand that drove this sale is still very much alive in {{CITY}}.

I'd love to give you a complimentary, no-obligation home valuation — just to keep you informed about your most valuable asset.

May I give you a call this week?

Sincerely,
{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["just sold", "neighbor", "prospecting"],
  },
  // ─── Sphere of Influence ──────────────────────────────────────────────────────
  {
    id: "soi-quarterly-check-in",
    title: "Sphere of Influence — Quarterly Check-In",
    category: "Sphere of Influence",
    type: "email",
    subject: "Checking in — and a quick update on the {{CITY}} market",
    body: `Hi {{FIRST_NAME}},

I hope you're doing well! I wanted to reach out with a quick update on the {{CITY}} real estate market — and to say hello.

Here's what I'm seeing right now:

📊 [Market update — 2-3 sentences on current conditions]

What this means for you:
- If you own a home: Your equity may have [increased/shifted] since you bought
- If you're thinking about buying: [Current buyer market conditions]
- If you know someone thinking about moving: Now is a [good/interesting/active] time

I'm always here as your real estate resource — whether you have a question, need a referral, or are ready to make a move yourself.

How are things going on your end?

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["sphere of influence", "check-in", "market update"],
  },
  {
    id: "soi-referral-ask",
    title: "Sphere of Influence — Referral Ask",
    category: "Sphere of Influence",
    type: "email",
    subject: "A quick favor to ask...",
    body: `Hi {{FIRST_NAME}},

I hope this finds you well! I wanted to reach out with a quick ask.

My business is built almost entirely on referrals from people I know and trust — people like you. And I'm always looking to help more families in {{CITY}} navigate one of the biggest financial decisions of their lives.

If you know anyone who is:
• Thinking about buying a home
• Considering selling
• Curious about what their home is worth
• Relocating to or from {{CITY}}

...I would be incredibly grateful if you'd pass my name along.

I promise to take great care of anyone you send my way — the same way I'd want someone to take care of you.

Thank you for your trust and support. It means more than you know.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["sphere of influence", "referral"],
  },
  // ─── Market Update ────────────────────────────────────────────────────────────
  {
    id: "market-update-monthly",
    title: "Monthly Market Update",
    category: "Market Update",
    type: "email",
    subject: "{{CITY}} Real Estate Market Update — [MONTH] [YEAR]",
    body: `Hi {{FIRST_NAME}},

Here's your monthly real estate market update for {{CITY}}:

📊 MARKET SNAPSHOT — [MONTH] [YEAR]

Median Home Price: $[PRICE] ([UP/DOWN] [%] from last month)
Average Days on Market: [DAYS] days
Homes Sold: [NUMBER]
Active Listings: [NUMBER]
Months of Supply: [NUMBER] months

WHAT THIS MEANS:
[2-3 sentences interpreting the data in plain English — is it a buyer's market, seller's market, or balanced? What should buyers/sellers know?]

MY TAKE:
[Your personal insight as a local expert — what are you seeing on the ground that the numbers don't fully capture?]

If you'd like a more detailed analysis of a specific neighborhood, or want to know what your home is worth in today's market, just reply to this email.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["market update", "monthly"],
  },
  // ─── First-Time Buyer ─────────────────────────────────────────────────────────
  {
    id: "first-time-buyer-1",
    title: "First-Time Buyer — Welcome Email",
    category: "First-Time Buyer",
    type: "email",
    subject: "Welcome to the home buying journey — here's what to expect",
    body: `Hi {{FIRST_NAME}},

Welcome to one of the most exciting (and sometimes overwhelming) journeys you'll ever take — buying your first home!

I'm {{AGENT_NAME}}, and I'm here to make this process as clear, stress-free, and successful as possible for you.

Here's a quick overview of what the home buying process looks like:

1. 🏦 Get Pre-Approved — Know your budget before you fall in love with a home
2. 🔍 Define Your Criteria — What must-haves, nice-to-haves, and deal-breakers do you have?
3. 🏘️ Tour Homes — We'll visit properties that match your criteria
4. 📝 Make an Offer — I'll guide you through crafting a competitive offer
5. 🔬 Inspection & Appraisal — Protect yourself before you commit
6. 🎉 Close — Sign the papers and get your keys!

The whole process typically takes 30-60 days once you're under contract. But preparation before that makes all the difference.

What questions do you have right now? There are no silly questions — this is new territory, and I'm here to explain everything.

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["first-time buyer", "welcome", "education"],
  },
  {
    id: "first-time-buyer-fear",
    title: "First-Time Buyer — The Fear Nobody Talks About",
    category: "First-Time Buyer",
    type: "email",
    subject: "The fear nobody talks about (but many first-time buyers feel)",
    body: `Hi {{FIRST_NAME}},

Can I be honest with you about something?

Almost every first-time buyer I've worked with in {{CITY}} has felt the same thing at some point in the process: a moment of pure, paralyzing fear.

"What if I'm making a mistake?"
"What if I can't afford it after all?"
"What if the market crashes right after I buy?"
"What if I pick the wrong neighborhood?"

This fear is completely normal. And it's actually a sign that you're taking this seriously — which is a good thing.

Here's what I've learned after helping dozens of first-time buyers: the fear doesn't go away by waiting. It goes away by getting informed.

The more you know about the market, the process, and your own financial situation — the less scary it becomes.

That's exactly what I'm here for. Let's get you informed.

What's the biggest concern on your mind right now?

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["first-time buyer", "fear", "emotional"],
  },
  // ─── Investor ─────────────────────────────────────────────────────────────────
  {
    id: "investor-1",
    title: "Investor — Introduction",
    category: "Investor",
    type: "email",
    subject: "Real estate investment opportunities in {{CITY}} — let's talk",
    body: `Hi {{FIRST_NAME}},

I specialize in working with real estate investors in {{CITY}}, and I wanted to reach out with a few thoughts on the current market.

Here's what I'm seeing for investors right now:

📊 Rental demand: [Current rental market conditions]
💰 Cap rates: [Typical cap rates in target areas]
🏘️ Best neighborhoods for ROI: [Top 2-3 areas]
📈 Appreciation trends: [Recent appreciation data]

Whether you're looking for your first investment property, expanding an existing portfolio, or exploring short-term rental opportunities — I have the market knowledge and investor network to help you find the right deals.

I'd love to schedule a 20-minute call to understand your investment goals and share what I'm currently seeing in the market.

Would that be worth your time?

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["investor", "introduction"],
  },
  // ─── Renter to Owner ──────────────────────────────────────────────────────────
  {
    id: "renter-to-owner-1",
    title: "Renter to Owner — The Math",
    category: "Renter to Owner",
    type: "email",
    subject: "What you're actually paying for when you rent (the math might surprise you)",
    body: `Hi {{FIRST_NAME}},

I want to share something that surprises a lot of renters in {{CITY}}:

Every month you pay rent, you're building your landlord's equity — not yours.

Let's look at the math:

If you're paying $[RENT AMOUNT]/month in rent, that's $[ANNUAL AMOUNT] per year going to someone else's mortgage.

Over 5 years: $[5-YEAR AMOUNT]
Over 10 years: $[10-YEAR AMOUNT]

Now imagine if that same money was going toward a home you owned — building equity, generating potential appreciation, and giving you a place that's truly yours.

I know homeownership can feel out of reach. But you might be closer than you think. Down payment assistance programs, FHA loans, and first-time buyer programs have helped many of my clients in {{CITY}} make the leap.

Would you be open to a free, no-obligation conversation about what homeownership might look like for you?

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["renter to owner", "education", "math"],
  },
  // ─── Recruiting ───────────────────────────────────────────────────────────────
  {
    id: "recruiting-1",
    title: "Agent Recruiting — Introduction",
    category: "Recruiting",
    type: "email",
    subject: "Are you getting everything you need from your current brokerage?",
    body: `Hi {{FIRST_NAME}},

I hope you're having a great week! I'm {{AGENT_NAME}} with {{BROKERAGE}} in {{CITY}}, and I wanted to reach out agent-to-agent.

I've been following your work in the market, and I'm impressed by what you've built. That's exactly the kind of agent we're looking for at {{BROKERAGE}}.

I'm not here to make a hard sell — I know you've built something valuable where you are. But I do want to ask one question:

Are you getting everything you need from your current brokerage to grow your business the way you want to?

If the answer is anything less than "absolutely yes" — I'd love to have a confidential conversation about what we offer here.

No pressure. No obligation. Just a conversation between two professionals.

Would you be open to a coffee or a quick call?

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["recruiting", "agent"],
  },
  // ─── Holiday & Events — April ─────────────────────────────────────────────────
  {
    id: "holiday-easter",
    title: "Easter / Spring",
    category: "Holiday & Events",
    type: "email",
    subject: "Spring is the season of new beginnings — including new homes",
    date: "Apr 5",
    month: "April",
    body: `Hi {{FIRST_NAME}},

Happy Spring! Whether you celebrate Easter or simply love this time of year, there's something undeniably hopeful about spring.

In real estate, spring is the season of new beginnings. More homes come to market. More buyers are actively searching. And more families find the home they've been dreaming about.

If you've been thinking about making a move — buying, selling, or both — there's no better time than right now.

I'd love to be part of your next chapter in {{CITY}}.

Wishing you a wonderful spring,
{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "april", "easter", "spring"],
  },
  // ─── Holiday & Events — May ───────────────────────────────────────────────────
  {
    id: "holiday-mothers-day",
    title: "Mother's Day",
    category: "Holiday & Events",
    type: "email",
    subject: "The best gift a home can give a mom",
    date: "May 10",
    month: "May",
    body: `Hi {{FIRST_NAME}},

Happy Mother's Day to all the incredible moms out there!

I've been thinking about what home means to a mother. It's not just walls and a roof — it's the place where memories are made, where kids grow up, where family gathers, and where love lives.

If you're a mom who's been dreaming about more space, a better neighborhood, or a home that truly fits your family — I'd love to help make that happen.

And if you know a mom who's thinking about buying or selling in {{CITY}}, please pass my name along. Helping families find their perfect home is the most rewarding work I do.

With gratitude and admiration for all the moms,
{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "may", "mothers day"],
  },
  // ─── Holiday & Events — June ──────────────────────────────────────────────────
  {
    id: "holiday-fathers-day",
    title: "Father's Day",
    category: "Holiday & Events",
    type: "email",
    subject: "What every dad really wants (hint: it might be a garage)",
    date: "Jun 15",
    month: "June",
    body: `Hi {{FIRST_NAME}},

Happy Father's Day!

I've shown a lot of homes over the years, and I've noticed a pattern: dads always gravitate toward the garage.

Whether it's for the workshop, the man cave, the extra storage, or just the satisfaction of a well-organized space — the garage matters.

If your family has outgrown your current home — or if you've been dreaming about that perfect garage (or backyard, or home office, or extra bedroom) — let's talk.

The {{CITY}} market has some great options right now, and I'd love to help you find the home that checks all the boxes — including the garage.

Happy Father's Day to all the dads!

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "june", "fathers day"],
  },
  // ─── Holiday & Events — July ──────────────────────────────────────────────────
  {
    id: "holiday-fourth-of-july",
    title: "Fourth of July",
    category: "Holiday & Events",
    type: "email",
    subject: "Freedom, fireworks, and finding your dream home in {{CITY}}",
    date: "Jul 4",
    month: "July",
    body: `Hi {{FIRST_NAME}},

Happy Fourth of July!

On this day, we celebrate freedom — and one of the greatest expressions of that freedom is homeownership.

Owning a home means the freedom to paint your walls any color you want. To plant a garden. To have a dog. To build equity instead of paying someone else's mortgage. To put down roots in the community you choose.

If you're ready to experience that freedom in {{CITY}}, I'm here to help.

Enjoy the fireworks!

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "july", "fourth of july"],
  },
  // ─── Holiday & Events — September ────────────────────────────────────────────
  {
    id: "holiday-labor-day",
    title: "Labor Day",
    category: "Holiday & Events",
    type: "email",
    subject: "Labor Day: The unofficial start of the fall market",
    date: "Sep 1",
    month: "September",
    body: `Hi {{FIRST_NAME}},

Happy Labor Day! I hope you're enjoying a well-deserved day off.

In real estate, Labor Day marks the unofficial start of the fall market — and it's often one of the best times to buy or sell.

Here's why fall is underrated in {{CITY}}:

🍂 Less competition — fewer buyers in the market means less bidding war pressure
🏠 Motivated sellers — anyone still listed in the fall wants to sell
📊 Serious buyers — fall buyers are typically more committed than spring browsers
💰 Year-end deals — sellers who haven't sold may be more flexible on price

If you've been waiting for the "right time" to make a move — this might be it.

Enjoy the long weekend!

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "september", "labor day", "fall market"],
  },
  // ─── Holiday & Events — October ───────────────────────────────────────────────
  {
    id: "holiday-halloween",
    title: "Halloween",
    category: "Holiday & Events",
    type: "email",
    subject: "The scariest thing in real estate isn't what you think",
    date: "Oct 31",
    month: "October",
    body: `Hi {{FIRST_NAME}},

Happy Halloween! 🎃

In the spirit of the season, let me share the scariest thing I see in real estate — and it's not haunted houses.

It's waiting too long.

I've seen buyers wait for prices to drop — and watch them rise instead. I've seen sellers wait for the "perfect market" — and miss the window entirely. I've seen renters wait until they "feel ready" — and pay rent for another decade.

The real estate market doesn't wait for anyone. And the cost of waiting is often far greater than the cost of acting.

If you've been thinking about making a move in {{CITY}}, let's talk. No tricks — just treats.

Happy Halloween!

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "october", "halloween"],
  },
  // ─── Holiday & Events — November ─────────────────────────────────────────────
  {
    id: "holiday-thanksgiving",
    title: "Thanksgiving",
    category: "Holiday & Events",
    type: "email",
    subject: "What I'm grateful for this Thanksgiving",
    date: "Nov 27",
    month: "November",
    body: `Hi {{FIRST_NAME}},

As Thanksgiving approaches, I find myself reflecting on what I'm most grateful for — and you're on that list.

Whether you've been a client, a referral source, a friend, or simply someone who has trusted me enough to stay connected — thank you. You're the reason I love what I do.

Real estate is ultimately about people and the places they call home. And getting to be part of that story — helping families find their place in {{CITY}} — is a privilege I don't take for granted.

I hope your Thanksgiving is filled with warmth, good food, and the people you love most.

With gratitude,
{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "november", "thanksgiving"],
  },
  // ─── Holiday & Events — December ─────────────────────────────────────────────
  {
    id: "holiday-christmas",
    title: "Christmas / Happy Holidays",
    category: "Holiday & Events",
    type: "email",
    subject: "Wishing you a wonderful holiday season",
    date: "Dec 25",
    month: "December",
    body: `Hi {{FIRST_NAME}},

As the year comes to a close, I wanted to take a moment to wish you and your family a wonderful holiday season.

This time of year has a way of making us think about home — what it means, what it feels like, and what we want it to be.

If 2026 is the year you make a move in {{CITY}} — whether that's buying your first home, upgrading to something bigger, downsizing, or investing — I'd love to be part of that journey.

But for now, I just want to say thank you. For your trust, your referrals, and your friendship.

Happy holidays and a prosperous New Year!

Warmly,
{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "december", "christmas", "new year"],
  },
  {
    id: "holiday-new-year-eve",
    title: "New Year's Eve",
    category: "Holiday & Events",
    type: "email",
    subject: "One real estate resolution worth keeping",
    date: "Dec 31",
    month: "December",
    body: `Hi {{FIRST_NAME}},

Happy New Year's Eve!

As you make your resolutions for the year ahead, I want to suggest one that could change your financial future:

Get serious about your real estate goals.

Whether that means buying your first home, selling and upgrading, investing in a rental property, or simply getting a current valuation of what you own — making a plan is the first step.

I'd love to be your real estate resource in {{CITY}} this year. Let's start 2026 with a clear picture of where you stand and where you want to go.

Happy New Year!

{{AGENT_NAME}}
{{BROKERAGE}} | {{CITY}}
{{PHONE}} | {{AGENT_EMAIL}}`,
    tags: ["holiday", "december", "new years eve"],
  },
];

// ─── Helper: get unique categories ───────────────────────────────────────────
export function getCategories(): LetterCategory[] {
  const cats = new Set(LETTER_TEMPLATES.map((t) => t.category));
  return Array.from(cats) as LetterCategory[];
}

// ─── Helper: get unique months for holiday templates ─────────────────────────
export function getHolidayMonths(): string[] {
  const months = LETTER_TEMPLATES.filter((t) => t.month).map((t) => t.month!);
  const unique = Array.from(new Set(months));
  const order = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return unique.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

// ─── Helper: personalize a template body ─────────────────────────────────────
export function personalizeTemplate(
  body: string,
  data: {
    firstName?: string;
    agentName?: string;
    brokerage?: string;
    city?: string;
    phone?: string;
    agentEmail?: string;
  }
): string {
  return body
    .replace(/\{\{FIRST_NAME\}\}/g, data.firstName || "there")
    .replace(/\{\{AGENT_NAME\}\}/g, data.agentName || "Your Agent")
    .replace(/\{\{BROKERAGE\}\}/g, data.brokerage || "Your Brokerage")
    .replace(/\{\{CITY\}\}/g, data.city || "your city")
    .replace(/\{\{PHONE\}\}/g, data.phone || "")
    .replace(/\{\{AGENT_EMAIL\}\}/g, data.agentEmail || "");
}
