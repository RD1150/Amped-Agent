export type TemplateCategory = "buyers" | "sellers" | "investors" | "general";

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
];

export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return TEMPLATE_LIBRARY.filter(t => t.category === category);
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATE_LIBRARY.find(t => t.id === id);
}
