export type TemplateCategory = "buyers" | "sellers" | "investors" | "general" | "expireds" | "urgent_sellers" | "fsbos" | "luxury" | "first_time_sellers";

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  designStyle: "modern" | "bold" | "elegant" | "data" | "minimal" | "luxury";
  colorScheme: "blue" | "green" | "gold" | "red" | "purple" | "teal" | "orange";
  useCase: string;
}

export const TEMPLATE_LIBRARY: Template[] = [
  // BUYERS TEMPLATES (15)
  {
    id: "buyer_first_time_tips",
    name: "First-Time Buyer Tips",
    category: "buyers",
    description: "Educational content for first-time homebuyers",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Share advice for buyers entering the market for the first time"
  },
  {
    id: "buyer_checklist",
    name: "Home Buyer Checklist",
    category: "buyers",
    description: "Step-by-step checklist for home buyers",
    designStyle: "minimal",
    colorScheme: "green",
    useCase: "Help buyers stay organized throughout their home search"
  },
  {
    id: "buyer_search_tips",
    name: "Home Search Strategies",
    category: "buyers",
    description: "Tips for effective home searching",
    designStyle: "bold",
    colorScheme: "orange",
    useCase: "Guide buyers on how to find their perfect home"
  },
  {
    id: "buyer_mortgage_guide",
    name: "Mortgage & Financing Guide",
    category: "buyers",
    description: "Financial preparation for homebuyers",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Educate buyers on financing options and requirements"
  },
  {
    id: "buyer_inspection_tips",
    name: "Home Inspection Essentials",
    category: "buyers",
    description: "What to look for during inspections",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Prepare buyers for the inspection process"
  },
  {
    id: "buyer_offer_strategy",
    name: "Winning Offer Strategies",
    category: "buyers",
    description: "How to make competitive offers",
    designStyle: "bold",
    colorScheme: "red",
    useCase: "Help buyers craft strong offers in competitive markets"
  },
  {
    id: "buyer_market_timing",
    name: "Best Time to Buy",
    category: "buyers",
    description: "Market timing advice for buyers",
    designStyle: "data",
    colorScheme: "purple",
    useCase: "Advise buyers on optimal timing for purchases"
  },
  {
    id: "buyer_neighborhood_guide",
    name: "Neighborhood Guide",
    category: "buyers",
    description: "Local area highlights and insights",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Showcase neighborhoods to potential buyers"
  },
  {
    id: "buyer_features_checklist",
    name: "Must-Have Home Features",
    category: "buyers",
    description: "Essential features buyers should consider",
    designStyle: "minimal",
    colorScheme: "blue",
    useCase: "Help buyers prioritize home features"
  },
  {
    id: "buyer_success_story",
    name: "Buyer Success Story",
    category: "buyers",
    description: "Celebrate successful buyer transactions",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Share testimonials from happy buyers"
  },
  {
    id: "buyer_preapproval",
    name: "Pre-Approval Importance",
    category: "buyers",
    description: "Why pre-approval matters",
    designStyle: "modern",
    colorScheme: "green",
    useCase: "Encourage buyers to get pre-approved"
  },
  {
    id: "buyer_closing_process",
    name: "Closing Process Guide",
    category: "buyers",
    description: "What to expect at closing",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Demystify the closing process for buyers"
  },
  {
    id: "buyer_moving_tips",
    name: "Moving Day Tips",
    category: "buyers",
    description: "Make moving easier and stress-free",
    designStyle: "minimal",
    colorScheme: "orange",
    useCase: "Help buyers prepare for their move"
  },
  {
    id: "buyer_warranty_info",
    name: "Home Warranty Guide",
    category: "buyers",
    description: "Understanding home warranties",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Educate buyers on warranty options"
  },
  {
    id: "buyer_investment_property",
    name: "Buying Investment Property",
    category: "buyers",
    description: "Tips for first-time rental property buyers",
    designStyle: "bold",
    colorScheme: "purple",
    useCase: "Guide buyers interested in investment properties"
  },

  // SELLERS TEMPLATES (15)
  {
    id: "seller_just_listed",
    name: "Just Listed Announcement",
    category: "sellers",
    description: "Bold new listing announcement",
    designStyle: "bold",
    colorScheme: "red",
    useCase: "Announce new listings with impact"
  },
  {
    id: "seller_just_sold",
    name: "Just Sold Celebration",
    category: "sellers",
    description: "Celebrate successful sales",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Showcase your sales success"
  },
  {
    id: "seller_open_house",
    name: "Open House Invitation",
    category: "sellers",
    description: "Inviting open house announcement",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Promote open house events"
  },
  {
    id: "seller_staging_tips",
    name: "Home Staging Tips",
    category: "sellers",
    description: "How to stage homes for sale",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Help sellers prepare their homes"
  },
  {
    id: "seller_pricing_strategy",
    name: "Pricing Your Home Right",
    category: "sellers",
    description: "Strategic pricing advice",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Educate sellers on pricing strategies"
  },
  {
    id: "seller_prep_checklist",
    name: "Pre-Listing Checklist",
    category: "sellers",
    description: "Steps to prepare home for listing",
    designStyle: "minimal",
    colorScheme: "green",
    useCase: "Guide sellers through pre-listing prep"
  },
  {
    id: "seller_curb_appeal",
    name: "Curb Appeal Boosters",
    category: "sellers",
    description: "Enhance your home's first impression",
    designStyle: "bold",
    colorScheme: "orange",
    useCase: "Help sellers improve exterior appeal"
  },
  {
    id: "seller_market_update",
    name: "Seller's Market Update",
    category: "sellers",
    description: "Current market conditions for sellers",
    designStyle: "data",
    colorScheme: "purple",
    useCase: "Share market insights with potential sellers"
  },
  {
    id: "seller_why_now",
    name: "Why Sell Now",
    category: "sellers",
    description: "Reasons to list your home today",
    designStyle: "bold",
    colorScheme: "red",
    useCase: "Motivate sellers to list their properties"
  },
  {
    id: "seller_home_value",
    name: "Home Value Estimator",
    category: "sellers",
    description: "What's your home worth?",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Offer free home valuations"
  },
  {
    id: "seller_success_story",
    name: "Seller Success Story",
    category: "sellers",
    description: "Happy seller testimonial",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Share seller testimonials"
  },
  {
    id: "seller_prelisting_prep",
    name: "Getting Ready to List",
    category: "sellers",
    description: "Preparation before listing",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Help sellers prepare for the listing process"
  },
  {
    id: "seller_photography",
    name: "Professional Photos Matter",
    category: "sellers",
    description: "Importance of quality listing photos",
    designStyle: "elegant",
    colorScheme: "purple",
    useCase: "Emphasize the value of professional photography"
  },
  {
    id: "seller_negotiation",
    name: "Negotiation Tips for Sellers",
    category: "sellers",
    description: "How to negotiate offers effectively",
    designStyle: "bold",
    colorScheme: "orange",
    useCase: "Prepare sellers for negotiations"
  },
  {
    id: "seller_closing_costs",
    name: "Seller Closing Costs Breakdown",
    category: "sellers",
    description: "Understanding seller expenses",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Educate sellers on closing costs"
  },

  // INVESTORS TEMPLATES (10)
  {
    id: "investor_roi_calculator",
    name: "ROI Calculator",
    category: "investors",
    description: "Calculate investment returns",
    designStyle: "data",
    colorScheme: "green",
    useCase: "Help investors analyze potential returns"
  },
  {
    id: "investor_cashflow",
    name: "Cash Flow Analysis",
    category: "investors",
    description: "Rental property cash flow breakdown",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Show investors how to analyze cash flow"
  },
  {
    id: "investor_fix_flip",
    name: "Fix & Flip Opportunities",
    category: "investors",
    description: "Properties with flip potential",
    designStyle: "bold",
    colorScheme: "orange",
    useCase: "Highlight fix-and-flip opportunities"
  },
  {
    id: "investor_rental_tips",
    name: "Rental Property Tips",
    category: "investors",
    description: "Managing rental investments",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Guide investors on rental property management"
  },
  {
    id: "investor_market_trends",
    name: "Investment Market Trends",
    category: "investors",
    description: "Current investment opportunities",
    designStyle: "data",
    colorScheme: "purple",
    useCase: "Share market trends with investors"
  },
  {
    id: "investor_1031_exchange",
    name: "1031 Exchange Guide",
    category: "investors",
    description: "Tax-deferred exchange strategies",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Educate investors on 1031 exchanges"
  },
  {
    id: "investor_commercial",
    name: "Commercial Opportunities",
    category: "investors",
    description: "Commercial real estate investments",
    designStyle: "bold",
    colorScheme: "teal",
    useCase: "Showcase commercial investment properties"
  },
  {
    id: "investor_multifamily",
    name: "Multi-Family Properties",
    category: "investors",
    description: "Apartment and multi-unit investments",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Highlight multi-family investment opportunities"
  },
  {
    id: "investor_strategies",
    name: "Investment Strategies",
    category: "investors",
    description: "Different approaches to real estate investing",
    designStyle: "data",
    colorScheme: "purple",
    useCase: "Share various investment strategies"
  },
  {
    id: "investor_portfolio",
    name: "Portfolio Diversification",
    category: "investors",
    description: "Building a balanced real estate portfolio",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Advise investors on portfolio management"
  },

  // GENERAL/AUTHORITY TEMPLATES (10)
  {
    id: "general_market_stats",
    name: "Market Statistics",
    category: "general",
    description: "Local market data and insights",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Share market statistics and trends"
  },
  {
    id: "general_market_update",
    name: "Monthly Market Update",
    category: "general",
    description: "Comprehensive market overview",
    designStyle: "data",
    colorScheme: "blue",
    useCase: "Provide regular market updates"
  },
  {
    id: "general_interest_rates",
    name: "Interest Rate News",
    category: "general",
    description: "Current mortgage rate information",
    designStyle: "modern",
    colorScheme: "green",
    useCase: "Update followers on interest rate changes"
  },
  {
    id: "general_economic_indicators",
    name: "Economic Indicators",
    category: "general",
    description: "Economic factors affecting real estate",
    designStyle: "data",
    colorScheme: "purple",
    useCase: "Share economic insights"
  },
  {
    id: "general_testimonial",
    name: "Client Testimonial",
    category: "general",
    description: "Customer review and feedback",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Showcase client testimonials"
  },
  {
    id: "general_agent_intro",
    name: "Agent Introduction",
    category: "general",
    description: "Introduce yourself to your audience",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Build personal brand and connection"
  },
  {
    id: "general_team_announcement",
    name: "Team Announcement",
    category: "general",
    description: "Team news and updates",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Share team milestones and news"
  },
  {
    id: "general_community",
    name: "Community Involvement",
    category: "general",
    description: "Local community engagement",
    designStyle: "bold",
    colorScheme: "orange",
    useCase: "Show community involvement"
  },
  {
    id: "general_awards",
    name: "Awards & Recognition",
    category: "general",
    description: "Celebrate achievements",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Share awards and accomplishments"
  },
  {
    id: "general_educational",
    name: "Educational Content",
    category: "general",
    description: "Real estate education and tips",
    designStyle: "minimal",
    colorScheme: "blue",
    useCase: "Provide valuable educational content"
  },

  // EXPIRED LISTINGS TEMPLATES (15)
  {
    id: "expired_why_didnt_sell",
    name: "Why Your Home Didn't Sell",
    category: "expireds",
    description: "Educational post explaining common reasons listings expire",
    designStyle: "data",
    colorScheme: "red",
    useCase: "Position yourself as the solution for expired listings"
  },
  {
    id: "expired_pricing_strategy",
    name: "Pricing Strategy for Expireds",
    category: "expireds",
    description: "Data-driven pricing approach for relisting",
    designStyle: "bold",
    colorScheme: "orange",
    useCase: "Show expertise in pricing expired listings correctly"
  },
  {
    id: "expired_marketing_difference",
    name: "What We Do Differently",
    category: "expireds",
    description: "Highlight your unique marketing approach",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Differentiate from previous agent"
  },
  {
    id: "expired_success_story",
    name: "Expired to Sold Success Story",
    category: "expireds",
    description: "Case study of expired listing you sold",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Build credibility with expired sellers"
  },
  {
    id: "expired_market_analysis",
    name: "Fresh Market Analysis",
    category: "expireds",
    description: "Updated CMA for expired properties",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Show current market positioning"
  },
  {
    id: "expired_photography_matters",
    name: "Professional Photography Impact",
    category: "expireds",
    description: "Before/after of listing photos",
    designStyle: "bold",
    colorScheme: "purple",
    useCase: "Highlight importance of quality marketing materials"
  },
  {
    id: "expired_staging_tips",
    name: "Staging for a Fresh Start",
    category: "expireds",
    description: "Home preparation for relisting",
    designStyle: "minimal",
    colorScheme: "green",
    useCase: "Help sellers improve presentation"
  },
  {
    id: "expired_timing_matters",
    name: "Best Time to Relist",
    category: "expireds",
    description: "Seasonal timing strategies",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Guide sellers on optimal relisting timing"
  },
  {
    id: "expired_online_presence",
    name: "Maximizing Online Visibility",
    category: "expireds",
    description: "Digital marketing strategy",
    designStyle: "bold",
    colorScheme: "orange",
    useCase: "Show superior online marketing approach"
  },
  {
    id: "expired_showing_feedback",
    name: "Learning from Showing Feedback",
    category: "expireds",
    description: "Analyze previous showing comments",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Use data to improve listing strategy"
  },
  {
    id: "expired_open_house_strategy",
    name: "Strategic Open House Plan",
    category: "expireds",
    description: "Aggressive showing strategy",
    designStyle: "modern",
    colorScheme: "purple",
    useCase: "Show proactive marketing approach"
  },
  {
    id: "expired_agent_network",
    name: "Agent-to-Agent Marketing",
    category: "expireds",
    description: "Broker network outreach",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Highlight industry connections"
  },
  {
    id: "expired_buyer_pool",
    name: "Our Active Buyer Database",
    category: "expireds",
    description: "Showcase buyer network",
    designStyle: "bold",
    colorScheme: "blue",
    useCase: "Demonstrate immediate buyer access"
  },
  {
    id: "expired_guarantee",
    name: "Our Performance Guarantee",
    category: "expireds",
    description: "Confidence-building offer",
    designStyle: "luxury",
    colorScheme: "gold",
    useCase: "Reduce risk perception for sellers"
  },
  {
    id: "expired_free_consultation",
    name: "Free Expired Listing Review",
    category: "expireds",
    description: "CTA for consultation",
    designStyle: "modern",
    colorScheme: "green",
    useCase: "Generate leads from expired listings"
  },

  // URGENT SELLERS TEMPLATES (15)
  {
    id: "urgent_moving_timeline",
    name: "Quick Sale for Job Relocation",
    category: "urgent_sellers",
    description: "Fast sale strategies for relocating sellers",
    designStyle: "bold",
    colorScheme: "red",
    useCase: "Target sellers who must move quickly for work"
  },
  {
    id: "urgent_divorce_discretion",
    name: "Discreet Divorce Sale Process",
    category: "urgent_sellers",
    description: "Sensitive handling of divorce sales",
    designStyle: "elegant",
    colorScheme: "blue",
    useCase: "Show empathy and professionalism for difficult situations"
  },
  {
    id: "urgent_foreclosure_prevention",
    name: "Avoid Foreclosure with Quick Sale",
    category: "urgent_sellers",
    description: "Options to prevent foreclosure",
    designStyle: "data",
    colorScheme: "orange",
    useCase: "Help distressed homeowners understand their options"
  },
  {
    id: "urgent_cash_offers",
    name: "Cash Buyer Network",
    category: "urgent_sellers",
    description: "Access to investors for quick closes",
    designStyle: "bold",
    colorScheme: "green",
    useCase: "Highlight ability to facilitate fast cash sales"
  },
  {
    id: "urgent_as_is_sale",
    name: "Sell As-Is Without Repairs",
    category: "urgent_sellers",
    description: "No-hassle sale process",
    designStyle: "minimal",
    colorScheme: "teal",
    useCase: "Attract sellers who can't afford repairs"
  },
  {
    id: "urgent_estate_sale",
    name: "Compassionate Estate Sales",
    category: "urgent_sellers",
    description: "Handling inherited property sales",
    designStyle: "elegant",
    colorScheme: "purple",
    useCase: "Show sensitivity for estate situations"
  },
  {
    id: "urgent_medical_emergency",
    name: "Quick Sale for Medical Needs",
    category: "urgent_sellers",
    description: "Fast liquidation for medical expenses",
    designStyle: "modern",
    colorScheme: "red",
    useCase: "Help sellers facing medical financial pressure"
  },
  {
    id: "urgent_downsizing_fast",
    name: "Rapid Downsizing Solutions",
    category: "urgent_sellers",
    description: "Quick transition to smaller home",
    designStyle: "minimal",
    colorScheme: "blue",
    useCase: "Target empty nesters or seniors needing quick moves"
  },
  {
    id: "urgent_bankruptcy",
    name: "Pre-Bankruptcy Sale Options",
    category: "urgent_sellers",
    description: "Maximize proceeds before bankruptcy",
    designStyle: "data",
    colorScheme: "orange",
    useCase: "Provide solutions for financial distress"
  },
  {
    id: "urgent_military_deployment",
    name: "Military PCS Quick Sale",
    category: "urgent_sellers",
    description: "Fast sales for military families",
    designStyle: "bold",
    colorScheme: "blue",
    useCase: "Serve military families with tight timelines"
  },
  {
    id: "urgent_job_loss",
    name: "Affordable Options After Job Loss",
    category: "urgent_sellers",
    description: "Helping sellers reduce housing costs",
    designStyle: "modern",
    colorScheme: "teal",
    useCase: "Show empathy for employment challenges"
  },
  {
    id: "urgent_family_emergency",
    name: "Emergency Sale Assistance",
    category: "urgent_sellers",
    description: "Rapid response for family emergencies",
    designStyle: "elegant",
    colorScheme: "purple",
    useCase: "Position as responsive to urgent needs"
  },
  {
    id: "urgent_investor_buyout",
    name: "Investor Buyout Options",
    category: "urgent_sellers",
    description: "Connect with cash investors",
    designStyle: "bold",
    colorScheme: "gold",
    useCase: "Facilitate quick investor purchases"
  },
  {
    id: "urgent_short_sale",
    name: "Short Sale Expertise",
    category: "urgent_sellers",
    description: "Navigate short sale process",
    designStyle: "data",
    colorScheme: "red",
    useCase: "Show expertise in complex distressed sales"
  },
  {
    id: "urgent_free_valuation",
    name: "Free Urgent Sale Consultation",
    category: "urgent_sellers",
    description: "No-obligation assessment",
    designStyle: "modern",
    colorScheme: "green",
    useCase: "Generate leads from urgent seller situations"
  },

  // FSBOS (FOR SALE BY OWNER) TEMPLATES (10)
  {
    id: "fsbo_why_agent",
    name: "Why FSBOs Need an Agent",
    category: "fsbos",
    description: "Educational content on benefits of hiring an agent",
    designStyle: "data",
    colorScheme: "blue",
    useCase: "Position value proposition to FSBO sellers"
  },
  {
    id: "fsbo_pricing_mistakes",
    name: "Common FSBO Pricing Mistakes",
    category: "fsbos",
    description: "Highlight pricing errors FSBOs make",
    designStyle: "bold",
    colorScheme: "red",
    useCase: "Show expertise in pricing strategy"
  },
  {
    id: "fsbo_legal_pitfalls",
    name: "Legal Pitfalls of Selling Alone",
    category: "fsbos",
    description: "Contract and disclosure risks",
    designStyle: "elegant",
    colorScheme: "orange",
    useCase: "Demonstrate protection agents provide"
  },
  {
    id: "fsbo_marketing_reach",
    name: "MLS vs. FSBO Marketing Reach",
    category: "fsbos",
    description: "Data on buyer exposure differences",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Show marketing advantage of MLS listing"
  },
  {
    id: "fsbo_negotiation_expertise",
    name: "Professional Negotiation Value",
    category: "fsbos",
    description: "How agents maximize sale price",
    designStyle: "modern",
    colorScheme: "gold",
    useCase: "Highlight negotiation skills"
  },
  {
    id: "fsbo_time_investment",
    name: "Hidden Time Cost of FSBO",
    category: "fsbos",
    description: "Hours required to sell without agent",
    designStyle: "minimal",
    colorScheme: "purple",
    useCase: "Show time savings of hiring agent"
  },
  {
    id: "fsbo_buyer_concerns",
    name: "Why Buyers Avoid FSBOs",
    category: "fsbos",
    description: "Buyer agent perspectives on FSBOs",
    designStyle: "bold",
    colorScheme: "red",
    useCase: "Reveal buyer hesitations about FSBOs"
  },
  {
    id: "fsbo_showing_management",
    name: "Professional Showing Coordination",
    category: "fsbos",
    description: "Scheduling and safety benefits",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Show convenience of agent representation"
  },
  {
    id: "fsbo_free_consultation",
    name: "Free FSBO Market Analysis",
    category: "fsbos",
    description: "No-obligation CMA offer",
    designStyle: "elegant",
    colorScheme: "green",
    useCase: "Generate leads from FSBO sellers"
  },
  {
    id: "fsbo_success_rate",
    name: "FSBO vs. Agent Success Rates",
    category: "fsbos",
    description: "Statistical comparison of outcomes",
    designStyle: "data",
    colorScheme: "orange",
    useCase: "Use data to show agent advantage"
  },

  // LUXURY MARKET TEMPLATES (10)
  {
    id: "luxury_market_trends",
    name: "Luxury Market Trends",
    category: "luxury",
    description: "High-end market analysis and insights",
    designStyle: "luxury",
    colorScheme: "gold",
    useCase: "Position as luxury market expert"
  },
  {
    id: "luxury_property_features",
    name: "Must-Have Luxury Amenities",
    category: "luxury",
    description: "Premium features buyers expect",
    designStyle: "elegant",
    colorScheme: "purple",
    useCase: "Showcase luxury property knowledge"
  },
  {
    id: "luxury_staging",
    name: "Luxury Home Staging Secrets",
    category: "luxury",
    description: "High-end presentation strategies",
    designStyle: "luxury",
    colorScheme: "gold",
    useCase: "Demonstrate luxury staging expertise"
  },
  {
    id: "luxury_photography",
    name: "Professional Luxury Photography",
    category: "luxury",
    description: "Importance of premium visuals",
    designStyle: "elegant",
    colorScheme: "blue",
    useCase: "Show commitment to quality marketing"
  },
  {
    id: "luxury_buyer_profile",
    name: "Understanding Luxury Buyers",
    category: "luxury",
    description: "Psychology of affluent purchasers",
    designStyle: "modern",
    colorScheme: "teal",
    useCase: "Display understanding of luxury clientele"
  },
  {
    id: "luxury_discretion",
    name: "Discreet Luxury Sales",
    category: "luxury",
    description: "Privacy and confidentiality in high-end sales",
    designStyle: "elegant",
    colorScheme: "purple",
    useCase: "Emphasize discretion for privacy-focused clients"
  },
  {
    id: "luxury_international",
    name: "International Luxury Buyers",
    category: "luxury",
    description: "Global marketing reach",
    designStyle: "luxury",
    colorScheme: "gold",
    useCase: "Show international buyer network"
  },
  {
    id: "luxury_investment",
    name: "Luxury as Investment",
    category: "luxury",
    description: "High-end property appreciation",
    designStyle: "data",
    colorScheme: "green",
    useCase: "Position luxury real estate as wealth building"
  },
  {
    id: "luxury_concierge",
    name: "White-Glove Concierge Service",
    category: "luxury",
    description: "Premium client experience",
    designStyle: "elegant",
    colorScheme: "gold",
    useCase: "Highlight exceptional service standards"
  },
  {
    id: "luxury_portfolio",
    name: "Luxury Portfolio Showcase",
    category: "luxury",
    description: "Past high-end sales and listings",
    designStyle: "luxury",
    colorScheme: "purple",
    useCase: "Build credibility with luxury sellers"
  },

  // FIRST-TIME SELLERS TEMPLATES (10)
  {
    id: "first_seller_process",
    name: "Selling Process Step-by-Step",
    category: "first_time_sellers",
    description: "Complete guide for new sellers",
    designStyle: "minimal",
    colorScheme: "blue",
    useCase: "Educate first-time sellers on process"
  },
  {
    id: "first_seller_preparation",
    name: "Preparing Your Home to Sell",
    category: "first_time_sellers",
    description: "Pre-listing home prep checklist",
    designStyle: "modern",
    colorScheme: "green",
    useCase: "Help new sellers get ready"
  },
  {
    id: "first_seller_pricing",
    name: "How to Price Your First Home",
    category: "first_time_sellers",
    description: "Pricing strategy for beginners",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Simplify pricing for new sellers"
  },
  {
    id: "first_seller_costs",
    name: "Understanding Closing Costs",
    category: "first_time_sellers",
    description: "Breakdown of seller expenses",
    designStyle: "minimal",
    colorScheme: "orange",
    useCase: "Set realistic expectations on costs"
  },
  {
    id: "first_seller_timeline",
    name: "Realistic Selling Timeline",
    category: "first_time_sellers",
    description: "How long it really takes",
    designStyle: "modern",
    colorScheme: "blue",
    useCase: "Manage timeline expectations"
  },
  {
    id: "first_seller_repairs",
    name: "Which Repairs to Make Before Listing",
    category: "first_time_sellers",
    description: "ROI on pre-sale improvements",
    designStyle: "bold",
    colorScheme: "green",
    useCase: "Guide repair investment decisions"
  },
  {
    id: "first_seller_showings",
    name: "Preparing for Home Showings",
    category: "first_time_sellers",
    description: "Tips for successful showings",
    designStyle: "minimal",
    colorScheme: "purple",
    useCase: "Help sellers present home well"
  },
  {
    id: "first_seller_offers",
    name: "Evaluating Buyer Offers",
    category: "first_time_sellers",
    description: "Beyond just the price",
    designStyle: "data",
    colorScheme: "teal",
    useCase: "Teach offer evaluation criteria"
  },
  {
    id: "first_seller_negotiation",
    name: "Negotiation Tips for New Sellers",
    category: "first_time_sellers",
    description: "How to respond to offers",
    designStyle: "modern",
    colorScheme: "orange",
    useCase: "Build confidence in negotiations"
  },
  {
    id: "first_seller_mistakes",
    name: "Top 10 First-Time Seller Mistakes",
    category: "first_time_sellers",
    description: "Common pitfalls to avoid",
    designStyle: "bold",
    colorScheme: "red",
    useCase: "Prevent costly beginner errors"
  },
];

export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return TEMPLATE_LIBRARY.filter(t => t.category === category);
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATE_LIBRARY.find(t => t.id === id);
}
