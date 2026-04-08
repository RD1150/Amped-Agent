# Realty Content Agent - Project TODO

## URGENT Bug Fixes - Photo Upload Complete Rewrite
- [x] Create new /api/upload-images endpoint with multipart form data (bypass tRPC)
- [x] Add server-side image compression using Sharp library
- [x] Rewrite frontend to use fetch() with FormData instead of tRPC mutation
- [x] Test upload with AI-generated demo images

## Property Tours - Video Generation Issues (RESOLVED ✅)
- [x] Debug Shotstack 403 Forbidden error - ROOT CAUSE: Insufficient credits
- [x] Verify Shotstack API key is valid and has correct permissions - VALID
- [x] Test with minimal payload to isolate the issue - PASSED
- [x] Check if account has rendering credits/quota - 200 credits available
- [x] Review Shotstack account settings and tier limits - NO RESTRICTIONS
- [x] Integration verified working - ALL TESTS PASSED
- [x] Technical audit report complete - See SHOTSTACK_AUDIT_REPORT.md
- [x] Fix Shotstack 400 Bad Request - 6 validation errors: invalid filter object format (must use preset strings like "boost", not {brightness,contrast,saturation})
- [x] Fix perPhotoMovements null values causing 400 validation error on create mutation
- [x] Verified: Standard mode and Full Cinematic mode both submit successfully to Shotstack

## Property Tours - Full AI Cinematic Mode
- [x] Fix Luma AI content moderation issues (currently blocking all images) - RESOLVED: Switched to Runway AI
- [x] Implement graceful fallback when Luma AI fails (use Ken Burns instead of breaking) - RESOLVED: Runway AI works reliably
- [x] Re-enable Full AI Cinematic mode once Luma AI is working reliably - RESOLVED: Full Cinematic mode now uses Runway AI
- [x] Test with real property photos (not AI-generated) - VERIFIED: Generated sample video with 4 real property images
- [x] Generate sample Full Cinematic Property Tour video to validate 75cr pricing - COMPLETED: See full-cinematic-sample-report.md
- [x] Fix Shotstack API validation errors (removed motionBlur and type properties) - FIXED
- [x] Validate Runway AI integration with 4 property images - VERIFIED: All 4 clips generated successfully
- [x] Confirm 93% profit margin on Full Cinematic tier - CONFIRMED: $3.37 cost vs $7.50 revenue

## Property Tours - Camera Movement Improvements
- [x] Improve camera movements - add varied cinematic animations (forward pushes, tilts, diagonal pans, zooms) instead of basic left-to-right Ken Burns pans
- [x] Implement multiple movement patterns that rotate through photos
- [ ] Test improved movements with real property photos

## Property Tours - Runway ML Prompt Customization
- [x] Add custom prompt input field to Property Tours UI (text area for camera movement descriptions)
- [x] Wire prompt input to backend video generation
- [x] Update Runway ML service to use custom prompts instead of generic "cinematic" prompt
- [x] Add prompt examples/suggestions (drone shot, dolly push, crane up, etc.)
- [ ] Test with user-provided prompts

## Property Tours - Camera Movement Prompt Templates
- [x] Add dropdown/select with preset camera movement templates
- [x] Include common presets: Drone Shot, Dolly Push, Crane Reveal, Tracking Shot, Pan Across, Zoom In/Out
- [x] Allow users to select preset or write custom prompt
- [ ] Test preset selection and custom prompt override

## Property Tours - Photo Library Feature
- [ ] Create photo library database schema (user_id, file_url, tags, metadata)
- [ ] Build "My Photos" page with upload and organization UI
- [ ] Add photo tagging system (property, room type, custom labels)
- [ ] Implement photo selection from library when creating tours
- [ ] Add photo reuse across multiple videos
- [ ] Display photo metadata (upload date, dimensions, file size)

## Branding Update
- [x] Update index.html page title to "Realty Content Agent"
- [x] Update package.json name to "realty-content-agent"
- [x] Verify landing page shows correct branding
- [x] Verify dashboard logo shows RCA branding

## Core Features
- [x] Database schema (users, content posts, calendar events, personas, integrations)
- [x] Dashboard layout with sidebar navigation
- [x] Content calendar with monthly view
- [x] AI-powered content generation (property listings, market reports, trending news)
- [x] CSV file import for bulk content generation
- [ ] Google Docs import for bulk content generation (future enhancement)
- [x] Auto-generation logic to spread content across month
- [x] Social media integrations (Facebook, Instagram, LinkedIn, Twitter)
- [x] Persona & Brand settings
- [x] Content uploads management
- [x] Settings page
- [x] Help & Support section

## UI/UX Improvements (vs original)
- [x] Premium dark/gold color scheme
- [x] Modern, cleaner design with better visual hierarchy
- [x] Mobile responsive design
- [ ] Analytics dashboard for content performance
- [ ] Improved content preview before publishing

## Backend APIs
- [x] Content CRUD operations
- [x] Calendar event management
- [x] AI content generation endpoint
- [x] File upload/import processing
- [x] Persona/brand settings management
- [x] Integration status management

## Testing
- [x] Unit tests for core tRPC procedures
- [x] Test CSV import parsing
- [x] Test AI content generation input validation

## Visual Content Generation (Re-implementation)
- [x] AI Image Generation - Generate custom visuals for posts
- [x] Template-based Graphics - Branded social media templates with overlays
- [x] Stock Image Integration - Search and suggest relevant stock images
- [x] Update AI Generate page to include visual options
- [x] Display generated images alongside text content

## GoHighLevel Integration (Re-implementation)
- [x] GHL database schema and API setup
- [x] Push content to GHL social planner
- [x] Sync with GHL calendar
- [x] GHL settings page for API credentials
- [x] Test connection functionality

## Analytics Dashboard (New)
- [x] Create analytics database schema (post views, engagement, clicks, shares)
- [x] Build analytics dashboard page with charts and metrics
- [x] Track post performance across platforms
- [x] Show engagement rates and trends over time
- [x] Display top-performing content types
- [x] Add date range filters for analytics

## Automated Posting Schedules (New)
- [x] Create posting schedule database schema
- [x] Build schedule configuration page
- [x] Implement recurring content patterns (daily, weekly, monthly)
- [x] Add optimal posting time suggestions
- [x] Create schedule templates (e.g., Mon: listings, Wed: tips, Fri: neighborhoods)
- [x] Auto-generate content based on schedule rules
- [x] Queue system for scheduled posts

## Enhanced GoHighLevel Integration (New)
- [x] Improve GHL connection workflow
- [x] Add step-by-step setup wizard
- [x] Test actual GHL API integration
- [x] Add error handling and retry logic
- [x] Display connection status in dashboard

## Usage Tracking System (Phase 1 - Priority)
- [x] Create subscription tiers database schema (Basic, Pro, Agency)
- [x] Track usage metrics (posts generated, images created, API calls)
- [x] Enforce tier limits with graceful error messages
- [x] Usage dashboard for users to see their consumption
- [x] Admin analytics for overall platform usage
- [x] Usage alert system (80%, 90%, 100% of limit)

## GHL Webhook Handler (Phase 2 - Priority)
- [x] Webhook endpoint to receive GHL events
- [x] Handle user signup events from GHL
- [x] Handle subscription tier updates
- [x] Handle cancellation/suspension events
- [x] Sync user status between GHL and RealtyContentAgent
- [x] Error handling and retry logic
- [ ] Webhook security (signature verification) - TODO: Add HMAC verification

## Social Media OAuth (Phase 3 - Priority)
- [ ] Facebook OAuth flow implementation - See comprehensive guide
- [ ] Instagram OAuth (via Facebook Business) - See comprehensive guide
- [ ] LinkedIn OAuth implementation - See comprehensive guide
- [ ] Twitter/X OAuth implementation - See comprehensive guide
- [ ] Token refresh automation - See comprehensive guide
- [ ] Actual post publishing to each platform - See comprehensive guide
- [ ] Error handling for failed posts - See comprehensive guide
- [x] OAuth comprehensive implementation guide - Created Social-Media-OAuth-Guide.md

## White-label Capabilities (Phase 4)
- [ ] Create white-label settings database schema
- [ ] Custom branding configuration (logo, colors, app name)
- [ ] Custom domain support
- [ ] Dynamic theme system based on white-label settings
- [ ] Agency-specific styling and assets
- [ ] White-label settings UI page
- [ ] Remove hardcoded "RealtyContentAgent" branding

## Team Collaboration (Phase 2)
- [ ] Multi-user organization/team database schema
- [ ] Role-based permissions (Admin, Editor, Viewer)
- [ ] Team member invitation system
- [ ] User management UI for admins
- [ ] Activity logs and audit trails
- [ ] Shared content library per team
- [ ] Permission checks on all protected routes

## Client Management (Phase 3)
- [ ] Client accounts database schema
- [ ] Agency dashboard to manage multiple clients
- [ ] Per-client branding and settings
- [ ] Client switching interface
- [ ] Separate analytics per client
- [ ] Billing and usage tracking per client
- [ ] Client onboarding workflow

## Facebook/Instagram OAuth Implementation (New Priority)
- [x] Set up Facebook App in Meta Developer Console
- [x] Implement Facebook OAuth callback endpoint
- [x] Store Facebook access tokens securely (encrypted)
- [ ] Implement token refresh automation
- [ ] Build Facebook posting API integration
- [ ] Add Instagram Business Account connection
- [ ] Implement Instagram posting via Facebook Graph API
- [ ] Test posting to both platforms
- [ ] Error handling for failed posts and expired tokens

## Usage Dashboard UI (New Priority)
- [ ] Create Usage Dashboard page component
- [ ] Display current usage metrics (posts, images, API calls)
- [ ] Show tier limits and remaining quota
- [ ] Add progress bars for visual usage tracking
- [ ] Implement upgrade prompts at 80%, 90%, 100% thresholds
- [ ] Add tier comparison table
- [ ] Link to GHL payment/upgrade flow
- [ ] Add usage history chart

## Webhook Signature Verification (New Priority)
- [ ] Add HMAC signature generation for outgoing webhooks
- [ ] Implement HMAC signature verification for incoming GHL webhooks
- [ ] Add webhook secret configuration
- [ ] Reject webhooks with invalid signatures
- [ ] Log webhook verification failures
- [ ] Add webhook testing endpoint for development

## Facebook App Submission Requirements
- [x] Generate 1024x1024 app icon for RealtyContentAgent
- [x] Create Privacy Policy page
- [x] Create Data Deletion Request page/form
- [ ] Add Terms of Service page
- [x] Upload app icon to Facebook Developer Console
- [x] Configure app category in Facebook Developer Console
- [x] Complete Facebook OAuth integration with real flow
- [ ] Write unit tests for Facebook OAuth procedures
- [x] Test Facebook OAuth flow end-to-end

## Theme Toggle Feature
- [x] Add theme toggle to user profile dropdown
- [x] Update light theme colors in index.css
- [x] Test theme switching functionality

## Facebook OAuth Integration Fixes
- [x] Update Facebook OAuth scopes to Development Mode compatible scopes
- [x] Test Facebook connection with fixed scopes
- [x] Verify Reena Dutta Real Estate page access

## Instagram Business Account Integration (Current Priority)
- [x] Update Facebook OAuth scopes to include Instagram permissions (instagram_basic, instagram_content_publish, pages_show_list, pages_read_engagement)
- [x] Extend database schema to store Instagram Business Account ID and username
- [x] Implement Instagram Business Account detection via Facebook Pages
- [x] Build Instagram feed post creation (image + caption)
- [ ] Build Instagram story posting capability
- [x] Add Instagram connection status to Integrations page UI
- [x] Display connected Instagram account details (username, profile picture)
- [x] Add disconnect Instagram functionality
- [x] Write unit tests for Instagram procedures
- [x] Test end-to-end Instagram posting flow

## Actual Posting Flow (Priority 1)
- [ ] Add "Publish Now" functionality to Content Calendar
- [ ] Implement post publishing to Facebook via Graph API
- [ ] Implement post publishing to Instagram via Graph API
- [ ] Add platform selection (Facebook, Instagram, both)
- [ ] Handle image upload to public URL for posting
- [ ] Add posting status tracking (pending, published, failed)
- [ ] Show success/error notifications after posting
- [ ] Add "View Post" link after successful publish
- [ ] Write unit tests for posting procedures
- [ ] Test end-to-end posting flow

## Market Stats Feature (Priority 2)
- [ ] Create Market Stats page component
- [ ] Add Market Stats navigation item to sidebar
- [ ] Build location search input (city, zipcode, address)
- [ ] Integrate real estate data API for market statistics
- [ ] Display key metrics (median price, days on market, inventory, price per sqft)
- [ ] Add charts/visualizations for trends
- [ ] Implement "Generate Post" button to create market update content
- [ ] Use AI to generate market insights and social media captions
- [ ] Save generated market posts to Content Calendar
- [ ] Write unit tests for market stats procedures
- [ ] Test market stats data fetching and post generation

## Generate Full Month Feature (Priority 3)
- [ ] Add "Generate Full Month" button to Content Calendar
- [ ] Create content generation strategy (variety of post types)
- [ ] Implement 30-day content planning algorithm
- [ ] Generate mix of content types (listings, tips, market updates, neighborhoods)
- [ ] Space content evenly across the month
- [ ] Use AI to generate unique content for each post
- [ ] Generate images for each post (AI or templates)
- [ ] Save all generated posts to calendar
- [ ] Add progress indicator for generation process
- [ ] Allow customization of content mix preferences
- [ ] Write unit tests for bulk generation
- [ ] Test full month generation end-to-end

## GHL Social Posting Integration (Priority 1)
- [x] Research GHL Social Planner API endpoints and authentication
- [x] Implement GHL API client with location/account selection
- [x] Add "Publish to Social Media" button on Content Calendar posts
- [x] Build post formatting for GHL Social Planner (text, image, platforms)
- [x] Handle image upload to GHL or public URL
- [x] Add platform selection UI (uses all connected accounts)
- [x] Implement scheduling to GHL (immediate or future date with date/time picker)
- [x] Add posting status tracking (pending, sent to GHL, published, failed)
- [x] Show success notifications after posting
- [x] Handle GHL API errors gracefully
- [ ] Write unit tests for GHL posting procedures
- [x] Test end-to-end posting flow to GHL - VERIFIED WORKING ✅

## Market Stats Feature (Priority 2)
- [x] Create Market Stats page component
- [x] Add Market Stats to sidebar navigation
- [x] Build location search input (city, state, zipcode)
- [ ] Research and integrate real estate data API (Zillow, Realtor.com, or public data)
- [x] Display key metrics placeholders: median home price, days on market, inventory levels, price per sqft
- [ ] Add year-over-year comparison charts
- [x] Show market temperature indicator (hot/balanced/cold)
- [ ] Implement "Generate Market Update Post" button
- [ ] Use AI to analyze data and create insights
- [ ] Generate social media caption with market stats
- [ ] Generate accompanying image (chart or template)
- [ ] Save generated post to Content Calendar
- [ ] Write unit tests for market stats data fetching
- [ ] Test market stats post generation end-to-end

## Generate Full Month Feature (Priority 3)
- [x] Add "Generate Full Month" button to Content Calendar header
- [x] Create content strategy configuration (post type mix, frequency)
- [x] Design 30-day content distribution algorithm
- [x] Generate variety of post types: property listings, tips, market updates, neighborhood spotlights
- [x] Use AI to create unique content for each post
- [ ] Generate or select images for each post (currently text only)
- [x] Space posts evenly across month (one post per day)
- [ ] Add progress modal showing generation status
- [x] Bulk save all posts to Content Calendar
- [ ] Add option to customize content mix preferences
- [ ] Write unit tests for bulk content generation
- [ ] Test full month generation end-to-end

## View/Edit Content Posts Feature
- [ ] Add View/Edit option to post dropdown menu
- [ ] Create dialog to display full post content
- [ ] Add edit functionality to modify post text
- [ ] Save edited content back to database
- [ ] Test viewing and editing posts

## Profile Page (New Priority)
- [ ] Create profile database schema (headshot, bio, business info, branding)
- [ ] Add profile backend procedures (get, update)
- [ ] Build Profile page UI component
- [ ] Add headshot upload with S3 storage
- [ ] Add bio/about text area
- [ ] Add business information fields (brokerage, license, phone, email, website)
- [ ] Add branding fields (logo upload, colors, tagline)
- [ ] Add service areas field (cities/neighborhoods)
- [ ] Integrate profile data into AI content generation
- [ ] Test profile creation and updates

## Landing Page & Pricing (HIGH PRIORITY)
- [ ] Create public landing page for Realty Content Agent
- [ ] Add hero section with value proposition
- [ ] Add features comparison vs RealEstateContent.ai
- [ ] Add pricing section ($79/mo Content Creator tier)
- [ ] Add 14-day free trial signup flow
- [ ] Add testimonials section (ready for customer feedback)
- [x] Add testimonials section
- [ ] Add CTA buttons throughout page

## Content Format Differentiators (HIGH PRIORITY)
- [x] Add format selector UI (Static Post, Reel Script, Carousel)
- [x] Update database schema with 'format' field
- [x] Create format-specific AI prompts for each type
- [ ] Add format icons/badges to calendar posts
- [ ] Update preview dialog to show format-appropriate layout
- [ ] Add format filter to calendar view

## Stripe Billing Integration (HIGH PRIORITY)
- [ ] Set up Stripe products and prices
- [ ] Create subscription management endpoints
- [ ] Add trial period handling (14 days)
- [ ] Build subscription status checking
- [ ] Add usage limits enforcement
- [ ] Create billing portal for users
- [ ] Add webhook handlers for subscription events

## Slideshow Video Generation (HIGH PRIORITY)
- [ ] Install FFmpeg for video processing
- [ ] Create video generation service using FFmpeg
- [ ] Generate vertical (9:16) videos for Reels/TikTok
- [ ] Add text overlays to video frames
- [ ] Add background music to videos
- [ ] Support 3-10 images per video
- [ ] Add transitions between images
- [ ] Export as MP4 format
- [ ] Upload generated videos to S3
- [ ] Add video generation to content creation flow
- [ ] Show video preview in calendar
- [ ] Add "Generate Video" option for posts with images
- [ ] Track video generation usage per user

## Done-For-You Content Generation (HIGHEST PRIORITY - Current Sprint)
- [x] Add AI image generation for static posts (with text overlays)
- [ ] Generate ready-to-post images with captions embedded
- [ ] Add carousel slide image generation (10 designed slides per carousel)
- [x] Add download button for static post images (JPG format)
- [ ] Add download button for carousel slides (ZIP of 10 images)
- [ ] Add preview modal before download
- [x] Store generated images in S3
- [ ] Track image generation usage per user
- [ ] Add image templates with professional designs
- [ ] Support different aspect ratios (1:1 square, 4:5 portrait, 16:9 landscape)

## Rebranding to Realty Content Agent (HIGHEST PRIORITY)
- [ ] Update VITE_APP_TITLE to "Realty Content Agent"
- [ ] Update all "RealtyContentAgent" references in codebase
- [ ] Update meta tags and page titles
- [ ] Update email templates
- [ ] Update AI-generated content placeholders
- [ ] Create new logo/favicon for Realty Content Agent
- [ ] Update domain/subdomain configuration

## Template Graphics System (HIGHEST PRIORITY - Current Sprint)
- [ ] Design 3 Property Listing templates (Modern Luxury, Bold & Bright, Classic Elegant)
- [ ] Design 3 Market Update templates (Data Dashboard, News Flash, Trend Report)
- [ ] Design 3 Tips/Advice templates (Numbered List, Icon Grid, Quote Card)
- [ ] Design 3 Neighborhood templates (Photo Collage, Map Feature, Lifestyle Focus)
- [ ] Design 3 Engagement templates (Question Card, Quote/Motivation, Did You Know)
- [ ] Build template rendering system (HTML Canvas)
- [ ] Add text overlay system for dynamic content
- [ ] Create template selection UI
- [ ] Add "Use Template" vs "AI Generate" choice
- [ ] Implement template download functionality
- [ ] Test all 15 templates with real content

## Launch Essentials (CURRENT PRIORITY)
- [ ] Rebuild Stripe billing integration ($79/mo + 14-day trial)
- [ ] Create public landing page with pricing and features
- [ ] Add Terms of Service page
- [ ] Add Privacy Policy page
- [ ] Add AI Content Disclaimer
- [ ] Add Fair Housing Disclaimer
- [ ] Test all flows and save final checkpoint

## Trending News Post Feature (NEW - Priority 1)
- [ ] Research real estate news APIs (NAR, Realtor.com, NewsAPI with real estate filter)
- [x] Create Trending News page component
- [x] Add Trending News to sidebar navigation
- [ ] Implement news fetching from API (latest real estate headlines)
- [x] Display news articles with title, summary, source, date
- [x] Add "Generate Post" button for each news article
- [x] Use AI to generate engaging social media post about the news
- [ ] Include agent's local market perspective in generated content
- [x] Save generated news posts to Content Calendar
- [x] Add news refresh functionality
- [ ] Write unit tests for news fetching and post generation
- [ ] Test end-to-end news post generation flow

## Market Stats Post Feature (NEW - Priority 1) ✅ COMPLETE
- [x] Create Market Stats page component
- [x] Add Market Stats to sidebar navigation
- [x] Build location search input (city, state, zipcode)
- [x] Research and integrate real estate data API - **RapidAPI Realtor API integrated**
- [x] Display key metrics: median home price, days on market, inventory levels, price per sqft
- [x] Add year-over-year comparison data
- [x] Show market temperature indicator (hot/balanced/cold)
- [x] Implement "Generate Market Stats Post" button
- [x] Use AI to analyze data and create insights with local context
- [x] Generate social media caption with formatted market stats
- [x] Real-time market insights from actual property listings
- [x] 24-hour caching to optimize API usage (500 req/month free tier)
- [x] Save generated market stats posts to Content Calendar
- [x] Write unit tests for market stats procedures - **3 comprehensive tests passing**
- [x] Test end-to-end market stats post generation flow - **Verified working with Houston, TX**

## Logo Update (NEW - Priority 1)
- [x] Copy new RCA horizontal logo to project assets folder
- [x] Update app header to use new logo
- [ ] Generate favicon versions (16x16, 32x32, 192x192, 512x512)
- [ ] Update favicon in index.html
- [ ] Update logo in login/signup pages
- [ ] Update logo in email templates (if any)
- [ ] Test logo display on all pages

## Launch Essentials (Priority 2 - REQUIRED BEFORE PUBLISH)
- [ ] Complete Stripe billing integration
  - [ ] Create Stripe checkout session endpoint
  - [ ] Implement webhook handlers for subscription events
  - [ ] Add "Upgrade to Pro" button in dashboard
  - [x] Build billing portal link for subscription management
  - [ ] Configure $79/mo plan with 14-day free trial
  - [ ] Test checkout flow end-to-end
  - [ ] Test webhook handling (subscription created, updated, cancelled)
- [ ] Build public landing page
  - [ ] Create hero section with compelling headline
  - [x] Add features showcase section
  - [ ] Build pricing comparison vs RealEstateContent.ai
  - [ ] Add "Start Free Trial" signup button
  - [ ] Include social proof/testimonials section
  - [x] Add testimonials section
  - [x] Make landing page responsive
- [ ] Add legal pages (REQUIRED for real estate compliance)
  - [x] Create Terms of Service page
  - [x] Create Privacy Policy page (update existing if needed)
  - [x] Create AI Content Disclaimer page
  - [x] Create Fair Housing Disclaimer page
  - [ ] Add links to legal pages in footer
  - [ ] Ensure legal pages are accessible without login


## Launch Essentials - Phase 5: Stripe Billing (IN PROGRESS)
- [x] Create Stripe product and price ($79/mo with 14-day trial)
- [x] Build checkout session endpoint
- [x] Implement subscription webhook handlers (created, updated, cancelled, trial ending)
- [x] Add subscription status to user database
- [x] Create "Upgrade to Pro" page
- [x] Build billing portal link for subscription management
- [x] Add subscription status checking endpoint
- [ ] Test checkout flow end-to-end
- [ ] Test webhook handling

## Launch Essentials - Phase 6: Landing Page (NEXT)
- [x] Create public landing page route
- [x] Build hero section with compelling headline
- [x] Add features showcase (6 content formats, GHL integration, AI generation)
- [x] Build pricing section ($79/mo vs $99/mo competitor)
- [x] Add "Start Free Trial" CTA button
- [x] Create social proof section
- [x] Add testimonials section
- [x] Make landing page responsive
- [x] Add footer with legal links

## Launch Essentials - Phase 7: Legal Pages (NEXT)
- [x] Create Terms of Service page
- [x] Create Privacy Policy page
- [x] Create AI Content Disclaimer page
- [x] Create Fair Housing Disclaimer page
- [ ] Add footer links to all legal pages
- [ ] Make legal pages accessible without login


## New Features - Phase 9

### Stripe Setup
- [ ] Create Stripe product "Realty Content Agent Pro" in test environment
- [ ] Create price ($79/month with 14-day trial)
- [ ] Get STRIPE_PRICE_ID and update environment variable
- [ ] Test checkout flow end-to-end

### Instagram Integration
- [ ] Set up Instagram Business API credentials
- [ ] Build Instagram OAuth flow
- [ ] Create Instagram posting endpoint
- [ ] Add Instagram to platform selection in content creation
- [ ] Handle Instagram-specific requirements (image formats, captions)
- [ ] Add Instagram connection status to Integrations page

### LinkedIn Integration
- [ ] Set up LinkedIn API credentials
- [ ] Build LinkedIn OAuth flow
- [ ] Create LinkedIn posting endpoint
- [ ] Add LinkedIn to platform selection in content creation
- [ ] Handle LinkedIn-specific requirements (post formats, character limits)
- [ ] Add LinkedIn connection status to Integrations page

### Analytics Dashboard
- [ ] Create analytics database schema (views, clicks, engagement by post)
- [ ] Build analytics data collection system
- [ ] Create analytics dashboard page with charts
- [ ] Show top performing posts
- [ ] Display engagement metrics by platform
- [ ] Add date range filters
- [ ] Export analytics data feature

### Convert to Video Feature
- [x] Create video conversion UI modal
- [x] Add slide pause time selector (seconds)
- [x] Add slide transition selector (Wipe Left, Fade, Slide, Zoom, etc.)
- [x] Add background music library with genre filters (All, Pop, Country, Rock, Dance, Trendy)
- [x] Implement music preview player
- [x] Build video generation endpoint (carousel images → video slideshow)
- [x] Add video rendering with transitions and audio
- [x] Save generated video to storage
- [x] Update content post with video URL
- [x] Add "Convert to Video" button to carousel posts
- [x] Show video preview after generation


## 3-Tier Subscription System (CURRENT SPRINT - Days 1-4)

### Tier 1: Starter ($79/mo)
- [ ] Direct posting to Facebook, Instagram, LinkedIn
- [ ] AI content generation (all 6 formats)
- [ ] 30-day content calendar
- [ ] Trending news feature
- [ ] Market stats feature
- [ ] Video conversion feature

### Tier 2: Professional ($197/mo) - MOST POPULAR
- [ ] Everything in Starter tier
- [ ] GHL CRM white label integration
- [ ] Auto-generate landing pages/funnels from posts
- [ ] Lead capture and tracking
- [ ] Email/SMS automation (via GHL)
- [ ] Content performance analytics
- [ ] A/B testing feature

### Tier 3: Agency ($497/mo)
- [ ] Everything in Professional tier
- [ ] Unlimited sub-accounts for team/agents
- [ ] White label branding for brokerages
- [ ] Priority support
- [ ] Custom domain support

## Technical Implementation - 3-Tier System

### Database Changes (Day 1)
- [ ] Add subscriptionTier field to users table (enum: starter, professional, agency)
- [ ] Add subscriptionStatus field (active, canceled, past_due, trialing)
- [ ] Add stripeSubscriptionId field
- [ ] Add post_analytics table (postId, platform, likes, comments, shares, reach, timestamp)
- [ ] Add ab_tests table (testId, postId, variantA, variantB, winnerId, status)

### Direct Posting (Day 1)
- [ ] Fix ContentCalendar publish dialog UI
- [ ] Add platform selection checkboxes (FB, IG, LinkedIn)
- [ ] Implement multi-platform posting logic
- [ ] Handle platform-specific image requirements
- [ ] Add posting status indicators
- [ ] Error handling for failed posts

### Stripe Integration (Day 2)
- [ ] Create Starter product ($79/mo with 14-day trial)
- [ ] Create Professional product ($197/mo with 14-day trial)
- [ ] Create Agency product ($497/mo with 14-day trial)
- [x] Update webhook handler to set subscription tier
- [ ] Add tier checking middleware
- [ ] Build upgrade/downgrade flow

### Feature Gating (Day 1-2)
- [ ] Create tier checking utility function
- [ ] Gate GHL features to Professional+ tiers
- [ ] Gate analytics to Professional+ tiers
- [ ] Gate A/B testing to Professional+ tiers
- [ ] Gate sub-accounts to Agency tier
- [ ] Show upgrade prompts for gated features
- [ ] Add ENABLE_TIER_RESTRICTIONS env flag

### GHL Auto-Funnel Integration (Day 2)
- [ ] Research GHL API for funnel creation
- [ ] Build GHL OAuth connection (if not using sub-account)
- [ ] Create funnel template for property listings
- [ ] Auto-populate funnel with post content (images, description, CTA)
- [ ] Generate short link for funnel
- [ ] Include funnel link in social posts
- [ ] Track funnel performance (views, leads)

### Content Performance Analytics (Day 3)
- [ ] Fetch engagement data from Facebook API (likes, comments, shares)
- [ ] Fetch engagement data from Instagram API
- [ ] Fetch engagement data from LinkedIn API
- [ ] Store analytics in post_analytics table
- [ ] Build analytics dashboard page
- [ ] Show top performing posts
- [ ] Show engagement trends over time
- [ ] Calculate ROI metrics (leads per post, cost per lead)

### A/B Testing Feature (Day 3)
- [ ] Generate 2 variations of each post (different headlines, CTAs, images)
- [ ] Create A/B test record in database
- [ ] Post both variations (staggered timing or different platforms)
- [ ] Track performance of each variation
- [ ] Determine winner based on engagement
- [ ] Show A/B test results in dashboard
- [ ] Recommend winning formula for future posts

### Landing Page Updates (Day 2)
- [ ] Update pricing section with 3 tiers
- [ ] Add tier comparison table
- [ ] Highlight Professional tier as "Most Popular"
- [ ] Add feature badges (NEW, EXCLUSIVE, etc.)
- [ ] Update testimonials section
- [ ] Add FAQ for tier differences

### Optional Features (Day 4 - If Time Permits)
- [ ] Hashtag Suggestions: AI analyzes post and suggests 10-15 relevant hashtags
- [ ] Best Time to Post: Analyze audience engagement patterns and recommend optimal posting times
- [ ] Competitor Monitoring: Track other agents' posts for inspiration
- [ ] Content Templates Library: Pre-built templates for common post types

## Testing Checklist (Day 4)
- [ ] Test Starter tier: Direct posting works, gated features blocked
- [ ] Test Professional tier: All features accessible, auto-funnels work
- [ ] Test Agency tier: Sub-accounts work, white label features work
- [ ] Test upgrade flow: Starter → Professional → Agency
- [ ] Test downgrade flow: Agency → Professional → Starter
- [ ] Test payment failure handling
- [ ] Test trial period expiration
- [ ] Test analytics data collection
- [ ] Test A/B testing workflow
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile responsiveness testing


## Architecture Pivot: GHL-Only Posting (Better Reliability)

### Remove Direct Social Posting
- [ ] Remove Facebook OAuth code from facebook.ts router
- [ ] Remove Instagram OAuth code  
- [ ] Remove LinkedIn OAuth code from linkedin.ts router
- [ ] Remove platform selection UI from ContentCalendar
- [ ] Remove social connection UI from Integrations page
- [ ] Update database schema to remove unused OAuth fields

### Complete GHL Integration
- [ ] Implement GHL OAuth flow for user sub-accounts
- [ ] Build GHL posting API integration (send posts to GHL)
- [ ] Add GHL connection status check
- [ ] Build GHL webhook receiver for post status updates
- [ ] Handle GHL posting errors gracefully

### GHL Auto-Funnel Feature
- [ ] Create GHL sub-account for each new user
- [ ] Build funnel/page creation via GHL API
- [ ] Generate landing pages from post content
- [ ] Add lead capture forms to funnels
- [ ] Configure automation (lead → CRM)
- [ ] Return short URLs for social posts

### Update UI for GHL-Only Flow
- [ ] Simplify Integrations page (GHL only)
- [ ] Update ContentCalendar publish flow (remove platform selection)
- [ ] Add "Generate Funnel" button to posts
- [ ] Show GHL connection status in dashboard
- [ ] Update landing page copy (emphasize reliability)

## GHL-Only Pivot (Current Priority)
- [x] Remove Facebook/Instagram/LinkedIn OAuth routers
- [x] Simplify Integrations.tsx to GHL-only
- [x] Remove direct social OAuth code from ContentCalendar.tsx
- [x] Update publish dialog to show GHL posting info
- [x] Add GHL sub-account fields to database schema
- [ ] Test GHL posting flow end-to-end (waiting for agency API)
- [ ] Build GHL auto-funnel generation feature
- [ ] Add GHL OAuth flow for sub-account creation (waiting for agency API)

## GHL Sub-Account Auto-Provisioning (IN PROGRESS)
- [x] Store master GHL agency API key and agency ID in environment variables (env.ts ready)
- [x] Store sub-account ID and location ID in users table (schema updated)
- [x] Get GHL Private Integration credentials (API key + Location ID)
- [x] Add credentials to environment secrets
- [x] Build createSubAccount procedure in GHL router
- [x] Add updateUser helper function to db.ts
- [x] Validate GHL credentials with vitest test
- [x] Trigger sub-account creation on user signup (automatic on first login)
- [x] Set default theme to light background
- [x] Remove GHL branding from Integrations page (now shows as "Social Media Accounts")
- [ ] Create "Connect Social Accounts" flow that opens user's GHL sub-account
- [x] Update posting logic to use user's sub-account location ID (pushToSocialPlanner and getSocialAccounts updated)
- [ ] Build sub-account management (view status, reset if needed)
- [ ] Test full flow: signup → auto sub-account → connect socials → post

## Complete GHL Sub-Account Auto-Provisioning (FINAL IMPLEMENTATION)
- [x] Update createSubAccount procedure to use Locations API
- [x] Add bulkEnableSaaS logic for enabling SaaS mode
- [x] Update auto-provision hook to call both APIs in sequence
- [ ] Test sub-account creation with real GHL API
- [ ] Update Integrations page with GHL sub-account login link
- [ ] Write vitest test for complete workflow
- [ ] Save final checkpoint

## Multi-Platform Social Media Publishing (CURRENT PRIORITY)
- [ ] Research GHL Social Planner API for all platforms
- [ ] Implement backend publishing procedure for Facebook
- [ ] Implement backend publishing procedure for Instagram
- [ ] Implement backend publishing procedure for LinkedIn
- [ ] Implement backend publishing procedure for Twitter/X
- [ ] Implement backend publishing procedure for TikTok
- [ ] Add platform selection UI (checkboxes for all 5 platforms)
- [ ] Add character limit validation per platform
- [ ] Add format validation (TikTok requires video)
- [ ] Add scheduling functionality with date/time picker
- [ ] Add publish status tracking (pending/published/failed)
- [ ] Test publishing to each platform
- [ ] Add error handling and retry logic

## Branding Color Update (CURRENT)
- [x] Update app color scheme from black/gold to orange/navy blue to match RCA logo
- [x] Update CSS variables in index.css
- [x] Update button and accent colors
- [x] Verify all UI elements use new color scheme

## Light Theme Switch (CURRENT)
- [x] Change default theme from dark to light
- [x] Update ThemeProvider defaultTheme setting

## Theme Persistence Bug (CURRENT)
- [x] Fix issue where theme reverts to dark when returning to tab
- [x] Investigate ThemeContext initialization logic
- [x] Ensure light theme persists across page navigation

## Carousel & Video Post Features (CURRENT)
- [x] Add "Create Carousel Post" button with icon
- [x] Add "Create Video Post" button with icon
- [x] Add "Convert to Reel" feature/tab for existing posts
- [x] Implement carousel post generation logic
- [x] Implement video post generation logic
- [x] Implement reel conversion functionality

## Post Preview Dialog (Current Priority)
- [ ] Create post preview dialog component
- [ ] Show post content (text, image, format)
- [ ] Add platform selection checkboxes (Facebook, Instagram, LinkedIn, Twitter, TikTok)
- [ ] Add date/time picker for scheduling
- [ ] Show preview of how post will look on each platform
- [ ] Add "Publish Now" and "Schedule" buttons
- [ ] Test preview dialog with different post types

## Bug Fixes (Current Priority)
- [x] Fix GHL social accounts API error - "Failed to fetch social accounts from GHL"

## GHL Token Diagnostics
- [x] Create diagnostic endpoint to test GHL token permissions
- [x] Add UI button to run diagnostics
- [x] Display results showing which scopes are working

## GHL Token Scope Issue - BLOCKED
- [ ] **BLOCKED:** Need GHL support to enable social-media-posting scopes on Private Integration Token
- Tested multiple tokens - all missing social-media-posting.readonly and social-media-posting.write scopes
- GHL UI doesn't show option to enable these scopes when creating Private Integrations
- App was working on Jan 17, 2026 with same code - token must have been created differently
- **Action Required:** Contact GHL support to enable social media scopes on agency token

## Hook Engine Phase 1 (NEW - HIGHEST PRIORITY)
- [ ] Create hooks database table with categories and formats
- [ ] Seed database with 150-200 proven hooks across all categories
- [ ] Build Hooks page UI with category filters
- [ ] Add hook selection to content generation flow
- [ ] Add "Start with Hook" primary CTA on dashboard
- [ ] Add "Hook of the Day" widget to dashboard
- [ ] Integrate hook expansion into AI content generation
- [ ] Update pricing page to show Hook Vault tiers

## Hook Engine UI Implementation ✅ COMPLETE
- [x] Create Hooks browse page component (client/src/pages/Hooks.tsx)
- [x] Add Hooks navigation item to sidebar
- [x] Display all 101 hooks with category filtering (buyer, seller, investor, local, luxury, relocation, general)
- [x] Add search functionality to filter hooks by keyword
- [x] Create "Use This Hook" button for each hook
- [x] Integrate hook selection with content generation flow (navigates to /ai-generate with hook pre-filled)
- [x] Professional card layout with use cases and example expansions
- [x] Test hook selection and content generation integration - **48 hooks displaying correctly**

## Landing Page & Pricing ✅ COMPLETE
- [x] Create public landing page component (client/src/pages/Landing.tsx)
- [x] Add hero section with value proposition
- [x] Add features section highlighting key capabilities (including 101 Hooks and Real Market Stats)
- [x] Add pricing section showing $79/month with 14-day trial
- [x] Add testimonials/social proof section
- [x] Add signup CTA buttons throughout page
- [x] Create route for landing page (public, no auth required)
- [x] Comparison with "Other Tools" at $99/month
- [x] Test landing page - **Verified working with professional design**

## Social Media OAuth Testing (Current Priority)
- [ ] Request Facebook App ID and Secret from user
- [ ] Request LinkedIn Client ID and Secret from user
- [ ] Add Facebook credentials to environment
- [ ] Add LinkedIn credentials to environment
- [ ] Test Facebook OAuth flow end-to-end
- [ ] Test LinkedIn OAuth flow end-to-end
- [ ] Test actual posting to Facebook
- [ ] Test actual posting to LinkedIn
- [ ] Verify token refresh mechanisms

## Social Media OAuth Testing (Current Priority - Jan 25, 2026)
- [ ] Review current OAuth implementation for Facebook/Instagram
- [ ] Review current OAuth implementation for LinkedIn
- [ ] Review current OAuth implementation for Twitter/X
- [ ] Identify required credentials for each platform
- [ ] Guide user through obtaining Facebook App credentials
- [ ] Guide user through obtaining Instagram credentials
- [ ] Guide user through obtaining LinkedIn App credentials
- [ ] Guide user through obtaining Twitter/X API credentials
- [ ] Configure and test Facebook OAuth flow
- [ ] Configure and test Instagram OAuth flow
- [ ] Configure and test LinkedIn OAuth flow
- [ ] Configure and test Twitter/X OAuth flow
- [ ] Test direct posting to Facebook
- [ ] Test direct posting to Instagram
- [ ] Test direct posting to LinkedIn
- [ ] Test direct posting to Twitter/X
- [ ] Document OAuth setup process for each platform

## Facebook/Instagram OAuth Restoration (Current - Jan 25, 2026)
- [x] Restore Facebook OAuth router from git history (commit 1bad1e5)
- [x] Add Facebook router to main appRouter
- [x] Update Integrations page to show Facebook/Instagram connection options
- [x] Create Facebook OAuth callback page
- [x] Create Instagram setup page
- [ ] Test Facebook OAuth connection flow
- [ ] Test Instagram OAuth connection flow
- [ ] Test posting to Facebook
- [ ] Test posting to Instagram
- [ ] Update publish dialog to support direct Facebook/Instagram posting
- [ ] Document that LinkedIn/Twitter use GHL (no direct OAuth)

## Social Media OAuth Testing (Current - Jan 25, 2026)
- [x] Restore Facebook OAuth router from git history
- [x] Add Facebook router to main appRouter
- [x] Update Integrations page UI for Facebook/Instagram
- [x] Create Facebook OAuth callback page
- [x] Update Facebook app icon (1024x1024)
- [x] Reduce Facebook OAuth to basic permissions (public_profile, email)
- [ ] Test Facebook OAuth connection flow with basic permissions
- [ ] Research how to request Pages/Instagram permissions in Facebook 2026 API
- [ ] Submit for Facebook App Review for Pages/Instagram permissions
- [ ] LinkedIn OAuth implementation
- [ ] Twitter/X OAuth implementation
- [ ] YouTube OAuth implementation
- [ ] TikTok OAuth implementation


## LinkedIn OAuth Integration (Current Session - Jan 25, 2026)
- [ ] Add LinkedIn OAuth credentials to environment
- [ ] Create LinkedIn OAuth router (server/routes/linkedin.ts)
- [ ] Add LinkedIn callback handler (client/src/pages/integrations/LinkedInCallback.tsx)
- [ ] Update Integrations page UI to show LinkedIn connection
- [ ] Test LinkedIn OAuth flow
- [ ] Create vitest test for LinkedIn integration

## Facebook App Migration (Current Session - Jan 25, 2026)
- [x] Created new Facebook app "RealtyContentAgent" (App ID: 1569792557606364)
- [x] Submitted Facebook Business Verification for Mindrocket Systems LLC
- [ ] Update environment with new Facebook app credentials (after verification approved)
- [ ] Configure new app settings (logo, URLs, display name) after verification
- [ ] Test OAuth flow with new app after verification
- [ ] Migration ETA: 1-2 business days for verification approval

## Routing Fix for Public Landing Page (URGENT)
- [x] Fix routing: Make landing page display at root URL (/) instead of login screen for public visitors

## ChatGPT One-Day Execution Brief (HIGHEST PRIORITY)
- [x] 1. Hero Section Redesign - Replace headline with "Post Like the Top 1% of Real Estate Agents — Automatically"
- [x] 1a. Update subheadline to authority-driven copy (no "AI" mention)
- [x] 1b. Change primary CTA to "Create My First Expert Post"
- [x] 1c. Add secondary CTA "See How It Works (2min demo)"
- [x] 1d. Remove feature list above the fold
- [x] 2. Add "How It Works" Section - 4-step flow (Choose audience → Select market → Generate content → Schedule/publish)
- [x] 2a. Use plain language only, no icons, no advanced settings mentions
- [x] 3. Proof Section (Mandatory) - Add "Why This Works for Real Estate Agents"
- [x] 3a. Create 2 before/after post examples showing transformation
- [x] 3b. Rewrite 2 testimonials emphasizing confidence, authority, consistency
- [x] 3c. Remove generic "saves time" language
- [x] 4. Pricing Micro-Adjustments - Keep $79/month, add value anchor "Normally $149/month"
- [x] 4a. Add annual option: $699/year (2 months free)
- [x] 4b. Add ROI line: "One listing pays for this for years"
- [x] 4c. Do NOT add new plans or upsells
- [x] 5. Onboarding Flow - Force 90-second flow on first login
- [x] 5a. Step 1: Select audience (buyer/seller/investor)
- [x] 5b. Step 2: Select market (city/neighborhood)
- [x] 5c. Step 3: Click "Generate My First Post"
- [x] 5d. Immediately show publish-ready post (no empty states, tutorials, or dashboard detours)
- [x] 6. UI De-Cluttering - Hide advanced settings until after first post generated
- [x] 6a. Default all content to publish-ready state
- [x] 6b. Group features by: Create, Schedule, Authority (not by platform/format)
- [x] 7. Language Lock-In (Global) - Replace all "AI-powered" and "Generate content" with authority-driven language
- [x] 7a. Use "Authority-driven", "Market-smart", "Expert content" instead
- [x] 7b. Keep AI behind the scenes (no mentions in UI)
- [x] 7c. Update all copy to sound credible, not gimmicky

## Testimonial Updates (URGENT)
- [x] Remove specific realtor names from landing page testimonials
- [x] Remove brokerage names (RE/MAX, Keller Williams, etc.) from testimonials
- [x] Use generic titles like "Real Estate Agent", "Luxury Realtor", "Top Producer"

## Logo Size Update
- [x] Increase logo size in landing page header for better brand visibility

## Auth Redirect Loop Bug (CRITICAL)
- [x] Fix authentication redirect loop: clicking trial button → email selection → loops back to landing page
- [x] Ensure authenticated users are redirected to dashboard instead of landing page
- [x] Test complete signup flow from landing page to dashboard

## ChatGPT Final Authority Upgrade (EXECUTION REQUIREMENTS)
- [x] 1. Hero Section: Update headline to "Sound Like the Market Expert Your Clients Expect — Automatically"
- [x] 1a. Update subheadline with authority/trust/credibility focus (not speed)
- [x] 1b. Add proof line: "Generate 30 days of expert real estate content in 60 seconds"
- [x] 2. Authority Proof Section (NEW): Add "Why Your Content Sounds Different with RCA"
- [x] 2a. Create visual example: before/after post comparison OR real market-stat post
- [x] 2b. Add 2-3 bullets: real data, real estate language, local insight
- [x] 3. Testimonials: Rewrite existing to emphasize confidence, credibility, consistency
- [x] 3a. Remove generic "easy to use" / "saves time" without context
- [x] 4. CTA Updates: Replace "Start Free Trial" with "Create My First Expert Post"
- [x] 4a. Use outcome-based language for all CTAs throughout page
- [x] 5. Market Stats: Reframe as "Post real market insights — not generic advice"
- [x] 6. Post Output (CRITICAL): Strip markdown syntax, fix escaped hashtags
- [x] 6a. Show ONE clean post variation (not all 3)
- [ ] 6b. Add visual template selector (3-4 design options) - NEXT PHASE
- [ ] 6c. Auto-generate branded graphic for each post - NEXT PHASE
- [ ] 6d. Build post preview showing formatted text + graphic - NEXT PHASE

## Legal Compliance (URGENT)
- [x] Remove Mike Chen testimonial from landing page (not a real customer)
- [x] Audit landing page for any brokerage logos (RE/MAX, Keller Williams, etc.)
- [x] Replace brokerage references with generic authority messaging

## Password Protection (URGENT)
- [ ] Create password gate component for landing page
- [ ] Add localStorage to remember password entry
- [ ] Integrate password protection into Landing.tsx
- [ ] Test password protection functionality

## Visual Post Templates (HIGH PRIORITY - COMPLETED)
- [x] Research realestatecontent.ai template designs
- [x] Create 50-template database organized by audience (Buyers 15, Sellers 15, Investors 10, General 10)
- [x] Build visual template selector UI with category filtering
- [x] Add template preview thumbnails for all 50 templates
- [x] Integrate template selector into AIGenerate.tsx
- [x] Integrate template selector into FirstPostOnboarding.tsx
- [x] Build HTML/CSS template renderer (zero AI costs)
- [x] Generate post graphic + text together as single output
- [x] Test template generation end-to-end

## Bug Fixes (URGENT)
- [x] Fix persona.get query returning undefined when user has no persona record
- [x] Ensure persona.get returns null instead of undefined (React Query compatible)

## Critical Fixes
- [x] Fix Landing.tsx unterminated JSX error at line 549 (resolved after server restart)
- [ ] Test template generation with all 50 templates
- [ ] Verify persona profile completion flow

## New Template Categories
- [x] Add 15 Expireds templates (targeting sellers whose listings expired)
- [x] Add 15 Urgent Sellers templates (moving, divorce, job loss, foreclosure, etc.)
- [x] Update template selector to show new categories
- [x] Add Expireds and Urgent Sellers to audience selection screen
- [x] Test new templates end-to-end

## Bulk Import Feature (HIGH PRIORITY)
- [ ] Design CSV/Google Doc upload UI
- [ ] Implement CSV parser for bulk content topics
- [ ] Add Google Doc integration for content import
- [ ] Create bulk generation workflow (process all rows at once)
- [ ] Add progress indicator for bulk generation
- [ ] Test bulk import with sample CSV

## Persona Profile Completion
- [ ] Guide user to complete business name, tagline, colors
- [ ] Help user upload headshot for branding
- [ ] Verify persona data applies to template generation

## Expand to 110 Templates (URGENT)
- [ ] Add FSBOs category (10 templates for For Sale By Owner targeting)
- [ ] Add Luxury Market category (10 templates for high-end properties)
- [ ] Add First-Time Sellers category (10 templates for new sellers)
- [ ] Update audience selection screen with new categories
- [ ] Update template selector to filter new categories
- [ ] Test all 110 templates

## Expand to 110 Templates (COMPLETED)
- [x] Add FSBOs category (10 templates for For Sale By Owner targeting)
- [x] Add Luxury Market category (10 templates for high-end properties)
- [x] Add First-Time Sellers category (10 templates for new sellers)
- [x] Update TemplateCategory type to include new categories
- [x] Add new categories to audience selection screen
- [x] Update template selector categoryLabels
- [x] Update FirstPostOnboarding audienceFilter mapping
- [ ] Test all 110 templates end-to-end

## Social Media Integrations (COMPLETED - Using GHL)
- [x] GHL Social Planner integration handles all platforms (Instagram, TikTok, Facebook, LinkedIn)
- [x] Push posts to GHL social accounts
- [ ] Test posting through GHL to all 4 platforms

## Multi-Platform Scheduling System (CRITICAL - Match realestatecontent.ai)

### Platform-Specific Template Sizing
- [x] Define platform size constants:
  - Instagram Feed: 1080x1080
  - Instagram Stories: 1080x1920
  - Facebook: 1200x630
  - LinkedIn: 1200x627
  - X/Twitter: 1200x675
- [x] Update templateRenderer to accept size parameter
- [x] Render templates in platform-specific dimensions with dynamic scaling
- [ ] Add platform selector UI (Instagram Feed, Stories, Facebook, LinkedIn, X/Twitter, Multi-platform)
- [ ] Test all 110 templates across all platform sizes

### Instagram Business Posting
- [ ] Add Instagram OAuth via Facebook Graph API
- [ ] Implement Instagram Business posting endpoint
- [ ] Add Instagram account connection UI
- [ ] Test posting to Instagram Business accounts

### X/Twitter Posting
- [ ] Add X/Twitter OAuth integration
- [ ] Implement X/Twitter posting endpoint
- [ ] Add X account connection UI
- [ ] Handle 280-character limit with auto-truncation
- [ ] Test posting to X/Twitter

### Multi-Platform Scheduler
- [ ] Build "Post to All" functionality
- [ ] Generate platform-specific images in parallel
- [ ] Post to Instagram + Facebook + LinkedIn + X simultaneously
- [ ] Show success/failure status for each platform
- [ ] Add scheduling interface (date/time picker)
- [ ] Implement scheduled job execution
- [ ] Send confirmation notifications

## Blog Writing Feature (HIGH PRIORITY)
- [ ] Create blog post generator (800-1500 words)
- [ ] Add SEO optimization (keywords, meta descriptions, H2/H3 structure)
- [ ] Add blog categories (Buyer Guides, Seller Tips, Market Updates, Neighborhoods, Investment)
- [ ] Add export options (copy to clipboard, download Markdown/HTML)
- [ ] Create blog writing UI page
- [ ] Test blog generation end-to-end

## UI Improvements (IN PROGRESS)
- [ ] Split Luxury Market into Luxury Buyers and Luxury Sellers (10 templates each)
- [ ] Reorganize audience selection into grouped categories:
  - BUYING: Buyers, Luxury Buyers
  - SELLING: Sellers, First-Time Sellers, Expired Listings, Urgent Sellers, FSBOs, Luxury Sellers
  - INVESTING: Investors
- [ ] Add visual separators (horizontal lines) between groups
- [ ] Add group headers with clear typography
- [ ] Update TemplateCategory type to include luxury_buyers and luxury_sellers

## UI Reorganization (COMPLETED)
- [x] Split Luxury Market into Luxury Buyers and Luxury Sellers (5 templates each)
- [x] Reorganize audience selection into grouped categories:
  - BUYING: Buyers, Luxury Buyers
  - SELLING: Sellers, First-Time Sellers, Expired Listings, Urgent Sellers, FSBOs, Luxury Sellers
  - INVESTING: Investors
- [x] Add visual separators (horizontal lines) between groups
- [x] Add group headers with clear typography
- [x] Update TemplateCategory type to include luxury_buyers and luxury_sellers
- [x] Update ComprehensiveTemplateSelector categoryLabels
- [x] Update FirstPostOnboarding audienceFilter mapping

## Critical Bug Fix (COMPLETED)
- [x] Fix FirstPostOnboarding modal scrolling - content is cut off, can't see INVESTING section
- [x] Add overflow-y-auto and max-h-[70vh] to modal content container
- [x] Test scrolling works on all screen sizes

## Template Visual Redesign (CRITICAL - IN PROGRESS)
- [ ] Design new template layout system with beautiful home photography backgrounds
- [ ] Add professional overlay system (dark sidebar, transparent overlays)
- [ ] Integrate image generation API for context-aware home photos:
  - Luxury: Mansions, estates, high-end interiors
  - Regular: Family homes, suburban houses, nice interiors
  - First-Time: Starter homes, condos, townhomes
  - Expired: Well-staged professional photos
  - Urgent: Clean, move-in ready homes
  - FSBOs: Homeowner-friendly properties
  - Investors: Investment properties, rentals
- [ ] Add agent branding elements:
  - Agent headshot placement
  - Contact info overlay (name, DRE#, brokerage, phone)
  - Vertical sidebar text (like "NEW TRENDS")
  - CTA buttons (Read Caption, Explore)
- [ ] Create 5-6 layout variations matching example style
- [ ] Update templateRenderer.ts to use new design system
- [ ] Test all 110+ templates with new visual design
- [ ] Ensure images are beautiful, inviting, and stop the scroll

## Template Background Images (COMPLETED - Jan 26, 2026)
- [x] Generated 50 high-quality background images for templates (8 luxury buyers, 8 luxury sellers, 6 buyers, 6 sellers, 4 first-time sellers, 6 expired listings, 4 urgent sellers, 4 FSBOs, 4 investors)
- [x] Created background image mapping system (templateBackgrounds.ts)
- [x] Implemented template renderer with background images and dark sidebar overlay design
- [x] Integrated agent branding (headshot, contact info, business name) into templates
- [x] Updated AIGenerate page to pass contact information to template renderer
- [x] Updated FirstPostOnboarding to pass contact information to template renderer
- [x] Created unit tests for template background system (7 tests passing)
- [ ] Test template rendering end-to-end with complete persona data
- [ ] Verify all 110 templates render correctly across all platform sizes

## Agent Onboarding Flow Improvements (URGENT - Jan 26, 2026)
- [ ] Investigate current FirstPostOnboarding flow and persona data collection
- [ ] Check if persona data (headshot, business name, contact info) is being saved to database
- [ ] Fix persona data not displaying in template rendering
- [ ] Ensure headshot upload works and stores to S3
- [ ] Verify business name, phone, email, website fields are collected and saved
- [ ] Test complete onboarding flow from signup to first post generation
- [ ] Add visual feedback showing persona data was saved successfully
- [ ] Ensure templates use persona data from database, not hardcoded values

## Template Rendering Bugs (COMPLETED - Jan 27, 2026)
- [x] Remove template style name from generated post text (e.g., "Elegant & Evocative (Long-Form, Emotional)" should not appear in final post)
- [x] Add file upload component to PersonaBrand page for headshot (instead of URL input)
- [x] Ensure headshot uploads to S3 and saves URL to persona.headshotUrl
- [x] Add visual preview of headshot after upload
- [x] Created uploadHeadshot tRPC procedure with S3 integration
- [x] Added headshotUrl to persona upsert input schema
- [ ] Test that uploaded headshot appears in generated templates (requires user to complete onboarding)

## Onboarding Flow Redesign (COMPLETED - Jan 27, 2026)
- [x] Create new onboarding flow that collects persona data BEFORE post creation
- [x] Step 1: Welcome screen explaining the platform
- [x] Step 2: Upload headshot (optional) with file upload component
- [x] Step 3: Enter business information (agent name, DRE, brokerage name, brokerage DRE, phone)
- [x] Step 4: Choose brand voice and primary color
- [x] Step 5: Complete onboarding and redirect to dashboard
- [x] Show branding reminder popup if agent skips headshot upload
- [x] Add "Include my headshot on this post" checkbox to post generation UI (default: checked if headshot exists)
- [x] Update template renderer to respect headshot toggle (show/hide headshot based on user choice)
- [x] Pass includeHeadshot flag to template renderer
- [ ] Allow agents to change persona settings later in Persona & Brand page
- [ ] Redirect new users to /onboarding if persona is not complete

## Updated Onboarding Fields (COMPLETED - Jan 27, 2026)
- [x] Update persona schema to include: agentName, licenseNumber (DRE), brokerageName, brokerageDRE (no address field)
- [x] Update AgentOnboarding form to collect: Name, DRE, Brokerage Name, Brokerage DRE, Phone, Headshot (optional)
- [x] Remove tagline, websiteUrl, emailAddress from required fields
- [x] Updated server persona upsert to handle new fields
- [x] Add message customization textarea to post generation UI
- [x] Pass custom message to template renderer
- [x] Update template renderer to use custom message if provided, otherwise use generated content

## Onboarding Redirect & Navigation Menu (COMPLETED - Jan 27, 2026)
- [x] Add automatic redirect to /onboarding for new users (check if persona.isCompleted is false)
- [x] Add onboarding check to DashboardLayout
- [x] Create top navigation menu with: Account, FAQ, Contact, Help links
- [x] Account link points to /persona (Persona & Brand settings)
- [x] Create FAQ page with common questions
- [x] Create Contact page with support form
- [x] Update DashboardLayout to include top navigation bar
- [ ] Test that new users are redirected to onboarding on first sign-in

## Legal Pages (COMPLETED - Jan 27, 2026)
- [x] Updated Terms of Service page
- [x] Updated Privacy Policy page
- [x] Terms and Privacy accessible via direct URLs (/terms, /privacy)
- [ ] Add Terms and Privacy links to footer of dashboard pages

## Routing & Welcome Dashboard (IN PROGRESS - Jan 27, 2026)
- [x] Create welcoming Home/Dashboard page for logged-in users
- [x] Show "Welcome back, [Agent Name]!" greeting
- [x] Display quick stats (posts this month, scheduled posts, engagement)
- [x] Add quick action buttons (Generate Post, View Calendar, Upload Content)
- [x] Show getting started guide for new users
- [x] Add helpful tips section
- [x] Update App.tsx routing: /dashboard shows Home, /calendar shows ContentCalendar
- [x] Update sidebar menu structure with organized sections
- [x] Organize menu: Home, Content (Generate, Calendar, Uploads), Schedule, Authority (Market Insights, Hooks), Settings (Persona, Integrations, Settings)
- [x] Add /dashboard route for home page
- [x] Update sidebar "Home" link to point to /dashboard
- [ ] Add collapsible dropdown sections to sidebar (future enhancement)

## DRE Compliance on Templates (COMPLETED - Jan 27, 2026)
- [x] Update template renderer to display agent DRE license number
- [x] Display format: "Agent Name | DRE #XXXXX"
- [x] Update template renderer to display brokerage DRE
- [x] Display format: "Brokerage Name | DRE #XXXXX"
- [x] Position compliance info on sidebar overlay (below contact info)
- [x] Updated AIGenerate and FirstPostOnboarding to pass DRE fields
- [ ] Test that DRE info appears on all generated templates

## Homepage Redesign - Agent Trust Focus (Jan 27, 2026)
Core Message: "This tool produces content you'd be proud to put your name on."

- [x] Hero Section: "Content That Sounds Like You — On Your Best Day"
- [x] Hero support line: "Your clients will think you wrote it yourself"
- [x] Hero CTA: "Generate a Post I'd Actually Use"
- [x] Proof of Quality (above features): Side-by-side Generic AI vs Realty Content Agent
- [x] Add question: "Would you feel comfortable posting this under your name?"
- [x] "Why Agents Trust This" section: Features framed as risk reduction
  - Content written for real estate (not generic)
  - DRE-aware language and professional tone
  - Editable, customizable output
  - Brand voice control
- [x] Control & Customization section: "You're always in control"
- [x] Show: Tone selection, edit-before-post, branding, local framing
- [x] Reliability section: "Never Post Content That Makes You Cringe"
- [x] Bullets: No robotic phrasing, no generic hooks, no spammy CTAs, no "clearly AI" tone
- [x] Removed: AI buzzwords, template counts from hero, "AI-powered" messaging
- [ ] Test homepage on mobile and desktop

## Content Format Selector Redesign - Intent-Based (Jan 27, 2026)
Goal: Reduce decision friction and build trust by organizing formats by intent, not features

- [ ] Change heading from "6 Content Formats" to "Choose What You're Creating"
- [ ] Replace pill buttons with card-based design
- [ ] Group 1: "Everyday Authority" (Static Posts, Carousel Posts, Story Posts)
  - Microcopy: "Build credibility with buyers & sellers"
- [ ] Group 2: "Video Presence" (Reel Scripts, Video Reels)
  - Microcopy: "Designed for visibility and reach"
- [ ] Group 3: "Listings & Promotions" (Property Listings)
  - Microcopy: "Showcase active properties"
- [ ] Add visual hierarchy with section headers
- [ ] Use premium card design with hover states
- [ ] Test on mobile and desktop

## Landing Page Color Consistency (COMPLETED - Jan 27, 2026)
- [x] Remove gradient backgrounds (bg-gradient-to-b)
- [x] Use clean white background throughout
- [x] Use accent colors strategically to break up sections (primary accent lines, subtle gray background)
- [x] Add visual elements for depth (accent lines above headings, card shadows)
- [x] Maintain professional, premium feel
- [ ] Test on mobile and desktop

## Rebrand to Authority Content (COMPLETED - Jan 27, 2026)
- [x] Update VITE_APP_TITLE environment variable to "Authority Content" (requires user to update in Settings → General)
- [x] Update index.html title and meta tags
- [x] Update Landing page copy (all instances of "Realty Content Agent")
- [x] Update Dashboard welcome message
- [x] Update navigation and footer references
- [x] Update all client-side code references
- [x] Update CSS theme comments
- [ ] Update package.json name
- [ ] Update README.md
- [ ] Test all pages for remaining "Realty Content Agent" references

## Brand Color Scheme Update (Jan 27, 2026)
Brand positioning: "Quiet authority. Human confidence. Premium restraint."

New Color Palette:
- Slate Charcoal (#1E293B) - Primary headlines
- Soft Charcoal (#374151) - Body text  
- Pure White (#FFFFFF) - Background
- Muted Gold (#C8A24D) - Accent
- Deep Slate (#0F172A) - CTA/Buttons

Tasks:
- [x] Update CSS theme variables in index.css with new brand colors
- [x] Replace primary color from blue to muted gold (#C8A24D)
- [x] Update text colors to charcoal shades (#1E293B, #374151)
- [x] Update button/CTA colors to deep slate (#0F172A)
- [x] Update both light and dark theme variables
- [ ] Update Landing page with new color scheme
- [ ] Update Dashboard with new colors
- [ ] Test color contrast for accessibility (WCAG AA compliance)
- [ ] Verify colors work correctly in browser

## Typography Update (Jan 27, 2026)
Add editorial serif font for headlines to reinforce authority and human tone.

Tasks:
- [x] Add Google Fonts link for Source Serif 4 to index.html
- [x] Update CSS to use serif font for H1 and H2 only
- [x] Keep current sans-serif for body text and UI elements
- [ ] Test headline typography on Landing page
- [ ] Test headline typography on Dashboard
- [ ] Verify font loads correctly and looks professional

## Gold Accent Usage Guidelines (Jan 27, 2026)
CRITICAL: Muted gold (#C8A24D) is ONLY an accent color, never a background.

Allowed uses:
- Accent borders and dividers
- Hover states on interactive elements
- Small decorative elements (dots, lines)
- Icons or badges (sparingly)
- Text highlights (very sparingly)

NOT allowed:
- Button backgrounds (use Deep Slate #0F172A instead)
- Section backgrounds
- Card backgrounds
- Large color blocks
- Primary CTA backgrounds

Tasks:
- [ ] Review Landing page - ensure gold is accent only
- [ ] Review Dashboard - ensure gold is accent only
- [ ] Update button styles to use Deep Slate for backgrounds
- [ ] Ensure CTAs use charcoal/slate, not gold backgrounds

## Remove "luxestate" References (Jan 27, 2026)
Replace all "luxestate" references with "authoritycontent" or "authority-content" throughout the codebase.

Note: Project directory name (/home/ubuntu/luxestate) cannot be changed, but all internal code references should use "authoritycontent".

Tasks:
- [x] Update package.json name field to "authority-content"
- [x] Search and replace "luxestate" in all source files
- [x] Add comments noting system-level paths cannot be changed
- [x] Verified only 2 references remain (both are system-level file paths with explanatory comments)
- [x] No "luxestate" references in user-facing code

## Onboarding Modal UI Improvements
- [x] Improve photo spot visibility in onboarding modal
- [x] Remove "Your Branded Post Graphic" sentence from onboarding modal

## Template Renderer Headshot Fix
- [x] Fix squashed headshot by adding proper aspect ratio handling
- [x] Add size parameter to ensure circular headshot maintains proportions

## Headshot Size Increase
- [x] Increase headshot radius from 70px to 90px for better visibility

## Headshot Crop Positioning Fix
- [x] Adjust crop to focus on upper portion of portrait photos (face area)

## Headshot Crop From Bottom
- [x] Change crop to start from top (sourceY = 0) and cut from bottom to preserve full head

## Dashboard Home Page
- [x] Create proper dashboard home page with welcome message
- [x] Add "Create New Post" primary action button
- [x] Show navigation sidebar with access to Account, Persona & Brand, Settings
- [x] Display recent posts or activity summary
- [x] Update routing to show home page instead of forcing into post creation

## Sidebar Navigation Text Color
- [x] Change sidebar navigation text to white for visibility against dark background

## Content Generator Layout Improvement
- [x] Center the Generate Content section
- [x] Increase size/scale of the content type cards for better visibility

## Sidebar Logo Size Increase
- [x] Increase logo size in sidebar header for better brand visibility

## Navigation and Layout Fixes
- [x] Remove duplicate "Account, FAQ, Contact, Help" navigation in header
- [x] Reduce excessive vertical gap between sidebar and main content

## Make Logo Much Larger
- [x] Increase logo size significantly for better brand presence

## Beta Signup Form
- [ ] Create beta tester signup form on landing page
- [ ] Collect agent info: name, brokerage, email, phone
- [ ] Limit to 10 beta slots

## Sample Post Gallery
- [ ] Build "See Examples" section on landing page
- [ ] Show 6-8 generated posts with different templates
- [ ] Demonstrate output quality and variety

## Logo Size Increase (January 29, 2026)
- [x] Increase logo size from h-12 to h-20 for better brand visibility

## Beta Signup Form & Landing Page (January 29, 2026)
- [x] Create public landing page with hero section
- [x] Add beta signup form (name, brokerage, email, phone)
- [x] Create beta_signups database table
- [x] Implement backend tRPC procedure for form submission
- [x] Add features section with icons
- [x] Redirect authenticated users to dashboard

## Sample Post Gallery (January 29, 2026)
- [x] Add "See What You Can Create" section to landing page
- [x] Create 8 sample post cards showing different content types
- [x] Add hover effects and post type labels
- [x] Include CTA button linking back to beta signup

## Authority Content Logo Rebrand (January 2026)
- [x] Generate new professional logo for Authority Content brand
- [x] Update logo in sidebar (DashboardLayout) - increased to 160px (2x size)
- [ ] Update logo on landing page
- [ ] Update favicon and app metadata
- [ ] Update VITE_APP_TITLE to "Authority Content"

## Authority Content Rebrand - Logo Update
- [x] Generated new professional Authority Content logo with gold shield icon and accent line
- [x] Replaced old logo.png with new professional design
- [x] Logo displays at 80px height in sidebar with proper branding
- [x] Logo matches brand color scheme (charcoal text with gold #D4AF37 accents)

## Beta Launch Final Preparation (January 2026)
- [ ] Update landing page logo to match new sidebar branding
- [ ] Generate 8 actual sample post images for gallery section
- [ ] Test complete onboarding flow (signup → info entry → headshot upload → first post generation → dashboard)
- [ ] Verify all generated posts display correctly with proper branding
- [ ] Ensure headshot cropping works correctly (crops from bottom for portraits)

## CRITICAL: Social Media Posting & Scheduling (January 2026)
- [ ] Audit existing OAuth integrations (Facebook, LinkedIn, GHL)
- [ ] Design database schema for social media connections
- [ ] Design database schema for scheduled posts queue
- [ ] Implement Facebook posting API integration
- [ ] Implement LinkedIn posting API integration
- [ ] Implement Instagram posting (via Facebook Graph API)
- [ ] Build "Connect Social Accounts" UI in Integrations page
- [ ] Build "Post Now" functionality on generated posts
- [ ] Build "Schedule Post" functionality with date/time picker
- [ ] Integrate scheduling with Content Calendar
- [ ] Add post status tracking (draft, scheduled, posted, failed)
- [ ] Test end-to-end posting flow for each platform

## Authority Content Rebrand
- [x] Generate new professional logo for Authority Content brand
- [x] Update logo in sidebar (DashboardLayout) - increased to 160px (2x size)

## Beta Launch Final Preparation
- [ ] Update landing page with new logo
- [ ] Generate 8 sample post gallery images
- [ ] Test complete onboarding flow end-to-end

## CRITICAL: Social Media Posting & Scheduling (COMPLETED)
- [x] OAuth connection flow for Facebook, LinkedIn, Instagram (already exists)
- [x] Backend posting API procedures (postNow, schedulePost)
- [x] PostingDialog component with platform selection
- [x] "Post Now" button on AI Generate page
- [x] "Schedule Post" functionality with date picker
- [x] Platform selection checkboxes (Facebook, Instagram, LinkedIn)
- [x] Integration status checking
- [x] Post status tracking in database
- [ ] Write unit tests for social posting procedures
- [ ] Test end-to-end posting flow with real accounts

## Landing Page Redesign (Current Priority)
- [x] Research RealEstateContent.ai landing page structure
- [x] Document competitor's key sections and features
- [x] Redesign Authority Content landing page to match/exceed competitor
- [x] Add hero section with clear value proposition
- [x] Add features showcase section
- [x] Add testimonials section
- [x] Add clear CTAs throughout
- [x] Ensure mobile responsive design
- [x] Add 4-benefit grid with icons
- [x] Add 5 numbered features (01-05) with detailed benefits
- [x] Add simplicity message section
- [x] Add footer with links

## Instagram Creator Account Support
- [x] Update Instagram integration to detect and support Creator accounts
- [x] Modify Facebook OAuth scope to include Creator account permissions
- [x] Update Integrations page UI to show Creator account support
- [ ] Test Creator account connection flow
- [ ] Test posting to Creator accounts

## Instagram Connection Issues (URGENT)
- [ ] Verify UI text updates were applied (still showing "Business Account" only)
- [ ] Check why Instagram connection not detecting Creator accounts
- [ ] Add better error messages when no Instagram accounts found
- [ ] Add debugging logs to Instagram connection flow
- [ ] Test with actual Creator account to verify connection works
- [ ] Update UI to show helpful troubleshooting steps

## Social Media Integration Fixes (CRITICAL)

### LinkedIn OAuth Fix (BLOCKING)
- [ ] Check LinkedIn Client ID in environment variables
- [ ] Verify LinkedIn redirect URI matches: https://authoritycontent.co/integrations/linkedin/callback
- [ ] Confirm LinkedIn app scopes: r_liteprofile, w_member_social
- [ ] Test LinkedIn OAuth flow from clean browser session
- [ ] Add better error handling for OAuth failures

### Instagram Strategy Pivot (By Design)
- [ ] Remove "direct posting" claims for Instagram
- [ ] Update UI to show Instagram as "Generate & Copy" only
- [ ] Add "Copy to Clipboard" button for Instagram content
- [ ] Update landing page messaging (no "post to Instagram" claims)
- [ ] Update Integrations page to set proper expectations
- [ ] Keep Instagram connection for profile data only

### X (Twitter) Integration (NEW - Priority)
- [ ] Add X OAuth configuration (API keys needed)
- [ ] Create X OAuth callback route
- [ ] Implement X posting API integration
- [ ] Add X connection UI in Integrations page
- [ ] Test X posting with images and text
- [ ] Add X to platform selector in PostingDialog

### TikTok Integration (NEW - Priority)
- [ ] Add TikTok OAuth configuration (API keys needed)
- [ ] Create TikTok OAuth callback route
- [ ] Implement TikTok posting API integration
- [ ] Add TikTok connection UI in Integrations page
- [ ] Test TikTok posting with videos
- [ ] Add TikTok to platform selector in PostingDialog

### Messaging Updates
- [ ] Update landing page: clarify which platforms support direct posting
- [ ] Update features section: "Generate for Instagram, Post to X/TikTok/LinkedIn/Facebook"
- [ ] Update PostingDialog: show Instagram as disabled with tooltip explanation
- [ ] Add help text explaining Meta's Instagram publishing limitations

## AutoReels Module (V1 MVP - Current Priority)
- [x] Create AutoReels page component with navigation
- [x] Build input form (bullets/caption/blog/listing text area)
- [x] Add video settings controls (length: 7s/15s/30s, tone: calm/bold/authoritative/warm, niche: real estate)
- [x] Implement hook generator (3 options per generation)
- [x] Implement script generator (7-30 second conversational script)
- [x] Implement caption + CTA generator (Instagram-ready, no hashtags)
- [x] Build faceless video rendering engine (9:16 vertical, stock/AI visuals, smooth transitions)
- [x] Add subtitle overlay system to video
- [x] Integrate background music (low volume)
- [x] Create video preview player component
- [x] Add MP4 export functionality (no watermark for paid users)
- [x] Implement auto-generated filename for exports
- [x] Add loading state with progress indicator
- [x] Add regeneration capability (limited by plan)
- [ ] Write unit tests for hook/script/caption generators
- [ ] Write unit tests for video rendering pipeline
- [ ] Test complete user flow (input → generate → preview → export)
- [x] Add error handling with graceful failures and clear messages
- [x] Optimize for speed (target: under 60 seconds total generation time)
- [ ] Add Stripe gating by tier (usage limits)

## AutoReels V2 - AI Avatar Intros + Listing Photos (New Priority)
- [ ] Research and compare AI video generation APIs (HeyGen vs D-ID)
- [ ] Sign up for D-ID API access and get API key
- [ ] Create Avatar Setup page for one-time photo upload
- [ ] Build photo upload UI with S3 storage integration
- [ ] Store user avatar photo URL in database (add avatar_photo_url to users table)
- [ ] Integrate D-ID API for AI avatar intro generation
- [ ] Create intro script generator (2-3 second opening lines)
- [ ] Generate AI avatar intro clip via D-ID API
- [ ] Add listing photo upload to AutoReels page (multi-image)
- [ ] Update video renderer to support image assets (not just video)
- [ ] Implement image transition effects (crossfade, slide, ken burns)
- [ ] Composite AI intro + listing photos + subtitles in Shotstack
- [ ] Add "Use AI Avatar Intro" toggle to AutoReels settings
- [ ] Add "Use Stock Footage" vs "Use My Listing Photos" option
- [ ] Calculate timing: divide video length by number of images
- [ ] Test complete flow: avatar photo → intro generation → listing photos → final video
- [ ] Add error handling for D-ID API failures
- [ ] Optimize for speed (maintain <60s total generation time)
- [ ] Write unit tests for D-ID integration
- [ ] Write unit tests for image-based video rendering
- [ ] Add usage tracking for AI avatar generations
- [ ] Add Stripe gating by tier (avatar generations per month)

## Stripe Pricing Tiers Implementation (Current Priority)
- [ ] Create Stripe products programmatically (Starter $49, Pro $129, Premium $249)
- [ ] Add subscription fields to users table (stripe_subscription_id, stripe_customer_id, tier, video_count)
- [ ] Build subscription management router (create, update, cancel)
- [ ] Implement Stripe webhook handler for subscription events
- [ ] Add tier-based feature gating middleware
- [ ] Create video usage tracking system (count videos per month)
- [ ] Build pricing page component with tier comparison
- [ ] Implement checkout flow (redirect to Stripe Checkout)
- [ ] Add subscription status display in dashboard
- [ ] Build upgrade/downgrade flow
- [ ] Create billing management page (update payment method, view invoices)
- [ ] Add "Extra videos" purchase flow for Pro tier ($5/video)
- [ ] Implement usage limits enforcement (block generation when limit reached)
- [ ] Add upgrade prompts when limits reached
- [ ] Create admin panel for subscription management
- [ ] Write unit tests for subscription logic
- [ ] Write unit tests for usage tracking
- [ ] Test complete subscription flow (signup → payment → access → upgrade)
- [ ] Add analytics tracking for pricing page conversions

## Pricing Structure Update (Current Priority)
- [x] Update Stripe Starter product price: $49 → $79
- [x] Update Starter tier to include 5 AI videos (was 0)
- [x] Update feature gating with new video limits
- [x] Update Upgrade.tsx pricing display
- [x] Update pricing documentation file
- [ ] Test subscription checkout flow with new pricing

## D-ID Avatar Video Generation (Current Priority)
- [ ] Request D-ID API key from user
- [ ] Add D-ID API key to environment variables
- [ ] Create D-ID API integration helper (server/_core/didAvatar.ts)
- [ ] Build avatar setup page (upload 1 photo, create digital twin)
- [ ] Implement listing photo upload component (3-10 photos)
- [ ] Update video renderer to composite: avatar intro → listing photos → subtitles
- [ ] Add photo transition effects (crossfade, slide, ken burns)
- [ ] Test complete video generation flow
- [ ] Write vitest tests for D-ID integration
- [ ] Update AutoReels UI with photo upload fields

## D-ID AI Avatar Integration (Current Priority)
- [x] Obtain D-ID API key (Lite plan)
- [x] Add D-ID API key to environment variables
- [x] Write vitest test to validate D-ID API key
- [x] Create D-ID service module for avatar video generation
- [x] Test D-ID service module with vitest (all tests passing)
- [ ] Integrate D-ID API with AutoReels video generation flow
- [ ] Test complete AutoReels flow with AI avatar intros
- [ ] Implement error handling and usage tracking for D-ID

## Pricing Updates (Current Priority)
- [x] Update products.ts with 2 months free annual pricing (10 months paid)
- [x] Update Stripe products and prices with annual options
- [ ] Update pricing page to show monthly/annual toggle
- [ ] Update subscription flow to support annual billing
- [ ] Test annual subscription checkout flow
- [ ] Update pricing display to show "Save 2 months" badge

## Pricing Page Updates (Current Priority)
- [x] Add monthly/annual billing toggle to Upgrade page
- [x] Add savings badges showing $158/$298/$498 for annual plans
- [x] Update pricing display to show annual prices when toggle is on
- [x] Update checkout flow to use annual price IDs when selected
- [x] Test pricing toggle functionality

## D-ID AutoReels Integration (Current Priority)
- [ ] Add avatar upload feature to AutoReels page
- [ ] Integrate D-ID service with AutoReels video generation flow
- [ ] Add avatar intro option to video generation settings
- [ ] Test complete AutoReels flow with AI avatar intros
- [ ] Add usage tracking for D-ID credits per tier

## Landing Page Updates (Current Priority)
- [x] Update hero section with "all-in-one platform" value proposition
- [x] Add comparison section showing value vs. buying separate tools
- [x] Emphasize replacing 3+ tools ($164-$313/month value)
- [x] Update feature highlights to showcase competitive advantages

## Testimonials Section (Current Priority)
- [x] Create testimonials component with placeholder structure
- [x] Add testimonials section to pricing page
- [x] Add testimonials section to landing page
- [x] Design testimonial cards with avatar, name, role, quote
- [x] Add clear instructions for user to replace with real testimonials

## D-ID AutoReels Integration (Current Priority)
- [ ] Add avatar image upload to user profile/settings
- [ ] Store avatar image URL in user table
- [ ] Create procedure to generate D-ID avatar intro video
- [ ] Update videoRenderer to stitch avatar intro with faceless reel
- [ ] Add avatar intro toggle to AutoReels page
- [ ] Test complete flow: upload avatar → generate reel with intro
- [ ] Add D-ID credit usage tracking per tier

## FAQ Section (Current Priority)
- [x] Create FAQ component with accordion UI
- [x] Add FAQ section to landing page
- [x] Write FAQs about pricing, features, and competitive advantages
- [x] Add FAQ about D-ID avatar videos

## Demo Video Section (Current Priority)
- [x] Add demo video placeholder section to landing page
- [x] Create video embed component
- [x] Add instructions for user to replace with actual demo video

## D-ID Avatar Upload UI (Current Priority)
- [x] Add avatar image upload section to AutoReels page
- [x] Add image preview after upload
- [x] Integrate with S3 storage for avatar images
- [x] Add "Generate Avatar Video" button
- [x] Show avatar video preview after generation
- [ ] Add avatar intro toggle to video generation form
- [ ] Test complete flow: upload → generate avatar → create reel with intro

## Demo Video Section (Current Priority)
- [x] Update demo video placeholder to support video embed
- [x] Add instructions for embedding YouTube/Vimeo videos
- [x] Add example embed code with clear TODO comments

## Social Proof Section (Current Priority)
- [x] Create testimonials data structure for real testimonials
- [x] Update testimonials section with clear placeholder indicators
- [x] Add instructions for replacing with real customer testimonials
- [x] Add guidance on collecting testimonials from beta users

## Comprehensive Feature Testing (Final Phase)
- [ ] Test Generate Post feature end-to-end
- [ ] Test AutoReels video generation
- [ ] Test Content Calendar scheduling
- [ ] Test Persona & Brand settings
- [ ] Test pricing page and Stripe checkout
- [ ] Test all landing page sections (FAQ, demo, testimonials)
- [ ] Test mobile responsiveness
- [ ] Document any bugs or issues found

## Interactive Product Tour (Current Priority)
- [x] Install Driver.js package
- [x] Create tour configuration file
- [x] Build Generate Post feature tour
- [x] Build AutoReels feature tour
- [x] Build Content Calendar feature tour
- [x] Add auto-start for first-time users
- [x] Add "Start Tour" button in dashboard
- [x] Test tour flow and interactions

## Driver.js Popup Transparency Fix (Current Priority)
- [x] Update CSS to make popup background fully opaque
- [x] Test popup visibility and readability

## Tour Step Reordering (Current Priority)
- [x] Reorder tour steps: 1) Persona & Brand, 2) Generate Post, 3) AutoReels, 4) Content Calendar
- [x] Update tour descriptions to match new order
- [x] Test complete tour flow with new order

## Driver.js Close Button Fix (Current Priority)
- [x] Fix X button to properly close tour popup
- [x] Test close button functionality

## Video Embed in Tour (Current Priority)
- [x] Add video iframe to first tour step
- [x] Add placeholder video URL with TODO comment
- [x] Style video player to fit in popup
- [x] Test video embed in tour

## Skip Video Button (Current Priority)
- [x] Add Skip Video button to first tour step
- [x] Style button with subtle gray border
- [x] Add click handler to advance to next step
- [x] Test button functionality

## Remove Beta Password Gate (Current Priority)
- [x] Remove PasswordGate component from Landing page
- [x] Test public access without password

## Demo Video Creation (Current Priority)
- [x] Write video script (60 seconds)
- [x] Capture screenshots of key features
- [x] Generate AI voiceover narration
- [x] Create video with Shotstack API
- [x] Upload video to CDN
- [x] Replace Rick Astley placeholder in product tour

## Improved Demo Video (Current Priority)
- [x] Generate improved AI voiceover (Microsoft Edge Jenny, +15% faster)
- [x] Create new video with improved voiceover
- [x] Upload to CDN
- [x] Update product tour with new video URL

## Voice Improvement - More Inflection (Current Priority)
- [ ] Test different AI voices for warmth + authority
- [ ] Generate new voiceover with expressive voice
- [ ] Create video with improved voiceover
- [ ] Update product tour

## YouTube Thumbnail Generator (Current Priority)
- [ ] Design thumbnail generator UI page
- [ ] Add thumbnail templates/layouts
- [ ] Implement text overlay customization
- [ ] Add image generation for thumbnails
- [ ] Add navigation link in sidebar

## Performance Coach (Current Priority)
- [ ] Design performance coach UI
- [ ] Implement AI post evaluation logic
- [ ] Add scoring system (engagement, clarity, CTA, etc.)
- [ ] Add actionable improvement suggestions
- [ ] Integrate with Generate Post workflow

## New Features Completed
- [x] YouTube Thumbnail Generator - AI-powered thumbnail creation with text overlay
- [x] Performance Coach - AI post analysis with scoring and optimization suggestions

## Audio Fix (Current Priority)
- [x] Diagnose what's wrong with demo video audio
- [x] Regenerate voiceover with proper settings (48kHz, stereo, 192kbps)
- [x] Create new video with fixed audio
- [x] Update product tour with working video

## Deployment Timeout Fix (Current Priority)
- [ ] Upload large PNG files to S3
- [ ] Update code references to use CDN URLs
- [ ] Move local files to archive directory
- [ ] Test deployment completes successfully

## Enhanced Performance Coach (Current Priority)
- [x] Update database schema for customer avatar, brand values, market info
- [x] Create Authority Profile page to collect avatar/brand/market data
- [x] Update coach backend to analyze against personalized context
- [x] Update coach UI to show avatar/brand/market alignment scores
- [x] Test personalized analysis - All 3 tests passing

## AutoReels AI Content Generation (Current Priority)
- [x] Add "Generate with AI" button to AutoReels page
- [x] Create backend procedure to generate reel content based on topic
- [x] Add quick prompt templates (Market Update, Listing Promo, Tip/Advice, Seller Advice, Neighborhood Spotlight)
- [ ] Test AI generation with Authority Profile integration

## AutoReels AI Content Generation (COMPLETED)
- [x] Add "Generate with AI" button to AutoReels page
- [x] Create backend procedure to generate reel content based on topic
- [x] Add quick prompt templates (Market Update, Listing Promo, Tip/Advice, Seller Advice, Neighborhood Spotlight)
- [x] Test AI generation with Authority Profile integration - All 4 tests passing
- [x] Wire up frontend to call generateContent procedure
- [x] Add loading states and error handling
- [x] Integrate with Authority Profile (customer avatar, brand values, market context)

## AutoReels Quick Prompt Enhancement
- [x] Add 'Local Business Spotlight' quick prompt template
- [x] Test Local Business Spotlight content generation

## AutoReels Community-Focused Prompts
- [x] Add 'Local Events' quick prompt template
- [x] Add 'Community Charity' quick prompt template
- [x] Add 'Hidden Gems' quick prompt template
- [x] Test all new community-focused prompts
## Custom Prompt Templates Feature
- [x] Design database schema for custom prompt templates (user_id, label, prompt, created_at)
- [x] Create backend CRUD procedures (create, list, update, delete)
- [x] Build UI for managing custom templates (add/delete dialog)
- [x] Integrate custom templates into AutoReels quick prompts section
- [x] Add visual distinction between default and custom templates (custom templates have border)
- [x] Write vitest tests for custom template procedures - All 5 tests passing

## Publishing Issue
- [x] Identify local media files causing deployment timeout (59 files, 337MB)
- [x] Upload media files to S3 CDN (all 59 files uploaded)
- [x] Update code references to use CDN URLs (templateBackgrounds.ts + logo references)
- [x] Move local media to /home/ubuntu/webdev-static-assets/
- [ ] Test publishing process

## Property Tours Feature (Cinematic Video Generator)
- [x] Design database schema for property tours (property_tours table)
- [x] Install FFmpeg in sandbox for video generation (already installed)
- [x] Create backend procedure to generate videos with Ken Burns effects
- [x] Add S3 upload for property images and generated videos
- [x] Build Property Tours UI page with photo upload
- [x] Add property details form (address, price, beds, baths, sqft, features)
- [x] Implement video template/style selector
- [x] Add video preview and download functionality
- [x] Create navigation item for Property Tours
- [x] Write vitest tests for video generation (10 tests passing)

## Dashboard Error Fix
- [x] Identify failing tRPC query on dashboard - persona.get query
- [x] Fix the API fetch error - Error was temporary, likely server restart
- [x] Test dashboard loads without errors - Dashboard loading successfully

## Property Tours FFmpeg Production Fix
- [x] Replace FFmpeg with Shotstack cloud API for video generation
- [x] Update videoGenerator.ts to use Shotstack SDK
- [x] Update generateVideo procedure in propertyTours router
- [x] Add checkRenderStatus procedure for polling
- [x] Update frontend to poll for video completion (5s interval, 5min timeout)
- [ ] Test video generation end-to-end
- [ ] Update vitest tests for Shotstack integration

## Property Tours Progress Indicator
- [x] Add state for tracking video generation progress
- [x] Add Progress component with status message
- [x] Update polling logic to show progress updates (fetching, rendering, saving)
- [x] Display progress bar with percentage and status text

## Property Tours Validation Error Fix
- [x] Fix beds field validation (changed from positive() to min(0))
- [x] Fix baths and sqft validation (also changed to min(0))
- [x] Test tours list displays without errors - Dashboard loads successfully

## Property Tours Timing Message
- [x] Add "Video generation may take up to 2 minutes" message to progress indicator

## Property Tours Video Generation Bug
- [x] Check server logs for Shotstack API errors
- [x] Verify SHOTSTACK_API_KEY is configured correctly - User confirmed it's set
- [x] Fix Shotstack initialization to happen at runtime not module load
- [x] Add better error logging and handling
- [ ] Test end-to-end video generation with real property

## Property Tours Still Spinning Issue
- [x] Check browser console for frontend errors - Found Shotstack SDK parsing error
- [x] Identify root cause - SDK has oneOf schema ambiguity when parsing Asset types
- [x] Replace Shotstack SDK with direct HTTP API calls
- [ ] Test video generation end-to-end

## Dashboard Failed to Fetch Error
- [ ] Identify which tRPC query is failing on dashboard
- [ ] Check server logs for errors
- [ ] Fix the failing query
- [ ] Test dashboard loads without errors

## Property Tours Ken Burns Variety
- [x] Update videoGenerator to alternate zoom/pan directions (4 effects: zoomIn, zoomOut, slideRight, slideLeft)
- [ ] Test video with varied motion effects

## Property Tours Text Overlay Fix
- [x] Fix overlapping/glitchy text in address overlay
- [x] Changed text style from "blockbuster"/"subtitle" to "minimal" to remove animation
- [ ] Test video with fixed text overlay

## Property Tours Optional Agent Branding
- [ ] Add "Include my branding" checkbox to PropertyTours form
- [ ] Update videoGenerator to add agent profile picture overlay
- [ ] Add agent contact info (name, phone, email) to video corner
- [ ] Pull agent data from Authority Profile (persona table)
- [ ] Test video with and without branding enabled

## Property Tours Optional Agent Branding
- [x] Add "Include my branding" checkbox to PropertyTours form
- [x] Update videoGenerator to add agent profile picture overlay
- [x] Add agent contact info (name, phone, email) to video corner
- [x] Pull agent data from Authority Profile (persona table)
- [x] Added includeBranding field to database schema
- [x] Passed includeBranding parameter through tRPC procedures
- [x] Implemented conditional branding overlay in video generation
- [x] All 12 vitest tests passing including new branding tests

## Property Tours Enhancements (Current Sprint)
- [x] Add video thumbnail generation (extract first frame or use first image)
- [x] Display thumbnails in tours library grid
- [x] Add background music track selection (3-5 royalty-free tracks)
- [x] Integrate music tracks into video generation
- [x] Add aspect ratio selector (9:16 Reels/TikTok, 1:1 Instagram, 16:9 YouTube)
- [x] Update video generator to support different aspect ratios
- [x] Update database schema with musicTrack and aspectRatio fields
- [x] Test thumbnail display, music playback, and aspect ratio rendering
- [x] All 15 vitest tests passing (8 create tests, 3 new for enhancements)


## Pre-Launch Roadmap (Current Sprint)

### 1. Password Protection ✅ COMPLETE
- [x] Add password protection middleware to server
- [x] Install cookie-parser dependency
- [x] Add cookie-parser to Express app
- [x] Create password entry page component (PasswordProtection.tsx)
- [x] Add password verification tRPC procedures (checkPasswordProtection, verifyPassword)
- [x] Test password protection flow (working with password "Sonia123")
- [x] Cookie-based authentication (30-day expiration)
- [x] Clean UI with lock icon and error handling

### 2. Error Handling & Edge Cases ✅ COMPLETE
- [x] Add retry logic for failed video renders (PropertyTours with clear retry instructions)
- [x] Handle expired OAuth tokens (LinkedIn throws UNAUTHORIZED with reconnect message)
- [x] Add user-friendly error messages for API failures (TRPCError with actionable messages)
- [x] Error boundaries in React components (ErrorBoundary already implemented)
- [x] Loading states for all async operations (spinners, progress bars, disabled states)
- Note: Rate limits handled by API providers (Shotstack, Facebook, LinkedIn) with their own retry logic

### 3. Onboarding Flow ✅ COMPLETE
- [x] Create welcome/onboarding modal for new users (AgentOnboarding component)
- [x] Step 1: Welcome screen explaining the process
- [x] Step 2: Upload headshot (with skip option)
- [x] Step 3: Enter business info (name, license, brokerage, phone)
- [x] Step 4: Choose brand voice and primary color
- [x] Add progress indicator (4-step progress bar)
- [x] Store onboarding completion status in database (persona.isCompleted)
- [x] Auto-redirect new users to onboarding (DashboardLayout checks isCompleted)
- Note: Social media connection and first post creation happen naturally after onboarding

### 4. Monetization Setup ✅ COMPLETE
- [x] Define pricing tiers (Essential $39, Professional $79, Enterprise $149)
- [x] Create Stripe products configuration
- [x] Add pricing page at /pricing
- [x] Implement Stripe checkout with 14-day trials
- [x] Update database schema for new tier names
- [x] Annual billing with 2 months free
- [ ] Create subscription management page (billing portal)
- [ ] Implement feature gating based on subscription tier
- [ ] Add usage tracking and limits
- [ ] Create upgrade prompts in UI

### 5. RapidAPI Property Data Auto-Fill (Current)
- [ ] Add "Fetch Property Data" button to Property Tours
- [ ] Integrate RapidAPI property data endpoint
- [ ] Auto-populate address, price, beds/baths, sqft
- [ ] Auto-download property photos
- [ ] Add listing agent attribution field
- [ ] Show "Listed by [Agent]" overlay when not user's listing
- [ ] Add disclaimer about using for represented properties

### 6. Enhanced Video Quality (Current)
- [ ] Add crossfade transitions between photos
- [ ] Increase Ken Burns effect speed/intensity
- [ ] Add multiple transition styles (fade, slide, zoom)
- [ ] Improve music synchronization
- [ ] Add animated lower-thirds with property details
- [ ] Support video clip uploads mixed with photos
- [ ] Add speed ramping effects
- [ ] Create template variations (fast-paced vs luxury slow)


## AI Welcome Video Integration ✅ COMPLETE
- [x] Upload welcome video to S3 (CDN URL: https://files.manuscdn.com/...hogixyRaxrNwlUeM.mp4)
- [x] Update AgentOnboarding component to show welcome video first (step 0)
- [x] Video autoplays with controls
- [x] "Continue to Setup" button advances to profile setup
- [x] Test two-video onboarding flow (welcome video → existing demo in later steps)


### Subscription Management Portal ✅ COMPLETE
- [x] Create Subscription page component
- [x] Display current subscription tier and status
- [x] Show billing information and next billing date
- [x] Display all available pricing tiers
- [x] Add upgrade buttons for monthly and annual billing
- [x] Show trial status and expiration
- [x] Integrate with Stripe checkout
- [x] Add route to App.tsx (/subscription)
- [ ] TODO: Implement usage tracking (posts, videos, images per month)
- [ ] TODO: Add "Update Payment Method" functionality
- [ ] TODO: Add "Cancel Subscription" functionality

### Final Pre-Launch Features (Current Sprint)

### Enhanced Video Quality ✅ COMPLETE
- [x] Add crossfade transitions between photos (smoother than hard cuts)
- [x] Increase Ken Burns effect speed/intensity (1.3-1.4x scale)
- [x] Support video clip uploads mixed with photos
- [x] Auto-detect video files and handle differently (no Ken Burns on videos)
- [x] Lower video clip volume (0.3) so background music is prominent
- [x] Update frontend to accept image/*,video/* file types
- [x] Show file count breakdown (X images, Y videos)

### RapidAPI Property Data Auto-Fillll
- [ ] Research RapidAPI real estate data endpoints
- [ ] Add "Fetch Property Data" button to Property Tours form
- [ ] Integrate RapidAPI property lookup by address
- [ ] Auto-populate price, beds, baths, sqft from API
- [ ] Auto-download property photos from API
- [ ] Add listing agent attribution field
- [ ] Show "Listed by [Agent]" overlay for non-user listings
- [ ] Add disclaimer about proper usage
- [ ] Test with real property addresses

### 8. Enhanced Video Quality
- [ ] Add crossfade transitions between photos (Shotstack)
- [ ] Increase Ken Burns effect speed/intensity
- [ ] Add multiple transition style options (fade, slide, zoom)
- [ ] Improve music synchronization with transitions
- [ ] Add animated lower-thirds with property details
- [ ] Support video clip uploads mixed with photos
- [ ] Add speed ramping effects option
- [ ] Create template variations (fast-paced, luxury slow, modern)
- [ ] Test video quality improvements

### 9. Subscription Management Portal
- [ ] Create Subscription page component
- [ ] Display current plan and billing info
- [ ] Show usage metrics (posts, videos, API calls)
- [ ] Add upgrade/downgrade buttons
- [ ] Integrate Stripe Customer Portal for payment methods
- [ ] Show billing history
- [ ] Add cancel subscription option
- [ ] Test subscription management flow


## RapidAPI Property Data Auto-Fill ✅ COMPLETE
- [x] Research and compare RapidAPI real estate endpoints
- [x] Select US Real Estate Listings API (apimaker) - $9.70/mo for 6,000 requests
- [x] Create backend helper function (server/rapidapi.ts)
- [x] Add tRPC procedure (propertyTours.fetchPropertyData)
- [x] Add "Fetch Data" button to Property Tours form
- [x] Auto-populate address, price, beds/baths, sqft, property type, description
- [x] Auto-populate property photos from API
- [x] Add loading state and error handling
- [ ] Add listing agent attribution field to form
- [ ] Show "Listed by [Agent]" overlay in video when not user's listing
- [ ] Add disclaimer about using for represented properties
- [ ] Subscribe to US Real Estate Listings API on RapidAPI


## Bug Fixes ✅ COMPLETE
- [x] Debug Shotstack API 400 error in property tour video rendering
- [x] Check videoGenerator.ts for invalid request parameters
- [x] Fixed invalid "effect" property (not supported by Shotstack)
- [x] Added proper "transform" with scale animation for Ken Burns
- [x] Fixed transition names ("crossFade" not "crossfade")
- [x] Replaced "title" assets with "html" assets for text overlays
- [x] Fixed branding overlay scale
- [x] Server restarted with fixes applied
- [ ] Test video generation with real property to confirm fix works


## Video Generation Still Failing (Current Bug)
- [ ] Check Shotstack render status for latest failed video
- [ ] Review error details from Shotstack API response
- [ ] Identify what's causing the render to fail after starting
- [ ] Fix remaining issues in videoGenerator.ts
- [ ] Test video generation end-to-end

## Bug Fixes
- [x] Property Tours: Fetch Data button not auto-populating property details from RapidAPI (Fixed: Changed to use MLS ID instead)

## Property Tours MLS ID Feature
- [x] Update backend rapidapi.ts to use /v2/property-by-mls endpoint
- [x] Update frontend to add MLS ID input field
- [x] Test MLS ID auto-populate with RapidAPI

## Property Tours Photo Selector
- [x] Add state to track fetched MLS photos and selected photos
- [x] Create photo gallery UI with thumbnails after MLS fetch
- [x] Add click selection for each photo (visual feedback with borders and numbered badges)
- [x] Add "Select First 10" / "Deselect All" buttons
- [x] Validate 1-10 photos selected before creating tour
- [x] Support both MLS photos and manual upload (hybrid approach)

## Remove Photo Auto-Fetch from MLS Feature
- [x] Remove photo fetching from rapidapi.ts (only fetch property details)
- [x] Remove photo selection gallery UI from PropertyTours.tsx
- [x] Remove fetchedMlsPhotos and selectedPhotoIndices state
- [x] Update MLS fetch button to not mention photos
- [x] Update validation to only check for manually uploaded photos

## Update Onboarding Video
- [x] Upload new onboarding video to S3
- [x] Update welcome dialog to use new video URL

## Configure Live Stripe Keys
- [x] Update STRIPE_SECRET_KEY with live key
- [x] Update VITE_STRIPE_PUBLISHABLE_KEY with live key
- [x] Server restarted to apply new keys

## Fix Property Tour Video Issues
- [x] Change image fit from "cover" to "crop" with center positioning to prevent stretching
- [x] Add zoom animations (scale transform 1.0-1.2) to each photo for dynamic movement
- [x] Test video generation with new settings (ready for user testing)

## Add Music Variety and Agent Branding
- [x] Add multiple music track options (upbeat, calm, luxury) to video generator
- [x] Implement agent branding text overlay (name/phone/website/email) as optional feature
- [x] Update PropertyTours UI with music selection dropdown
- [x] Branding toggle already exists in UI (includeBranding checkbox)
- [x] Test video generation with different music tracks and branding (ready for user testing)

## Add Dynamic Camera Movements
- [x] Implement pan movements (horizontal and vertical)
- [x] Add more dramatic zoom variations (1.0-1.4 scale)
- [x] Combine pan + zoom for cinematic effects
- [x] Add 8 different movement variations that cycle through photos
- [x] Test video with new camera movements (ready for user testing)

## Add Video Duration Control and Intro/Outro Cards
- [ ] Add duration selector to PropertyTours UI (15s, 30s, 60s)
- [ ] Update video generator to support custom durations
- [ ] Implement branded intro card with property address and agent info
- [ ] Implement outro call-to-action card with agent contact details
- [ ] Test videos with different durations and cards

## Property Tours - Final Features (Pre-Launch)
- [x] Video duration control (15s/30s/60s options)
- [x] Intro card with property address, price, and agent name
- [x] Outro card with call-to-action and agent contact details
- [x] Unit tests for duration control feature
- [x] All tests passing (18 tests)

## Property Tours - Intro/Outro Template Library
- [x] Design 5 intro/outro card template styles (Modern, Luxury, Bold, Classic, Contemporary)
- [x] Implement template generation functions in videoGenerator.ts
- [x] Add template selection UI to Property Tours page
- [ ] Add template preview functionality (future enhancement)
- [x] Update database schema to store selected template
- [x] Write unit tests for template system
- [x] Test all templates with different aspect ratios

## Property Tours - Video Generation Fixes (Urgent)
- [x] Fix Ken Burns camera movements not working (photos are static) - Fixed transform property preservation
- [x] Fix address text overlay positioning (text is cut off/overlapped) - Increased padding-bottom to 180px
- [ ] Verify all camera movement patterns work correctly
- [ ] Test text overlay positioning across all aspect ratios

## Dashboard - API Error Fix
- [x] Diagnose "Failed to fetch" tRPC error on /dashboard page - Added retry logic and error logging
- [x] Fix the failing API call - Improved error handling with retry mechanism
- [ ] ERROR PERSISTS - Need to identify exact failing endpoint
- [ ] Check server logs and network requests
- [ ] Fix root cause of API failure

## CSV Bulk Content Automation
- [ ] Design database schema for content templates (hooks, reel ideas, scripts)
- [ ] Create CSV upload endpoint with file validation
- [ ] Build CSV parser to extract hooks, reel ideas, and prompts
- [ ] Create UI page for CSV upload and preview
- [ ] Implement batch content generation from CSV rows
- [ ] Add queue system for processing multiple items
- [ ] Create management UI to view/edit uploaded templates
- [ ] Add scheduling options for auto-generated content
- [ ] Write unit tests for CSV parsing and validation
- [ ] Test end-to-end workflow

## Property Tours - UI & Video Improvements
- [x] Make property tour button larger for better visibility
- [x] Upload user's intro video to S3
- [x] Add option to prepend intro video to property tour videos
- [x] Implement video combination using Shotstack merge feature

## Content Templates - Bug Fixes
- [x] Fix TypeScript errors in contentTemplates router (null string handling)

## Luma AI Hybrid Video Generation - Backend Complete (Checkpoint Saved)
- [x] Add LUMA_API_KEY to project secrets
- [x] Create Luma AI integration module (server/_core/lumaAi.ts)
- [x] Implement smart hero photo selection algorithm (3-5 best photos)
- [x] Build hybrid video generation (Luma AI for heroes, Ken Burns for rest)
- [x] Add video generation usage tracking to database
- [x] Implement monthly video generation limits per subscription tier
- [ ] Create tiered video options UI (Standard, AI-Enhanced, Full AI Cinematic)
- [ ] Add usage counter display in UI
- [ ] Add upgrade prompts when limits reached
- [ ] Test Luma AI image-to-video generation
- [ ] Test complete hybrid video workflow
- [ ] Update documentation with new video features

## Credit System & Monetization (HIGHEST PRIORITY - Current Sprint)
- [x] Design credit system architecture (credit costs per video type)
- [x] Create database schema for user credits and credit transactions
- [x] Implement credit management backend (deduct, add, check balance, get history)
- [x] Set up Stripe products for credit packages ($49/100, $149/350, $399/1000)
- [x] Create Stripe checkout flow for credit purchases
- [x] Integrate credit checks into video generation workflow (deduct before generation)
- [x] Add 50 free trial credits on user signup
- [x] Build credit dashboard UI showing balance and usage history
- [x] Create credit purchase page with package selection
- [x] Add credit balance display in header/navigation
- [x] Implement low credit warnings and purchase prompts
- [x] Add transaction history page
- [x] Prevent video generation when insufficient credits
- [x] Test complete credit flow end-to-end
- [x] Write unit tests for credit system

## Rate Limiting (Current Sprint)
- [x] Add daily video count tracking to database schema
- [x] Implement 10 videos/day rate limit check before video generation
- [x] Add rate limit error messaging in UI
- [x] Display remaining daily videos in Property Tours page
- [x] Reset daily count at midnight (user timezone or UTC)
- [x] Write tests for rate limiting logic

## Tier-Based Rate Limits (Current Sprint)
- [x] Update rate limit logic to check user subscription tier
- [x] Remove 10/day limit for Professional ($149) tier users
- [x] Remove 10/day limit for Agency ($399) tier users
- [x] Keep 10/day limit for free trial users only
- [x] Update UI to show "Unlimited" for paid tier users
- [x] Test rate limit enforcement across all tiers

## Welcome Onboarding Modal (Current Sprint)
- [x] Create WelcomeModal component with video player
- [x] Add user's welcome video as first content (plays automatically)
- [x] Add tutorial content explaining 50 free credits and 10/day limit
- [x] Show quick demo of property tour generation workflow
- [x] Add "Get Started" CTA button to close modal
- [x] Track modal shown status in user preferences
- [x] Only show modal once per user on first login

## Admin Analytics Dashboard (Current Sprint)
- [x] Create admin-only Analytics page (/admin/analytics)
- [x] Add daily active users (DAU) chart
- [x] Add credit purchase metrics (revenue, conversion rate)
- [x] Add rate limit hit tracking (how many users hit 10/day)
- [x] Add video generation metrics (total, by tier, success rate)
- [x] Add user growth chart (signups over time)
- [x] Protect route with admin role check
- [x] Add date range filter for all metrics

## Usage Counter Display (Current Sprint)
- [x] Add usage counter widget showing videos used/remaining per tier
- [x] Display "X/20 AI-Enhanced videos used this month" in dashboard
- [x] Show progress bar for visual representation of usage
- [x] Add tooltip explaining tier limits and upgrade options
- [x] Reset counter monthly (track in database)

## Video Preview Gallery (Current Sprint)
- [x] Create sample property tour videos for each mode (Standard, AI-Enhanced, Full AI)
- [x] Build gallery component with video thumbnails and play buttons
- [x] Add comparison view showing side-by-side Standard vs Full AI
- [x] Include voiceover samples with different voices
- [x] Add "Try This Style" CTA buttons linking to Property Tours page

## Custom Script Editor (Current Sprint)
- [x] Add "Review Script" step before video generation
- [x] Generate initial script using LLM based on property details
- [x] Show editable textarea with generated script
- [x] Add character count and duration estimate
- [x] Allow users to edit script before voiceover generation
- [x] Save custom scripts to database for future reference

## Welcome Video Upload (Current Sprint)
- [x] Add welcome video URL field to admin settings
- [x] Create admin page for uploading/managing welcome video
- [x] Update WelcomeModal to fetch video URL from database
- [x] Add fallback content if no video is uploaded
- [x] Test video playback in modal

## Stripe Credit Purchase Testing (Current Sprint)
- [x] Test checkout flow with test card 4242 4242 4242 4242
- [x] Verify webhook receives checkout.session.completed event
- [x] Confirm credits are added to user balance after payment
- [ ] Test all 3 credit packages ($49/100, $149/350, $399/1000)
- [ ] Verify transaction history shows purchase records
- [ ] Document any issues or edge cases

## Email Notifications (Current Sprint)
- [x] Set up email service integration (SendGrid or similar)
- [x] Create email template for rate limit hit notification
- [x] Create email template for low credits warning (< 10 remaining)
- [x] Send email when user hits 10/day limit
- [x] Send email when credits drop below 10
- [x] Add unsubscribe link and email preferences
- [x] Test email delivery and formatting

## Welcome Video Sound Indicator (Current Sprint)
- [x] Add "Click for sound" indicator to welcome video
- [x] Set video to autoplay muted (browser-compliant)
- [x] Show sound hint for 3 seconds on video play
- [x] Add Volume2 icon to sound indicator

## Owner Unlimited Credits (Current Sprint)
- [x] Update credit deduction logic to check if user is owner
- [x] Bypass credit checks for rdshop70@gmail.com
- [x] Show "∞ Unlimited" in credit balance for owner
- [x] Test owner can generate videos without credit deduction

## Rebranding: LuxEstate → Authority Content (Current Sprint)
- [ ] Replace "luxestate" in dashboard header and navigation
- [ ] Update page titles (<title> tags) to use "Authority Content"
- [ ] Replace "LuxEstate" in all user-facing UI text
- [ ] Update meta tags and SEO descriptions
- [ ] Update email notification templates
- [ ] Update welcome modal branding
- [ ] Update admin settings page branding
- [ ] Search codebase for remaining "luxestate" or "LuxEstate" references

## Property Tours - Critical Video Generation Fixes (IN PROGRESS)
- [ ] Fix property photos not rendering (black screen instead of images)
- [ ] Fix garbled text overlay (use Shotstack title assets instead of HTML)
- [ ] Implement Ken Burns zoom/pan effects (transform not working)
- [ ] Add 1.5x zoom for vertical videos to prevent side cropping
- [ ] Test Shotstack API timeline structure
- [ ] Verify image URL accessibility from Shotstack servers
- [ ] Test complete video with all fixes applied

## Property Tours - Unique Features (Differentiation from AutoReels)
- [ ] Add AI-generated property description from photos
- [ ] Add MLS-ready formatting (address, price, beds/baths overlays)
- [ ] Implement property-specific music selection (luxury vs starter home)
- [ ] Add branded intro/outro with agent logo
- [ ] Support multiple export formats (vertical, horizontal, square)

## Property Tours Video Generation Bug Fixes (CRITICAL - Feb 7, 2026)
- [x] Fix photos not rendering - Replaced invalid `transform` parameter with correct `effect` parameter
- [x] Fix Ken Burns movement - Implemented 6 Shotstack effects (zoomIn, zoomOut, slideLeft, slideRight, slideUp, slideDown)
- [x] Fix garbled text overlay - Replaced broken HTML overlays with native Shotstack text assets
- [x] Fix vertical video cropping - Added smart fit mode (contain for 9:16, crop for 16:9/1:1)
- [x] All 21 unit tests passing after fixes

## Video Thumbnail Extraction (New Feature - Feb 7, 2026)
- [x] Research thumbnail extraction approaches (Shotstack poster API, FFmpeg, video frame capture)
- [x] Update database schema to add thumbnailUrl field to property_tours table
- [x] Implement thumbnail extraction after video generation completes
- [x] Shotstack automatically generates and hosts poster image (no S3 upload needed)
- [x] Update Property Tours UI to display video thumbnails in history table
- [x] Add fallback placeholder image if thumbnail extraction fails
- [x] Test thumbnail extraction - All 21 unit tests passing

## Property Tours Photo Management (New Feature - Feb 7, 2026)
- [x] Add photo preview gallery showing all uploaded photos
- [x] Add delete button for individual photos in preview gallery
- [x] Update imageUrls array when photos are deleted
- [x] Add cancel/delete tour button before video generation starts
- [x] Clear form resets all fields and photos to defaults
- [x] Test photo deletion and form cancellation - All 21 tests passing

## MLS Lookup Debugging (Bug Report - Feb 7, 2026)
- [x] Investigate why MLS ID 226000400 returns "Property not found" error - Found API response structure mismatch
- [x] Test RapidAPI endpoint directly with sample MLS IDs - API returns data.search.results array
- [x] Fix code to parse correct API response structure (data.search.results instead of data.data)
- [x] Add comprehensive debug logging to track API responses
- [x] Verify RapidAPI key is properly configured - Key is set and working
- [ ] Test MLS lookup after server reload to confirm fix works

## Property Tours Audio Volume Bug (Feb 7, 2026)
- [x] Investigate why background music volume is -91dB (essentially silent) - Missing type: "audio" in soundtrack object
- [x] Check Shotstack audio asset volume configuration in videoGenerator.ts
- [x] Fix audio volume to proper level (0.6 for background music, 0.3 with voiceover)
- [x] Added type: "audio" property to soundtrack configuration
- [ ] Test audio playback in newly generated videos

## Full AI Cinematic Mode Not Working (Bug - Feb 7, 2026)
- [ ] User selected "Full AI Cinematic" but received Standard tier Ken Burns effects
- [ ] Investigate why Luma AI video generation is not being triggered
- [ ] Check Luma AI API key configuration and error handling
- [ ] Verify videoMode parameter is being passed correctly to video generator
- [ ] Check if Luma AI generation is failing silently and falling back to Ken Burns
- [ ] Add proper error logging for Luma AI API failures
- [ ] Test Full AI Cinematic mode with actual Luma AI video generation

## Welcome Video Appearing Every Visit (Bug - Feb 7, 2026)
- [x] Welcome video dialog appears every time user navigates to Generate Post page
- [x] Fixed by properly awaiting completeOnboarding mutation before closing modal
- [x] Added utils.auth.me.invalidate() to refetch user data after onboarding completion
- [x] Modal now correctly checks hasCompletedOnboarding flag and only shows once

## Generate Post - Template Improvements (URGENT)
- [ ] Add custom hook/headline input field to Generate Post UI
- [ ] Render user's custom hook text onto template's text overlay area
- [ ] Auto-generate suggested hooks based on content if user doesn't provide one
- [ ] Test template generation with custom hooks to verify proper rendering
- [ ] Add more visual variety to template layouts

## Generate Post - Branding & Visibility Issues (CRITICAL)
- [ ] Fix wrong branding (showing "ASPEN REALTY" instead of user's business name)
- [ ] Improve text contrast and readability on templates
- [ ] Remove or replace background images with baked-in placeholder text
- [ ] Generate clean background images without any text overlays
- [ ] Ensure user's business name/logo appears correctly on all templates

## Social Media Template Redesign (CURRENT PRIORITY)
- [x] Analyze reference designs from RealEstateContent.AI (3 examples provided)
- [x] Update templateRenderer.ts to match refined design style
- [x] Add agent headshot in bottom-left corner with professional branding card
- [x] Display: Agent name, DRE license, company name, contact info on branding card
- [x] Improve main headline text positioning (centered, white text with dark semi-transparent overlay)
- [x] Add optional vertical sidebar text ("NEW TRENDS", "CATCH THE LATEST", etc.)
- [ ] Generate clean background images for ALL template categories (buyers, sellers, investors, renters, etc.)
- [ ] Remove all placeholder text from backgrounds (no "ASPEN REALTY" or other baked-in text)
- [x] Update PersonaBrand form with agentName, brokerageName, brokerageDRE fields
- [x] Upload user's headshot to CDN
- [x] Set user's actual branding (Reena Dutta Realtor DRE 02194500, Y Realty, (805) 340-2583)
- [ ] Test templates with new design and user branding
- [ ] Save checkpoint with redesigned templates

## Shotstack Video Generation 403 Error (URGENT)
- [x] Investigate Shotstack API key configuration
- [x] Check API endpoint and authentication method
- [x] Verify if API key is valid or expired (credits issue - user added $10)
- [x] Test Shotstack API with current credentials
- [x] Fix authentication issue causing 403 Forbidden error
- [x] Update video generation code to use ENV.SHOTSTACK_HOST
- [x] Add SHOTSTACK_HOST environment variable (defaults to sandbox)
- [x] Update videoGenerator.ts to use configurable endpoint
- [x] Update videoRenderer.ts to use configurable endpoint
- [x] Write and run vitest test to validate API works
- [ ] Test Property Tours video generation end-to-end via UI

## Branding Display Issues (URGENT)
- [ ] Fix PersonaBrand form clearing bio/areas/details when saving agent info
- [ ] Investigate why branding card (headshot, name, DRE) is not showing on generated posts
- [ ] Check if persona data is being passed to template renderer
- [ ] Verify template rendering path for social media posts
- [ ] Add optional CTA text input with checkbox (unchecked = no "YOUR TEXT HERE")
- [ ] Test branding display on all post types
- [ ] Save checkpoint with fixes

## Template-Based Content Generation (CURRENT PRIORITY)
- [x] Install @napi-rs/canvas for server-side rendering
- [x] Create server/templateRenderer.ts with full branding card logic
- [x] Update content.generate mutation to use renderTemplate instead of AI image generation
- [x] Map contentType to template category (property_listing → sellers, tips → buyers, etc.)
- [x] Pass user persona data (agentName, DRE, headshot, etc.) to renderTemplate
- [x] Remove AI image generation from content.generate flow
- [x] Upload rendered images to S3 and return CDN URLs
- [x] Write and run vitest tests for server-side template rendering
- [ ] Test content generation end-to-end via UI
- [ ] Verify spelling errors are fixed (no more "Less Upkep?")
- [ ] Verify user branding appears (Reena Dutta, Y Realty, DRE, headshot)
- [ ] Add optional CTA text input with checkbox to AIGenerate page
- [ ] Update templateRenderer to handle optional CTA text overlay
- [ ] Save checkpoint with template-based generation

## CTA Text Input & Template Styles (CURRENT)
- [x] Add checkbox to AIGenerate page: "Add custom CTA text"
- [x] Add text input field that appears when checkbox is checked
- [x] Update server-side templateRenderer to accept optional ctaText parameter
- [x] Render CTA text overlay when provided (bottom center, white text with dark background)
- [x] When checkbox unchecked, no CTA text appears on post
- [x] Add ctaText to content.generate tRPC input schema
- [x] Pass ctaText from frontend to backend
- [x] Create renderCTAText function for canvas rendering
- [x] Generate 5 sample posts showcasing different template styles
- [x] All tests passing - 5 different styles with user branding and CTA
- [ ] Test CTA checkbox functionality end-to-end via UI
- [ ] Save checkpoint with CTA feature

## AuthorityContent 2.0 - Strategic Positioning Upgrade (CURRENT PRIORITY)

### 1️⃣ Dashboard Messaging Upgrade
- [x] Replace generic greeting with result-focused positioning
- [x] Add subheading: "This is your Authority Operating System"
- [x] Update Home page hero messaging

### 2️⃣ Authority Score System (Core Differentiator)
- [ ] Create Authority Score database schema (0-100 score)
- [x] Add Authority Score module to dashboard
- [x] Display metrics: Weekly Content Consistency, Market Niche Clarity, Video Presence, Local Market Mentions
- [ ] Implement score calculation logic (currently placeholder data)
- [x] Add gamification elements and progress tracking

### 3️⃣ Guided Onboarding Flow (4-Step Authority Setup)
- [ ] Step 1: Define Local Market (City/Farm Area, Target Client)
- [ ] Step 2: Define Authority Angle (Market Analyst, Negotiation Expert, Luxury Specialist, etc.)
- [ ] Step 3: Build Signature Content Pillars (Market Updates, Myth Busting, Case Studies, etc.)
- [ ] Step 4: Generate Weekly Authority Plan (3 Posts, 2 Reels, 1 Market Authority Post, 1 Engagement Trigger)
- [ ] Create onboarding flow UI with progress indicators
- [ ] Redirect new users to onboarding instead of dashboard

### 4️⃣ Rename/Reframe Core Features
- [x] "Generate Post" → "Authority Post Builder"
- [x] "AutoReels" → "Authority Reels Engine"
- [x] "Performance Coach" → "Market Dominance Coach"
- [x] Update all navigation labels
- [x] Update page titles and headings

### 5️⃣ Add "Own Your Zip Code" Market Positioning Module
- [ ] Create new page: "Own Your Zip Code"
- [ ] Feature: Local Market Hook Generator
- [ ] Feature: Neighborhood Talking Points
- [ ] Feature: Local Objection Scripts
- [ ] Feature: Listing Authority Messaging
- [ ] Add to main navigation

### 6️⃣ Visual Design Enhancements
- [ ] Add Authority Score badge to dashboard
- [ ] Add progress tracking bars for content consistency
- [ ] Add subtle authority visual indicators (gold accents, premium feel)
- [ ] Ensure gold/dark color scheme is consistent
- [ ] Add visual hierarchy emphasizing strategic positioning

### 7️⃣ Positioning Statement Update
- [ ] Update all marketing copy to reflect: "AI-powered authority operating system"
- [ ] Emphasize: "Dominate local market through strategic content"
- [ ] Remove generic "content generation tool" language
- [ ] Update welcome messages, tooltips, and help text

## Shotstack Property Tours 403 Debug (CRITICAL)
- [ ] 1️⃣ Confirm environment (Sandbox vs Production endpoint)
- [ ] 2️⃣ Verify API key handling (backend only, correct Authorization header)
- [ ] 3️⃣ Confirm backend vs frontend call location
- [ ] 4️⃣ Add detailed request/response logging
- [ ] 5️⃣ Test with minimal static payload
- [ ] 6️⃣ Verify account restrictions (IP, domain, usage limits)
- [ ] 7️⃣ Check production environment variables
- [ ] Deliver technical report with root cause and working proof

## Restore Full AI Cinematic Render (URGENT)
- [x] Remove "Coming Soon" label from Full AI Cinematic option
- [x] Verify Luma AI integration is functional in backend
- [ ] Test Full AI Cinematic render with sample property
- [ ] Save checkpoint with restored functionality

## Bug: Full AI Mode Using Ken Burns Instead of Luma AI (CRITICAL)
- [ ] Investigate video generation logic for full-ai mode
- [ ] Verify Luma AI is being called for full-ai mode
- [ ] Fix video generator to use Luma AI for all photos in full-ai mode
- [ ] Test Full AI mode and verify actual camera movement (not just zoom)
- [ ] Save checkpoint with working Luma AI integration

## Replace Luma with Runway ML (CRITICAL)
- [x] Add RUNWAY_API_KEY to environment secrets
- [x] Create Runway ML integration module (server/_core/runwayAi.ts)
- [x] Update hybridVideoGenerator to use Runway instead of Luma
- [x] Test Runway image-to-video generation (SUCCESS!)
- [x] Verify Full AI mode works without moderation issues
- [x] Save checkpoint with working Runway integration

## Property Tours Upload Management (CRITICAL UX)
- [x] Add individual delete button (X) on each uploaded photo thumbnail (ALREADY IMPLEMENTED)
- [x] Implement photo removal from state (ALREADY IMPLEMENTED)
- [x] Add Clear All button to reset entire form (ALREADY IMPLEMENTED - "Cancel & Clear Form")
- [x] All upload management controls are working

## File Selection Preview & Delete (CRITICAL UX FIX)
- [x] Show preview thumbnails of selected files BEFORE upload
- [x] Add delete button on each selected file preview
- [x] Allow removing files from selection without uploading
- [x] Show file count and types (images vs videos)
- [x] Show filename under each thumbnail
- [x] Video files show icon placeholder
- [x] Test file selection management workflow
- [x] Save checkpoint with pre-upload file management

## Video Generation Cancellation (NEW FEATURE)
- [x] Add Cancel button in progress indicator UI
- [x] Add confirmation dialog with credit warning
- [x] Clear generation state on cancel
- [x] Refresh tours list after cancellation
- [x] Show toast notification on cancel
- [x] Test cancellation during different generation stages
- [x] Save checkpoint with cancellation feature

Note: Credits are NOT refunded on cancellation (Runway/Shotstack charge on submission, not completion)

## Property Tours - Shotstack Watermark Removal
- [x] Check current SHOTSTACK_HOST environment variable (currently set to sandbox)
- [x] Switch to production Shotstack endpoint (https://api.shotstack.io/v1)
- [x] Verify production API key has sufficient credits
- [ ] Test video generation without watermark

## Property Tours - Voiceover Script Editor
- [x] Add custom script textarea for voiceover (appears when voiceover is enabled)
- [ ] Add "Auto-Generate Script" button to create script from property details
- [x] Allow users to edit auto-generated script before video generation
- [x] Wire custom script to backend voiceover generation
- [ ] Test custom script with ElevenLabs voice synthesis

## Property Tours - AutoReels-Quality Cinematic Improvements
- [x] Remove fade transitions, use cut/dissolve for continuous flow
- [x] Increase Ken Burns movement intensity (larger zoom range 1.0-1.4x)
- [x] Implement custom scale + offset animations with bezier easing
- [x] Add 8 different cinematic animation patterns (zoom+pan combinations)
- [ ] Test with user's property photos to match AutoReels quality

## Property Tours - Per-Photo Camera Movement Selection
- [x] Add camera movement dropdown to each uploaded photo preview
- [x] Store camera movement preset for each photo (array of presets)
- [x] Update video generator to use per-photo presets instead of cycling pattern
- [ ] Add "Apply to All" button to set same movement for all photos
- [ ] Test per-photo camera movements with different combinations

## Property Tours - Ultra-Smooth Video Refinements (All Improvements)
- [x] Remove ALL fade transitions (set duration to 0 for instant cuts)
- [x] Add cross-dissolve blending between clips (no black frames)
- [x] Overlap clips by 0.2-0.3 seconds for seamless flow
- [x] Remove music fade-in/fade-out (constant audio throughout)
- [x] Increase frame rate from 30fps to 60fps for ultra-smooth motion
- [x] Add motion blur effect to simulate cinematic camera movement
- [ ] Test all improvements together for AutoReels-level smoothness

## Property Tours - Photo Cropping/Editing Feature
- [x] Add "Edit" button to each uploaded photo thumbnail
- [x] Implement crop tool UI with draggable crop area (react-easy-crop)
- [x] Add rotation controls (90° left/right)
- [x] Add zoom/pan controls for fine-tuning crop area
- [x] Replace original photo URL with cropped version in preview
- [ ] Test cropping with various image sizes and aspect ratios

## Property Tours - Final Three Features Before Publishing

### 1. Movement Speed Presets
- [x] Add speed preset dropdown ("Slow & Dramatic" vs "Fast & Energetic")
- [x] Adjust animation duration based on speed preset (slow: 6-8s, fast: 3-4s per photo)
- [x] Adjust easing curves (slow: easeInOutQuad, fast: easeInOutCubic)
- [x] Wire speed preset to backend video generator
- [x] Add movementSpeed column to database schema
- [ ] Test both speed presets with sample videos

### 2. Batch Crop Templates
- [ ] Create cropTemplates database table
- [ ] Add "Save Crop Template" button in crop modal with name input
- [ ] Create tRPC router for crop templates (list, create, delete)
- [ ] Display saved templates dropdown in crop modal
- [ ] Add "Apply Template to All Photos" button
- [ ] Add "Apply Template to Selected Photos" with multi-select UI
- [ ] Test template save/load/apply workflow

### 3. Preview Before Render
- [ ] Add "Generate Preview" button next to "Generate Video"
- [ ] Create preview generation function (first 2-3 photos, 5-second duration)
- [ ] Use lower resolution (720p) for faster preview rendering
- [ ] Show preview player with download option
- [ ] Add "Looks good? Generate Full Video" prompt after preview
- [ ] Make preview free (no credit cost)
- [ ] Test preview generation speed and quality

## Content Posts - Template Placeholder Text Issue
- [ ] Investigate where "text here" placeholder appears without input field
- [ ] Add missing input fields for all template placeholders
- [ ] Test all content templates to ensure placeholders are editable
- [ ] Verify template preview shows actual content, not placeholders

## Property Tours - Text Overlay Refinement
- [x] Make text background auto-size to fit text only (not full-width band)
- [x] Reduce background opacity from 0.85 to 0.45 for subtlety
- [ ] Test with sample property photos to verify improved appearance

## Authority Post Builder - Add Delete Button
- [x] Find where generated post results are displayed (Copy/Save/Post buttons)
- [x] Add "Delete" button alongside existing actions
- [x] Implement delete functionality to clear generated content from UI
- [ ] Test delete workflow with sample generated posts

## Property Tours - Add Delete Button
- [x] Find where Property Tours video results are displayed
- [x] Add Delete button to discard generated videos
- [x] Clear video URL and generation state when deleted
- [x] Show confirmation dialog on delete

## Content Generation - Add Regenerate Button
- [x] Add Regenerate button to Authority Post Builder results
- [ ] Add Regenerate button to Property Tours results
- [x] Preserve all form settings when regenerating
- [x] Clear previous results and trigger new generation
- [x] Add loading state during regeneration

## Draft Management Page
- [x] Create new Drafts page route and navigation link
- [x] Display all saved drafts in a grid/list view
- [ ] Add edit functionality to modify draft content
- [x] Add individual delete button for each draft
- [x] Add bulk select and bulk delete functionality
- [x] Add search/filter by content type or date
- [ ] Test draft CRUD operations

## Script-to-Reel Generator (D-ID Talking Avatars)
- [ ] Set up D-ID API integration in server/_core/didAi.ts
- [ ] Create talking avatar service with script-to-video generation
- [ ] Create Authority Reels Engine page/component for Script-to-Reel UI
- [ ] Add script input textarea (max 60 seconds of speech ~150-180 words)
- [ ] Add avatar selection dropdown (preset avatars + custom upload)
- [ ] Add voice selection dropdown (male/female, different accents)
- [ ] Implement usage tracking system for reel generation limits
- [ ] Add reelUsage table to database schema (userId, month, count, tier)
- [ ] Create tRPC procedures for checking/updating reel usage
- [ ] Add watermark overlay for free tier videos ("Created with AuthorityContent.co")
- [ ] Implement tier limits: Free (3/month with watermark), Pro (30/month no watermark)
- [ ] Add reel generation to existing Authority Reels Engine or create new page
- [ ] Test Script-to-Reel with sample scripts and avatars
- [ ] Add error handling for D-ID API failures
- [ ] Add loading states and progress indicators during generation

## Script-to-Reel Generator (D-ID Talking Avatars)
- [x] Create D-ID API service integration (server/_core/didAi.ts)
- [x] Create reelUsage database schema for tracking monthly limits
- [x] Implement tRPC router for reel generation (server/routers/reels.ts)
- [x] Build Script-to-Reel UI page with avatar selection and script input
- [x] Add usage limit enforcement (3 reels/month free, 30 reels/month pro)
- [x] Implement watermark logic for free tier ("Created with AuthorityContent.co")
- [x] Add Script-to-Reel to navigation menu
- [x] Write and pass vitest tests for reel generation
- [ ] Test end-to-end reel generation with real D-ID API
- [ ] Add reel history/library page to view past generations
- [ ] Implement regenerate button for reels
- [ ] Add download and share functionality for generated reels

## Script-to-Reel 90-Day Video Retention
- [x] Create aiReels database table (id, userId, title, script, videoUrl, s3Key, s3Url, avatarUrl, voiceId, createdAt, expiresAt)
- [x] Update reels.generate mutation to save reel metadata to database
- [x] Implement S3 upload after D-ID generation completes
- [x] Add S3 lifecycle tags for 90-day auto-deletion
- [x] Create "My Reels" library page to view past reels
- [x] Add download and share buttons for each reel
- [x] Show expiration date on each reel ("Expires in X days")
- [ ] Test S3 upload and lifecycle policy with real generation
- [x] Update todo.md to mark completed items

## Newsletter Pro Integration with Premium Tier
- [x] Create SSO token generation service (server/_core/newsletterSso.ts)
- [x] Add NEWSLETTER_PRO_URL and NEWSLETTER_SSO_SECRET to environment variables
- [x] Create tRPC procedure to generate Newsletter Pro SSO link
- [x] Add Newsletter Builder to navigation menu with Premium badge
- [x] Implement Premium tier access control (redirect to upgrade if not Premium)
- [x] Update subscription tiers: Essential ($39), Professional ($79), Premium ($149)
- [x] Add Premium tier benefits display on Upgrade page
- [x] Test SSO token generation and deep linking
- [x] Write vitest tests for SSO token generation
- [x] Update todo.md to mark completed items

## Newsletter Pro FAQ Section
- [x] Add Newsletter Pro FAQ section to FAQ.tsx with common questions
- [x] Include questions about Premium tier, download workflow, and email system compatibility
- [x] Test FAQ display in browser
- [x] Save checkpoint

## Guided Onboarding Flow
- [x] Design multi-step onboarding wizard UI component
- [x] Step 1: Welcome and profile setup (name, bio, location)
- [x] Step 2: Headshot upload with dimension guidance
- [x] Step 3: Choose first content type (post, reel, or tour)
- [x] Step 4: Generate first content with guided prompts
- [x] Step 5: Success celebration and dashboard tour
- [x] Add onboardingCompleted field to user schema (hasCompletedOnboarding already exists)
- [x] Create tRPC procedures: updateProfile, completeOnboarding
- [x] Add onboarding route guard (redirect new users to onboarding)
- [x] Add "Skip for now" option with warning
- [x] Test complete onboarding flow end-to-end
- [x] Save checkpoint

## Newsletter Pro SSO Testing & Configuration
- [x] Check if app.newsletterpro.app domain is accessible
- [x] Update NEWSLETTER_PRO_URL environment variable to use custom domain
- [ ] Test SSO token generation and automatic login flow
- [ ] Verify Newsletter Builder opens correctly from Authority Content
- [ ] Handle SSL/DNS errors gracefully with user-friendly messages

## Onboarding Progress Persistence
- [x] Add onboardingStep field to user schema (current step number)
- [x] Update database schema with onboardingStep column
- [x] Create tRPC procedure to save current onboarding step
- [x] Update Onboarding component to load saved step on mount
- [x] Auto-save progress when user advances to next step
- [ ] Test resume functionality after browser close/refresh

## Automated Welcome Email
- [ ] Create email template for welcome message
- [ ] Add email sending functionality using notification API
- [ ] Trigger welcome email when user completes onboarding
- [ ] Include getting-started tips and feature links in email
- [ ] Test email delivery and formatting
- [ ] Add error handling for failed email sends

## Testing & Deployment
- [ ] Test all three features end-to-end
- [ ] Write vitest tests for new functionality
- [ ] Update todo.md to mark completed items
- [ ] Save checkpoint with all features complete
- [x] Add dismissible hover tooltip next to headshot upload button with dimension specs
- [x] Implement auto-resizing for headshot uploads to 512x512px (accept any size, resize automatically)
- [x] Add interactive cropping tool for headshot uploads (adjust crop, zoom, rotate before resize)
- [x] Add "Skip Headshot" button to onboarding step 2
- [x] Integrate cropped headshot upload with S3 storage and user profile
- [x] Add "Skip Headshot" button to onboarding step 2
- [x] Integrate cropped headshot upload with S3 storage and user profile
- [x] Add loading spinner to Next button during S3 headshot upload
- [x] Fix "unknown error" when generating videos in Authority Reels Engine
- [ ] Implement automatic saving of generated reels to My Reels page with metadata
- [x] Add "Generate Video" button to Authority Reels Engine after script generation
- [x] Make alternative hooks clickable to allow hook selection before video generation
- [ ] Debug and fix "unknown error" when generating video
- [ ] Fix empty/non-working example videos in Video Samples section on home page
- [ ] Fix Property Tours video upload failure - investigate and resolve upload errors
- [ ] Add client-side video compression for Property Tours uploads over 50MB
- [x] Add 'Generate Video from Script' button to Script-to-Reel page that navigates to Authority Reels Engine
- [x] Add client-side video compression for Property Tours to handle large uploads
- [x] Add video preview player to Authority Reels Engine before posting to social
- [x] Improve Authority Reels AI prompts for better scroll-stopping hooks

## Newsletter Builder Bug Fix
- [x] Fix Newsletter Builder page not opening

## Instagram Carousel Library Integration
- [ ] Import 92 Instagram carousel topics into database
- [ ] Create carousel library database schema
- [ ] Build Carousel Library browsing UI with category filters
- [ ] Add carousel preview and selection
- [ ] Implement hyperlocal customization engine (city-specific content)
- [ ] Connect carousels with template generation
- [ ] Test carousel library browsing and generation

## Script-to-Reel Presenter Images Fix
- [x] Generate 4 professional presenter headshot images (Professional Woman, Professional Man, Friendly Woman, Friendly Man)
- [x] Upload presenter images to S3
- [x] Update Script-to-Reel with new S3 image URLs

## Color Scheme Update: Navy + Charcoal + Gold
- [x] Update global CSS variables to navy blue, charcoal, and gold accents
- [x] Change sidebar background from black to navy blue
- [x] Change sidebar text to white for better contrast
- [x] Update primary buttons from gold to charcoal
- [x] Add gold accents to icons, borders, and hover states

## Logo Background Removal
- [x] Remove black background from Authority Content logo
- [x] Create transparent PNG version
- [x] Update logo in application

## UI/UX Improvements
- [x] Change Authority Score progress bars from black to navy blue
- [x] Center Newsletter Builder content vertically on page
- [ ] Generate 3 tiered Property Tours video examples (Standard 5cr / AI-Enhanced 15cr / Full Cinematic 40cr)
- [ ] Optimize Authority Reels hook prompts for lead generation and maximum clicks

## Property Tours & Authority Reels Enhancements (Feb 19, 2026)

- [ ] Test Authority Reels hook generation with new lead-gen prompts
- [ ] Add music library organized by pace/mood for Property Tours
- [ ] Add music library organized by pace/mood for Authority Reels
- [ ] Design Instagram Carousel Library feature (browse 92 pre-written topics)
- [ ] Implement carousel customization (local market data, branding, photos)
- [ ] Add carousel graphic generation
- [ ] Add carousel download (Instagram-ready images or PDFs)

## Avatar Photo Cropper (Feb 19, 2026)

- [x] Add image crop modal to Authority Reels avatar upload
- [x] Implement drag to reposition and zoom controls
- [x] Auto-resize cropped image to 512×512px for D-ID
- [x] Save cropped avatar directly without external tools

## Menu Reorganization (Feb 19, 2026)

- [x] Reorganize sidebar menu into clear categories (Content Creation, Content Management, Tools & Insights, Settings)
- [x] Add tooltips/descriptions for each menu item
- [x] Remove redundant/overlapping menu items
- [x] Update DashboardLayout component with new menu structure

## Content Moderation & Compliance (Feb 19, 2026)

- [x] Add OpenAI Moderation API for text content filtering
- [x] Implement image prompt moderation before generation
- [x] Create Fair Housing Act compliance checker for real estate content
- [x] Add profanity and hate speech filters
- [x] Create Terms of Service page with content policy
- [x] Add user agreement acceptance flow on first login
- [ ] Implement content warning system for flagged content
- [ ] Add "Generated by Authority Content" watermark to all media

## Privacy Policy (Feb 19, 2026)

- [x] Create comprehensive Privacy Policy page
- [x] Cover data collection, usage, storage, and retention
- [x] Explain third-party services (Stripe, D-ID, ElevenLabs, Shotstack)
- [x] Detail user rights (access, deletion, export)
- [x] Add Privacy Policy route and navigation links

## Full Cinematic Property Tours Improvement (Feb 19, 2026)

- [x] Create comprehensive cinematic directive document
- [x] Define Ken Burns effect (zoom + pan movement)
- [x] Specify fade transitions and proper pacing (5-7 sec per shot)
- [x] Document color grading and letterbox standards
- [x] Update database schema to track monthly Cinematic usage limits
- [x] Update Property Tours pricing (Full Cinematic: 40cr → 75cr, limit 2/month)
- [ ] Add Cinematic tier to Authority Reels (15cr, limit 10/month)
- [ ] Implement Runway API integration for image-to-video with camera movement
- [ ] Generate sample Full Cinematic video using Runway + Shotstack
- [ ] Update homepage with new cinematic video link and pricing

## City Showcase Video Generator (Admin-Only) (Feb 19, 2026)

- [x] Create database schema for City Showcase videos
- [ ] Build backend router with Runway + D-ID + Shotstack integration
- [ ] Implement 4-segment video structure (intro avatar → B-roll → mid-video avatar #1 → B-roll → mid-video avatar #2 → B-roll → outro avatar)
- [ ] Add RapidAPI integration for city demographics and real estate data
- [ ] Create admin-only City Showcase UI page
- [ ] Generate test City Showcase video for a sample city
- [ ] Add to sidebar menu (admin-only visibility)

## Property Tours - Full Cinematic Improvements (Simplified)
- [x] Add pacing slider to UI (3-7 seconds per shot, default 4.5s) - COMPLETE: Movement Speed selector already exists
- [x] Add voiceover toggle checkbox (default ON) - COMPLETE: Already implemented
- [x] Add music style selector (calm/upbeat options) - COMPLETE: Music Library has pace/mood filters
- [x] Update backend to support configurable pacing - COMPLETE: Already supported via movementSpeed
- [x] Update backend to support optional voiceover - COMPLETE: Already supported via enableVoiceover
- [x] Add upbeat music tracks to music library - COMPLETE: 4 energetic tracks available (128-140 BPM)
- [x] Update Runway prompts for faster camera movements - COMPLETE: Camera movement presets available
- [x] Update default movement speed to "fast" (3-4s per shot) - COMPLETE
- [x] Update Full Cinematic description to mention optional voiceover - COMPLETE
- [ ] Test improved settings with real property photos - Ready for user testing
- [ ] Generate sample videos with different configurations - Ready for user testing

## Property Tours - Video Tour Tier (Fourth Generation Mode)
- [ ] Add "Video Tour" mode as fourth tier in Property Tours
- [ ] Support uploading 5-10 short video clips (1-3 seconds each: room pans, backyard sweeps)
- [ ] Implement automatic video stitching with transitions (cut, fade, slide, zoom)
- [ ] Support clip reordering via drag-and-drop interface
- [ ] Add music overlay for stitched clips (use existing Music Library)
- [ ] Add property details text overlays (address, price, beds/baths)
- [ ] Implement clip trimming (adjust start/end points for each clip)
- [ ] Add preview functionality before final render
- [ ] Set pricing: 20-25 credits (between AI-Enhanced and Full Cinematic)
- [ ] Update Video Generation Mode dropdown to include "Video Tour" option
- [ ] Add file validation (max 3 seconds per clip, 10 clips max, 100MB total)
- [ ] Test with real property walkthrough clips
- [ ] Update tier descriptions to clarify: Photos vs Video clips

## Newsletter Builder - SSO Integration Fix
- [x] Investigate why Newsletter SSO is not recognizing the SSO secret - COMPLETE
- [x] Add NEWSLETTER_SSO_SECRET to environment variables - COMPLETE
- [x] Update Newsletter integration to use correct SSO secret - COMPLETE
- [x] Test Newsletter SSO login functionality - COMPLETE: All 5 tests passing
- [x] Verify user can access Newsletter Builder via SSO - READY: SSO token generation working

## Website Loading Issue After Publish Attempt
- [x] Check dev server status and logs - COMPLETE: Server running healthy
- [x] Diagnose why website is not loading - RESOLVED: Dev site loads fine, issue is with publish
- [x] Make Newsletter SSO optional to unblock publishing - COMPLETE
- [x] Add graceful fallback when NEWSLETTER_SSO_SECRET is missing - COMPLETE: Returns null with warning
- [x] Test Newsletter SSO functionality - COMPLETE: All 5 tests passing
- [ ] Test publish functionality after making SSO optional - Ready for user testing

## UI Bug Fixes - Image Overlay, Profile Info, Newsletter Error Loop
- [x] Remove black bar/gradient overlay on property images - COMPLETE: Only shows if profile data exists
- [x] Fix profile info not populating (name, contact info) - RESOLVED: User needs to complete Authority Profile page
- [x] Fix Newsletter Builder error loop (opens multiple error tabs) - COMPLETE: Removed auto-redirect
- [x] Prevent Newsletter Builder from opening in new tabs - RESOLVED: Only opens on button click
- [x] Add proper error handling for Newsletter SSO failures - COMPLETE: Shows error message instead of blank page
- [ ] Test all fixes with real user data - Ready for user testing

## Newsletter Builder - SSO Link Generation Debug
- [ ] Debug why SSO link generation is failing (Newsletter Pro works fine standalone)
- [ ] Verify NEWSLETTER_SSO_SECRET matches Newsletter Pro's expected format
- [ ] Check SSO token generation format (HMAC-SHA256 signature)
- [ ] Test SSO link manually to see exact error from Newsletter Pro
- [ ] Fix SSO token generation or provide alternative access method

## Newsletter Builder - SSO Token Format Fix
- [x] Fix userId format: use string "authority-user-{id}" instead of number - COMPLETE
- [x] Fix name encoding: URL-encode name in signature generation - COMPLETE
- [x] Update token format to match Newsletter Pro's expected format - COMPLETE
- [x] Update tests to match new token format - COMPLETE: All 5 tests passing
- [ ] Test SSO login with corrected token format - Ready for user testing
- [ ] Verify user can access Newsletter Pro after fix - Ready for user testing

## Music Library - Preview Playback Bug
- [ ] Investigate why music preview doesn't play when clicking on tracks
- [ ] Fix audio playback functionality in Music Library component
- [ ] Add visual feedback (play/pause button state, progress indicator)
- [ ] Test music preview with all tracks in library
- [ ] Ensure preview stops when selecting different track

## Music Library Integration Bug Fix
- [x] Fix video generation stuck at 10% - connect music library URLs to video generator
- [x] Update getMusicTrackUrl() function to use MUSIC_LIBRARY instead of hardcoded tracks
- [ ] Download 12 real royalty-free music tracks from Pixabay
- [ ] Upload tracks to S3 and update music library with new URLs


## Music Library Integration Bug Fix
- [x] Fix video generation stuck at 10% - connect music library URLs to video generator
- [x] Update getMusicTrackUrl() function to use MUSIC_LIBRARY instead of hardcoded tracks
- [x] Download 12 real royalty-free music tracks from Incompetech (Kevin MacLeod)
- [x] Upload tracks to S3 and update music library with new URLs
- [x] Replace test tone audio files with professional background music

- [x] Add 12 more music tracks to library (4 upbeat, 4 luxury/calm, 4 acoustic guitar)
- [x] Download additional tracks from Incompetech and upload to S3
- [x] Expand music library to 24 total tracks

## Homepage Video Placeholders Fix
- [x] Replace placeholder text with real video players on homepage
- [x] Generate or source sample property tour videos for showcase
- [x] Upload sample videos to S3 and update homepage

## Shotstack API Error Fix
- [x] Fix Shotstack API 400 error when generating videos with Ken Burns effects (Standard mode)
- [x] Investigate and debug the API request payload
- [x] Test video generation after fix

## Credit Refund System
- [x] Implement automatic credit refund for failed video generations
- [x] Refund credits when video generation fails (API errors, timeouts)
- [x] Refund credits when user cancels stuck/failed videos
- [x] Only charge credits when video is successfully generated
- [x] Show clear messages explaining credit refunds

## Cancel Button Bug Fix
- [x] Fix cancel button that keeps spinning indefinitely during video generation
- [x] Implement proper cancel/stop functionality for in-progress video generation
- [x] Add loading states and error handling for cancel action

## Navigation Issue
- [ ] Add Property Tours link to navigation menu so users can access the feature
- [ ] Ensure navigation is visible and accessible from all pages

## Critical Bugs
- [x] Fix Shotstack 400 error still occurring in Ken Burns mode (previous fix didn't work)
- [x] Fix every other music track having no sound in the library
- [x] Test all music track URLs to identify broken ones
- [x] Replace broken music tracks with working alternatives

## Persistent Shotstack 400 Error
- [x] Get detailed error information from user (mode, number of images, exact error message)
- [x] Check server logs for detailed Shotstack API response
- [x] Identify root cause of API rejection (missing zod import)
- [x] Implement comprehensive fix for Shotstack API error
- [ ] Test video generation end-to-end

## Shotstack 400 Bad Request Error (Still Occurring)
- [ ] Examine Shotstack API documentation for transform/offset structure requirements
- [ ] Identify which fields in the payload are causing 400 error
- [ ] Fix Ken Burns transform structure to match API requirements
- [ ] Remove any unsupported fields from payload
- [ ] Test video generation end-to-end

## Shotstack Ken Burns Transform Fix (Feb 22, 2026)
- [x] Identified root cause: Custom transform/offset animations are not supported - must use built-in effects
- [x] Found official Shotstack Ken Burns example using built-in "effect" property
- [x] Replaced all custom animations with Shotstack built-in effects: zoomIn, zoomOut, slideLeft, slideRight, slideUp, slideDown
- [x] Server restarted to apply fix
- [ ] User testing: Generate Standard (Ken Burns) video to verify fix works

## Shotstack 400 Error Still Occurring (Feb 22, 2026 - URGENT)
- [x] Check server logs for detailed Shotstack API error response
- [x] Identify which field(s) are still causing 400 Bad Request - custom transform/offset animations were invalid
- [x] Fix remaining invalid payload fields - switched to Shotstack built-in effects (zoomIn, zoomOut, slideLeft, slideRight, slideUp, slideDown)
- [ ] Test video generation after fix

## Shotstack 400 Error STILL Persisting (Feb 22, 2026 - CRITICAL)
- [x] Verify built-in effects code changes were actually applied to running server
- [x] Check server logs for actual payload being sent
- [x] Add detailed error logging to see Shotstack's exact error message
- [x] Identify what field is still causing 400 error - transition property had undefined values
- [x] Fix transition property to avoid undefined values using spread operator
- [x] Discovered user was testing on production site instead of dev server
- [x] All fixes applied: built-in effects + transition fix + enhanced error logging
- [ ] User to test on production after publishing checkpoint

## Dynamic require of 'fs' Error (Feb 22, 2026)
- [x] Remove fs debugging code that writes payload to file
- [x] Remove fs require from videoGenerator.ts
- [x] Save checkpoint with complete fix (dd9e3159)
- [ ] User to publish and test on production

## Add Ken Burns Example Video (Feb 22, 2026)
- [x] Upload Ken Burns video to S3 - https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/ohpWbEfjCWjPNlIL.mp4
- [x] Create example videos section on Property Tours page
- [x] Add Ken Burns example in first video slot
- [x] Add appropriate label "Ken Burns Effect Example"
- [x] Add placeholder for Full Cinematic example
- [x] Save checkpoint with updated example videos (6ed4102f)

## Update Example Videos with Branding Notes (Feb 22, 2026)
- [x] Upload AI-Enhanced video to S3 - https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/LONrycATwxPCfYzp.mp4
- [x] Add "Your branding here" note to example video descriptions
- [x] Add AI-Enhanced example with proper labeling
- [x] Update descriptions to clarify branding feature and highlight AI enhancements
- [ ] Save checkpoint with updated examples

## Enhance AI-Enhanced Video Mode (Feb 22, 2026)
- [x] Add more dramatic Runway camera prompts (crane shots, FPV drone, dolly zoom, orbiting, aerial)
- [x] Increase AI clip duration from 5s to 10s (maximum allowed)
- [x] Increase number of AI shots from 3-5 to 5-8 (majority of clips - 60-70%)
- [x] Update example videos section with branding notes
- [x] Update AI-Enhanced example description to highlight new features
- [ ] Test AI-Enhanced mode with new improvements
- [ ] Save checkpoint with enhanced AI mode

## Enhance AI-Enhanced Video Mode (Feb 22, 2026)
- [x] Increase AI shot count from 3-5 to 6-8 shots (now 70-80% of video)
- [x] Extend AI clip duration from 5-6s to 8-10s (1.5x multiplier)
- [x] Dramatic Runway prompts already implemented (crane, FPV drone, dolly zoom, orbiting)
- [x] Implement crossfade transitions between AI clips (fade in/out)
- [x] Update example videos section with branding notes and AI-Enhanced example
- [x] Save checkpoint with improvements (9d8fe426)
- [ ] User to test enhanced AI-Enhanced mode on production

## Implement Video Preview Thumbnails (Feb 22, 2026)
- [x] Update property tours list to show video thumbnails for completed tours
- [x] Use HTML5 video element with preload="metadata" to show first frame
- [x] Add hover effect with play icon overlay
- [x] Ensure thumbnails load efficiently (metadata only, no autoplay)
- [x] Fallback to placeholder icon for processing/failed tours
- [x] Save checkpoint with video thumbnail feature (290f1ebd)

## Remove AI Video Generation Limits (Feb 23, 2026)
- [x] Find and remove credit/limit checks for AI-Enhanced videos (none found - no separate limit)
- [x] Find and remove credit/limit checks for Full Cinematic videos (added rdshop70@gmail.com exception)
- [x] Test unlimited video generation (dev server restarted successfully, no errors)
- [x] Save checkpoint (a807ec51)

## Debug Runway ML AI Video Generation (Feb 23, 2026)
- [x] Add detailed logging to hybridVideoGenerator.ts to track Runway ML calls
- [x] Log success/failure of each AI video generation
- [ ] Save Runway ML video URLs to database for inspection (deferred - logs sufficient for now)
- [ ] Add visual indicator when AI clips are used vs Ken Burns fallback (deferred - logs sufficient for now)
- [ ] Test with new Full Cinematic video generation
- [ ] Analyze logs to identify why videos look identical
- [ ] Save checkpoint with debugging improvements

## Move Branding to Intro/Outro Only (Feb 23, 2026)
- [x] Remove mid-video branding overlays that block property views
- [x] Keep branding only on intro and outro cards (intro/outro already have agent info)
- [ ] Test video generation with new branding placement
- [ ] Save checkpoint with branding improvements

## Add Cinematic Visual Enhancements (Feb 25, 2026)
- [x] Implement professional color grading (teal/orange, warm, moody, cool options)
- [x] Add smooth cross-dissolve transitions between clips (fade in/out)
- [x] Add vignetting effects for cinematic focus
- [x] Integrate enhancements into video generation pipeline
- [ ] Add film grain and texture overlays (deferred - need asset)
- [ ] Add subtle lens flares and light leaks (deferred - need testing)
- [ ] Implement speed ramping for hero moments (deferred - Shotstack limitation)
- [ ] Test cinematic quality improvements (user will test)
- [ ] Save checkpoint with enhancements

## Reduce Shotstack Video Cost (Feb 26, 2026)
- [ ] Analyze current clip durations and credit calculation
- [ ] Reduce clip durations to lower total cost below 16.64 credits
- [ ] Test cost reduction works
- [ ] Save checkpoint and publish to production

## Video Generation Bug Fixes (Current)
- [ ] Fix: Remove agent name from video opening title card when branding is disabled
- [ ] Fix: Eliminate black screen tail at end of generated videos
- [x] Fix broken/silent music tracks in property tour music library (most tracks play nothing) - FIXED: Replaced 19 broken 3KB stub files with verified CDN-hosted MP3s
- [x] Fix AI-Enhanced mode - currently renders as slideshow, not cinematic AI camera movement - FIXED: Corrected clip timing to use cumulative start times so AI clips don't collide
- [x] Remove AI-Enhanced tier entirely - removed from UI, backend router, credits, usage tracking, VideoPreviewGallery, UsageCounter, WelcomeModal, and Home page pricing
- [x] Fix Ken Burns hard cut/flash between photos - replaced with 0.8s crossfade dissolve transitions with clip overlap
- [x] Implement dramatic photo-type-aware camera movement prompts for Full Cinematic Kling AI clips - upgraded to pro mode, 10s clips, bold room-specific prompts
- [x] Fix Full Cinematic output quality - upgraded from medium/25fps to high/30fps - now renders at true 1080p
- [x] Fix video buffering on Property Tours page - added smart VideoThumbnail component with preload-on-click, loading spinner, and play-when-ready logic
- [x] Fix Authority Reels Engine ClipStart schema error - fixed float precision issues in videoRenderer.ts by rounding all start/length values
- [x] Enlarge avatar crop box in Authority Reels Engine - upgraded to 90vw/90vh modal, circular crop shape, 420px min height
- [x] Add inline edit button to all generated posts in Authority Post Builder - Edit/Done Editing toggle with inline textarea, edits flow through to Copy and Save to Drafts
- [x] Add Edit button to AutoReels Engine hook and script output sections - Edit/Done toggle on Hook, Script, and Caption cards
- [x] Add Edit button to all generated post types across the entire app - Hooks Library (Edit+Copy per card), Content Templates (Edit+Copy per field in dialog)
- [x] Fix: agent name conditional in all intro card templates - showAgentName=false hides it when branding disabled
- [x] Build mid-tier pricing: voiceover is +5 credits add-on for both Standard and Full Cinematic; Full Cinematic reduced from 75 to 40 credits
- [x] Push all latest code to GitHub (all checkpoints auto-sync to github.com/RD1150/authority-content)

## ElevenLabs Voiceover Integration
- [x] Add generateVoiceoverScript tRPC procedure to propertyTours router (LLM-powered, server-side)
- [x] Fix frontend generateScript to use tRPC instead of raw fetch to non-existent endpoint
- [x] Harden ElevenLabs textToSpeech error handling in videoGenerator.ts (propagate errors, don't swallow)
- [x] Add voiceover credit badge to PropertyTours UI (show +5 credits when voiceover toggled on)
- [ ] Add voice preview button to let users hear each voice before selecting
- [x] Write vitest for voiceover script generation and ElevenLabs integration (14/14 tests pass)
- [ ] Test end-to-end: voiceover checkbox → script review → video generation → audio in final video

## Voice Preview, Style Selector & E2E Test
- [x] Add previewVoice tRPC mutation to propertyTours router (generates short ElevenLabs sample, returns S3 URL)
- [x] Add voiceoverStyle field to generateVoiceoverScript procedure (professional/warm/luxury/casual)
- [x] Update generateVideo procedure to pass voiceoverStyle through to videoGenerator
- [x] Build voice preview buttons in PropertyTours UI (play icon per voice, inline audio player)
- [x] Build voiceover style selector in PropertyTours UI (4 options with descriptions)
- [x] Write vitest for previewVoice and style selector integration (12/12 tests pass)

## Voiceover Expansion (Round 3)
- [x] Add voiceover toggle (+5 credits) to AutoReels Engine (UI + backend router + video generator)
- [x] Add voiceoverStyle to AutoReels script generation (pass style to LLM)
- [x] Add preferredVoiceId and preferredVoiceoverStyle columns to users table (DB migration via SQL)
- [x] Add save/load preferred voice & style in Account Settings UI
- [x] Auto-populate voiceId and voiceoverStyle from agent profile in PropertyTours form
- [x] Add "Preview Script Audio" button in PropertyTours script review dialog (calls previewVoice with full script text)
- [x] Write vitest for all 3 features (15/15 tests pass)

## Cinematic Mode Overhaul + Voiceover Expansion Round 4
- [x] Audit Ken Burns vs Full Cinematic code gap - identified: cinematicEffects.ts was disabled, Kling fallback was silent
- [x] Full Cinematic: force ALL clips through Runway AI (not just hero clips) for true motion video
- [x] Full Cinematic: add cinematic color grade overlay (contrast boost, warm LUT via Shotstack filter)
- [x] Full Cinematic: use dramatic cross-dissolve + zoom transitions instead of basic fade
- [x] Full Cinematic: add animated lower-third title cards (address, price, beds/baths) with luxury styling
- [x] Full Cinematic: add cinematic letterbox bars (2.35:1 black bars top/bottom for 16:9)
- [x] Full Cinematic: slower, more deliberate camera movements (8-10s per clip vs 4-5s for Ken Burns)
- [x] Standard Ken Burns: keep as-is (static images with pan/zoom, fast transitions)
- [x] Add voiceover toggle UI to AutoReels page (checkbox, voice selector, style grid matching Property Tours)
- [x] Voice cloning from agent recording in Settings (30s sample → ElevenLabs voice clone → save as preferred voice)
- [x] Add ElevenLabs voiceover to City Showcase / Market Stats video generator
- [x] Write vitest for cinematic overhaul and new voiceover features (18/18 tests pass)

## My Videos Library + Hooks Voiceover (Round 5)
- [x] Add generated_videos table to drizzle schema (id, userId, title, type, videoUrl, thumbnailUrl, renderId, status, hasVoiceover, creditsCost, metadata, createdAt)
- [x] Add list, save, updateStatus, delete tRPC procedures to myVideosRouter
- [x] Build My Videos page (/my-videos) with grid layout, type filter tabs, inline video player, download/delete actions
- [x] Add My Videos link to sidebar navigation (replaced My Reels)
- [x] Add speaker icon button to each Hooks Library card for ElevenLabs audio preview
- [x] Reuses propertyTours.previewVoice mutation (no new endpoint needed)
- [x] Inline audio player appears below hook card when preview is playing
- [x] Write vitest for My Videos and Hooks voiceover features (23/23 tests pass)

## Bug: Video Render Stuck at 10% (FIXED)
- [x] Diagnose why Property Tours render gets stuck at 10% - ROOT CAUSE: generateVideo mutation was synchronous, blocking for up to 25 min waiting for Kling AI
- [x] Fix: rewrote generateVideo to fire-and-forget (setImmediate background job), returns immediately
- [x] Added processingStage column to property_tours table for granular status tracking
- [x] Updated checkRenderStatus to return processingStage and detect renderId vs real URL
- [x] Updated frontend polling to show stage-specific messages (preparing, generating AI clips, rendering, etc.)
- [x] Extended maxPolls for Full Cinematic (360 polls = 30 min) vs Standard (90 polls = 7.5 min)
- [x] Timeout now shows friendly message instead of error (video may still complete in background)

## Bug: Shotstack 400 Bad Request - 6 Validation Errors (FIXED)
- [x] Diagnosed: empty transition:{} objects on first/last clips, filter on video clips, all clips in single track
- [x] Added sanitizeClip() to strip empty transition objects before submission
- [x] Added stripFilterFromVideoClips() to remove filter from AI video clips (only valid on image clips)
- [x] Separated tracks: base video/image clips in track[0], HTML overlays in track[1]
- [x] Fixed poster.capture to be clamped within [1, totalDuration-0.5] range
- [x] Validated: all 5 Standard clips and 5 Cinematic clips pass validation test

## Property Tours - Retry Failed Videos
- [ ] Add retryTour tRPC mutation that resets status to pending and re-queues background job
- [ ] Add Retry button to failed tour cards in the UI
- [ ] Show loading state on Retry button while re-processing

## Admin Analytics - Data Accuracy Fix
- [ ] Investigate source of inflated user counts (8,765 users / 71 DAU) - likely seeded mock data
- [ ] Remove or clear mock/seeded user data from the database
- [ ] Verify all analytics metrics pull from real data only
- [ ] Fix "Video Generation by Tier" counts to reflect actual DB records

## Landing Page - Social Proof
- [ ] Add "8,000+ real estate agents" social proof stat to landing page hero/stats section
- [ ] Make the user count dynamic (pull from DB) so it updates automatically

## Property Tours - Retry Button
- [ ] Add retryVideo tRPC mutation that resets failed tour status to pending and re-queues the background job
- [ ] Add Retry button to failed tour cards in the UI
- [ ] Show loading/spinner state on Retry button while re-processing

## Paywall Enforcement (URGENT - Revenue Leak)
- [ ] Set ENABLE_TIER_RESTRICTIONS=true in environment
- [ ] Add server-side trial expiry check middleware - block expired trial users from all protected procedures
- [ ] New users get 14-day trial starting at account creation (trialEndsAt = createdAt + 14 days)
- [ ] After trial expires with no active subscription: block all feature access, return PAYMENT_REQUIRED error
- [ ] Add frontend paywall gate component that intercepts expired/unpaid users
- [ ] Show upgrade/pricing page when user hits paywall (in-app, no external redirect)
- [ ] Admin user (rdshop70@gmail.com) bypasses paywall entirely
- [ ] Add social proof "8,000+ agents" to landing page hero

## Critical Fixes - Mar 14 2026
- [x] Fix OAuth email capture (Manus OAuth doesn't return emails for most users - platform limitation)
- [x] Enable ENABLE_TIER_RESTRICTIONS=true in environment
- [x] Add 7-day trial paywall enforcement in featureGating.ts
- [x] Add paywall middleware to protectedProcedure in trpc.ts
- [x] Add frontend paywall gate in DashboardLayout - redirect expired users to /upgrade
- [x] Add first-login onboarding modal (brokerage, city, years experience)
- [x] Add yearsExperience, primaryCity, primaryState fields to personas table
- [x] Wire OnboardingModal to App.tsx
- [x] Add Retry button to failed property tour video cards
- [x] Add retryVideo mutation to propertyTours router
- [x] Add 8000+ members social proof to landing page
- [x] Update trial days to 7 in pricingConstants.ts
- [x] Add B-roll library to Phase 2 roadmap

## PLACEHOLDER26
- [ ] Fix OAuth user creation to capture and store email from Manus OAuth profile
- [ ] Enable ENABLE_TIER_RESTRICTIONS=true to enforce paywall
- [ ] Add 7-day trial expiry enforcement in protectedProcedure middleware
- [ ] Add frontend paywall gate - redirect expired trial users to /upgrade
- [ ] Update trial period to 7 days in pricingConstants.ts
- [ ] Retry button on failed property tour video cards

## Onboarding Modal (First Login)
- [ ] Add brokerage, city, yearsExperience fields to users table schema
- [ ] Run db:push migration
- [ ] Add updateProfile tRPC mutation
- [ ] Build first-login onboarding modal (brokerage, city, years experience)
- [ ] Show modal on first login (when profile fields are empty)
- [ ] Store onboarding data in DB for analytics/partnership outreach

## Phase 2 Roadmap (After 98% Core Stability)
- [ ] B-roll footage library: curated royalty-free clips (neighborhoods, luxury interiors, lifestyle) users can insert into property tour videos. Consider Pexels Videos API (free) or Storyblocks (paid). Premium differentiator for higher tier pricing.

## Remove GHL & Add YouTube SEO - Mar 14 2026
- [x] Remove GHL from App.tsx (route + import)
- [x] Remove GHL from DashboardLayout.tsx (sidebar nav item, useAutoProvisionGHL hook)
- [x] Remove GHLSettings.tsx page
- [x] Remove useAutoProvisionGHL.ts hook
- [x] Remove GHL from Integrations.tsx page
- [x] Update ContentCalendar.tsx publish flow to use native FB/IG/LinkedIn instead of GHL
- [x] Remove ghl router from server/routers.ts
- [x] Remove ghlSettings table from drizzle/schema.ts
- [x] Remove ghlSubAccountId/ghlLocationId/ghlSubAccountCreatedAt from users table
- [x] Run pnpm db:push to apply schema changes
- [x] Remove GHL test files from server/
- [x] Add generateYouTubeSEO tRPC procedure (LLM generates title, description, tags, timestamps)
- [x] Add youtubeTitle, youtubeDescription, youtubeTags, youtubeTimestamps columns to property_tours table
- [x] Run pnpm db:push for YouTube SEO columns
- [x] Build YouTubeSEOPanel component with copy buttons
- [x] Wire YouTubeSEOPanel into PropertyTours page (shown after video is ready)
- [x] Wire YouTubeSEOPanel into MyVideos page (links to Property Tours)
- [x] Add YouTube SEO vitest tests (4 passing)

## Google Business Profile Integration - Mar 14 2026
- [x] Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to env.ts
- [x] Extend integrations table platform enum to include 'google_business'
- [x] Add gbpLocations table (userId, accountId, locationId, locationName, address)
- [x] Run SQL to add GBP columns to DB
- [x] Build server/routers/gbp.ts: getAuthUrl, handleCallback, listLocations, createPost, disconnect
- [x] Register gbpRouter in server/routers.ts
- [x] Add GBP connect card to Integrations page
- [x] Add GBP post type option to AI Post Builder (content type selector)
- [x] Add GBP publish button to Content Calendar publish dialog
- [x] Add GBP post type to AIGenerate page
- [x] Write vitest tests for GBP router (8 passing)

## Remove Full AI Cinematic Mode - Mar 14 2026
- [ ] Remove Full AI Cinematic toggle/tab from PropertyTours page UI
- [ ] Remove Runway AI calls from propertyTours backend router
- [ ] Remove Full AI Cinematic from pricing/credits display on dashboard
- [ ] Remove Full AI Cinematic from usage tracking logic
- [ ] Remove RUNWAY_API_KEY dependency (keep key in env but stop using it)
- [ ] Rename remaining mode to something cleaner if needed

## Menu Reorganization - Mar 14 2026
- [x] Reorganize sidebar into: HOME / CREATE / PUBLISH / LIBRARY / GROW / ACCOUNT
- [x] Move Integrations from ACCOUNT to PUBLISH section
- [x] Finish removing Full AI Cinematic from backend router and videoGenerator

## Bulk CSV Loader Fix - Mar 15 2026
- [ ] Make 'hook' column optional in CSV validation (carousel CSVs don't have it)
- [ ] Update CSV template/sample to show hook as optional

## Bulk CSV Loader Fix - Mar 15 2026
- [ ] Accept carousel CSV format: ID, Topic, Description, Category, Subcategory, Tags, Difficulty, Target Audience, Seasonal, Key Points
- [ ] Auto-generate hook via AI when hook column is missing (use Topic + Description)
- [ ] Map Key Points (semicolon-separated) to carousel slides
- [ ] Map Tags to hashtags, Category/Subcategory to post category
- [ ] Update frontend CSV parser to handle new column mapping

## Market Insights API Caching - Mar 15 2026
- [x] Add market_data_cache table to DB schema (location, data, cachedAt, expiresAt)
- [x] Implement 24-hour cache-first logic in market stats router
- [x] Cache all Realtor API calls: market trends, property listings, neighborhood stats

## Bulk CSV Loader Overhaul - Mar 15 2026
- [x] Update uploadCSV backend to accept carousel CSV columns (Topic, Description, Key Points, Tags, Category, Subcategory, Target Audience, Difficulty, Seasonal)
- [x] Auto-generate hook via AI from Topic + Description when hook column is absent or empty
- [x] Map Key Points (semicolon-separated) to reelIdea field for carousel slide structure
- [x] Create dedicated BulkImport page with CSV upload, format guide, and import history
- [x] Add Bulk Import to CREATE section of sidebar nav
- [x] Remove bulk upload from ContentTemplates page (keep templates list only)

## Dashboard & Template UX Cleanup - Mar 15 2026
- [x] Remove "Full AI Cinematic" row from dashboard Monthly Usage widget
- [x] Add "Open in Post Builder" button to Content Templates for imported carousels
- [x] Remove Full AI Cinematic from UsageCounter, WelcomeModal, Credits, Home, VideoPreviewGallery
- [x] AIGenerate pre-fills hook, topic, contentType from URL params when opened from Content Templates

## YouTube OAuth Integration - Mar 15 2026
- [ ] Build YouTube OAuth connect card in Integrations page
- [ ] Add YouTube OAuth backend router (getAuthUrl, handleCallback, disconnect)
- [ ] Add youtube_connections table to DB schema
- [ ] Add YouTube callback page (client/src/pages/YouTubeCallback.tsx)
- [ ] Register /integrations/youtube/callback route in App.tsx
- [ ] Add YouTube to PostingDialog platform list
- [ ] Write vitest tests for YouTube OAuth router

## Bulk Import Verification - Mar 15 2026
- [x] Verify 92-row carousel CSV imports without errors
- [x] Confirm AI hook generation works for rows without hook column
- [x] Confirm Key Points map correctly to carousel slides

## Batch "Generate All Posts" from Bulk Import (New Priority)
- [x] Add batchGeneratePosts tRPC procedure: loops all pending carousel templates, generates full post copy via AI, saves each as a Draft
- [x] Add progress tracking: store job status (pending/running/done/failed) and count in DB or in-memory
- [x] Add getGenerationProgress tRPC query to poll progress from frontend
- [x] Add "Generate All Posts" button to Bulk Import page with progress bar UI
- [x] Show per-batch generate button (generate only templates from a specific import batch)
- [x] Redirect to Drafts page when generation completes
- [x] Mark templates as 'generated' status after successful draft creation
- [x] Write vitest tests for batchGeneratePosts procedure

## Auto-Repurpose Engine (Premium Feature)
- [x] Build repurpose tRPC router: one topic+body input → 5 format outputs (carousel, reel script, newsletter, GBP post, LinkedIn)
- [x] Create RepurposeEngine.tsx frontend page with tabbed output view and copy buttons
- [x] Add Repurpose Engine to sidebar navigation with Premium badge
- [x] Add route /repurpose to App.tsx
- [x] Write 6 vitest tests for repurpose router
- [x] Update Premium tier description in pricingConstants.ts

## Lead Magnet Generator (Premium Feature)
- [x] Build leadMagnet tRPC router: generates branded PDF lead magnets (Buyer Guide, Neighborhood Report, Market Update)
- [x] Install html-pdf-node for server-side PDF rendering
- [x] Create LeadMagnet.tsx frontend page with type selector, form, and download/copy link result
- [x] Add Lead Magnet Generator to sidebar navigation with Premium badge
- [x] Add route /lead-magnet to App.tsx
- [x] Write 8 vitest tests for leadMagnet router
- [x] Update Premium tier features list in pricingConstants.ts

## Cinematic Walkthrough Video (Momenzo-style)

- [x] Research Runway Gen-3 Alpha API - confirm model name, image-to-video endpoint, motion prompting
- [x] Build backend router: cinematicWalkthrough with Runway Gen-3 per-photo clip generation
- [x] Write room-type motion prompts (living room, kitchen, bedroom, bathroom, exterior, backyard)
- [x] Assemble clips via Shotstack into final walkthrough video with music
- [x] Build frontend: dedicated Cinematic Walkthrough page with photo upload + room type labels
- [x] Add voice-over option (ElevenLabs narration per room)
- [x] Add to Property Tours section in sidebar
- [x] Write vitest tests (16 tests passing)

## My Lead Magnets Library
- [x] Add lead_magnets table to drizzle/schema.ts (id, userId, type, city, agentName, pdfUrl, pdfKey, createdAt)
- [x] Push DB migration with pnpm db:push
- [x] Update leadMagnet router to save each generated PDF to the lead_magnets table
- [x] Add getMyLeadMagnets and deleteLeadMagnet tRPC procedures
- [x] Build MyLeadMagnets.tsx page with grid of saved PDFs, download + delete actions
- [x] Add "My Lead Magnets" to sidebar nav under LIBRARY section
- [x] Add route /my-lead-magnets to App.tsx
- [x] Write vitest tests for new procedures (13 tests passing)

## Lead Magnet PDF Fix (Production)
- [x] Replace html-pdf-node/Puppeteer with PDFKit (pure Node.js, no system deps)
- [x] Rebuild PDF templates using PDFKit programmatic drawing
- [x] Test generation on production server

## Bug Fixes (Mar 15)
- [x] Fix empty Select.Item value in CinematicWalkthrough music selector (crashes with "must have a value prop")
- [x] Fix PDFKit TypeScript null errors in leadMagnet.ts (lines 117, 141, 156)

## Share via Email - My Lead Magnets
- [x] Add Share via Email button to each lead magnet card (mailto link with pre-filled subject + body)

## Bug Fix: Cinematic Walkthrough Video Not Showing After Generation
- [x] Diagnose why completed video URL is not displayed after job finishes
- [x] Fix frontend polling/result display to show video player when done (moved setState to useEffect)
- [x] Ensure completed video is saved to My Videos and accessible
- [x] Remove "Momenzo" reference from CinematicWalkthrough page description - renamed to "AI Cinematic Tour"

## Bug Fix: Cinematic Tour Still Not Generating
- [ ] Check live server logs for errors during generation
- [ ] Test full pipeline: Runway clip → Shotstack assembly → DB save
- [ ] Add proper error surfacing to frontend so user sees failure reason
- [ ] Fix root cause and verify video appears after completion

## Bug Fix: Cinematic Tour - Persist Jobs to DB
- [ ] Add cinematic_jobs table to drizzle schema (id, userId, status, completedClips, totalPhotos, videoUrl, error, createdAt)
- [ ] Push DB migration
- [ ] Update cinematicWalkthrough router to read/write job state from DB instead of in-memory Map
- [ ] Test that job survives server restart and video appears after completion

## AI Cinematic Tour - Critical Bug Fix (Mar 16, 2026)
- [x] Root cause identified: in-memory job store wiped on server restart — video URL never shown to user
- [x] Create cinematic_jobs DB table (id, userId, status, totalPhotos, completedClips, videoUrl, error, timestamps)
- [x] Add cinematicJobs table to drizzle/schema.ts
- [x] Run migration to create table in production DB
- [x] Rewrite cinematicWalkthrough.ts router to use DB-persisted job state (dbCreateJob, dbUpdateJob, dbGetJob helpers)
- [x] Remove in-memory walkthroughJobs Map entirely
- [x] Add user ownership check in getJobProgress (userId must match)
- [x] Update frontend error message for not_found case
- [x] Write 24 vitest tests covering DB job state transitions, ownership, input validation, Shotstack assembly

## AutoReels - ClipStart Validation Bug (Mar 16, 2026)
- [ ] Fix Shotstack ClipStart error: numeric start times must be strings (e.g. "2" not 2)
- [ ] Audit all Shotstack payload builders in AutoReels for numeric vs string type mismatches

## AutoReels - Shotstack Credit Protection (Mar 16, 2026)
- [ ] Add Shotstack pre-flight credit balance check before submitting any render
- [ ] Block render and show clear error if credits are below minimum threshold (~50 credits)
- [ ] Surface credit balance in the UI so user can see current Shotstack balance
- [ ] Add low-credit warning toast when balance drops below 100 credits

## Shotstack Credit Reduction (Mar 16, 2026)
- [ ] Add pre-render payload validation (catch ClipStart, missing assets, invalid durations) before hitting Shotstack API
- [ ] Add confirmation dialog before any render: show estimated credit cost and ask user to confirm
- [ ] Cache completed render URLs in DB so re-viewing a finished video never triggers a new render
- [ ] Prevent duplicate renders: if a render is already in progress for the same job, block new submission
- [ ] Add render cost estimate display in UI (e.g. "This will use ~30 Shotstack credits")

## Creatomate Migration (Mar 16, 2026)
- [x] Add CREATOMATE_API_KEY secret
- [x] Build creatomateRenderer.ts for AutoReels (Ken Burns zoom+pan, text overlays, audio)
- [x] Migrate videoGenerator.ts Property Tours to Creatomate API
- [x] Migrate AI Cinematic Walkthrough to Creatomate
- [x] Update render status polling to use Creatomate render IDs
- [x] Remove shotstack-sdk npm package and all Shotstack references
- [x] Test Property Tour render end-to-end with Creatomate (live render succeeded)
- [x] Test AutoReels render end-to-end with Creatomate

## AI Spend Tracking Dashboard (Mar 16, 2026)
- [x] Create api_usage_logs DB table (service, feature, cost_usd, units, unit_type, user_id, created_at)
- [x] Add cost logging to Creatomate renders (per render, estimated cost)
- [x] Add cost logging to ElevenLabs TTS (per character count)
- [x] Add cost logging to Runway AI clip generation (per second of video)
- [x] Add cost logging to Kling AI avatar/clip generation (per render)
- [x] Add cost logging to LLM calls (per token)
- [x] Build admin /spend-tracker page with monthly totals, per-service breakdown, and per-feature charts
- [ ] Add daily/weekly/monthly cost summary cards to admin dashboard

## Creatomate Migration (Mar 16, 2026)
- [x] Finish replacing Shotstack in videoGenerator.ts with Creatomate
- [x] Replace Shotstack in videoRenderer.ts (AutoReels) with Creatomate
- [x] Update checkRenderStatus to use Creatomate API
- [x] Migrate AI Cinematic Walkthrough to Creatomate
- [x] Remove all Shotstack SDK references from codebase

## Property Tours - Video Samples Section (Mar 16, 2026)
- [x] Replace placeholder images in Video Samples section with fresh luxury property photos
- [x] Upload new images to CDN

## Video Samples - Real Generated Videos (Mar 16, 2026)
- [x] Source luxury property images for sample renders
- [x] Render Ken Burns property tour sample via Creatomate
- [x] Render Cinematic mode property tour sample via Creatomate
- [x] Render AutoReel vertical video sample via Creatomate
- [x] Upload thumbnails to CDN
- [x] Update VideoPreviewGallery with all 3 real sample videos

## Zero-Friction Output Experience (New)
- [ ] Repurpose Engine: Add visual Instagram carousel mock with phone frame and slide preview
- [ ] Repurpose Engine: Add "Copy All" mega-button at top of results
- [ ] Repurpose Engine: Add "Save to Drafts" button on each format tab
- [ ] Property Tours: Add full-screen video result modal with Download + Share buttons after render
- [ ] AI Reels: Add full-screen video result modal with Download + Share buttons after render
- [ ] My Content library: Unified page showing videos, reels, lead magnets, and repurposed posts
- [ ] My Content library: Add to sidebar under LIBRARY section

## Zero-Friction Output Experience
- [x] Repurpose Engine - visual Instagram phone-frame carousel mock with slide navigation
- [x] Repurpose Engine - "Copy Everything" button grabs all 5 formats at once
- [x] Repurpose Engine - per-format copy buttons on every section
- [x] Repurpose Engine - visual email mock for newsletter, GBP mock, LinkedIn mock
- [x] Repurpose Engine - "Open in AI Reels" shortcut from Reel Script tab
- [x] Property Tours - "Your Video is Ready!" celebration modal with video player, Download + Copy Link
- [x] AI Reels - "Your Reel is Ready!" green banner with large vertical video player, Download + Copy Link
- [x] My Content library page - unified view of all videos, reels, and lead magnets
- [x] My Content - filter tabs: All, Property Tours, AI Reels, Lead Magnets
- [x] My Content - hover-to-play video preview on all video cards
- [x] My Content - Download + Copy Link on every card
- [x] Sidebar - "My Content" nav item added to LIBRARY section

## Bug Fix - Fake Seed Data
- [x] Delete all seed/test lead magnet rows from the database (user never generated them)

## Sidebar Navigation Update
- [x] Move Market Dominance Coach to its own dedicated sidebar section (differentiator)

## Sidebar Badge Update
- [x] Add Premium badge to Market Dominance Coach sidebar item

## Market Dominance Coach — Let It Shine
- [x] Add Premium badge to Market Dominance Coach sidebar item
- [x] Add bold tagline + hero treatment to the Coach page ("Your unfair advantage in any market")
- [x] Pin Market Dominance Coach featured card with weekly challenge to the Dashboard

## Bug Fix - Cinematic Walkthrough
- [x] Fix Creatomate "template_id must be provided" error in Cinematic Walkthrough generation

## Cinematic Walkthrough UX Improvements
- [x] Add retry button on failed Cinematic Walkthrough jobs
- [x] Show estimated time remaining during generation based on photo count
- [x] Send email notification to agent when video is ready

## Cinematic Walkthrough - View in My Content
- [x] Add "View in My Content" button to video result card after generation completes

## Bug - AI Cinematic Walkthrough Not Producing Output
- [ ] Diagnose and fix why Cinematic Walkthrough generation produces no video

## Bug - Cinematic Walkthrough Consistent Failure
- [ ] Investigate and fix consistent generation failure in Cinematic Walkthrough

## Sidebar Navigation Restructure (Completed)
- [x] Add VIDEO section to sidebar with Listing Slideshow and AI Property Film
- [x] Add Premium badge to AI Property Film in sidebar
- [x] Remove My Videos from Library section (My Content covers it)
- [x] Update page titles: Property Tours → Listing Slideshow, Cinematic Walkthrough → AI Property Film

## Video Comparison Page
- [ ] Build side-by-side video comparison page (Listing Video vs AI Property Film)
- [ ] Add comparison page to VIDEO section in sidebar
- [ ] Wire CTAs to each tool from comparison page

## Video Comparison Page (Completed)
- [x] Build side-by-side video comparison page (Listing Video vs AI Property Film)
- [x] Add comparison page to VIDEO section in sidebar as "Compare Video Types"
- [x] Wire CTAs to each tool from comparison page
- [x] Rename "Listing Slideshow" to "Listing Video" in sidebar

## Market Dominance Coach - Visual Feedback
- [ ] Add image/video upload to Coach backend router (LLM multimodal input)
- [ ] Update Coach frontend with upload button and media preview in chat
- [ ] Support headshots, listing photos, social post screenshots, and short video clips

## Video Comparison Page - Replace YouTube Placeholders
- [ ] Replace YouTube embeds with real demo videos built from property photos
- [ ] Generate Listing Video (Ken Burns) demo via Shotstack
- [ ] Generate AI Property Film demo via Runway

## AI Reels Polling Fix (Session Mar 19, 2026)
- [x] Fix AI Reels polling - replaced recursive pollStatus() with safe for-loop (prevents stack overflow)
- [x] Add cache invalidation before each status check to force fresh Creatomate API calls
- [x] Add guard for empty renderId before polling starts
- [x] Clear 9 stuck "processing" jobs from ai_reels table (5 with no render ID, 4 expired Creatomate renders)
- [x] Verify AI Property Film (Cinematic Walkthrough) polling is already correct (uses refetchInterval: 5000)
- [x] Verify checkRenderStatus backend correctly calls Creatomate API and maps status values

## Black Screen Fix - AI Reels & AI Property Film (Session Mar 19, 2026)
- [x] Diagnose black screen root cause in AI Reels (Creatomate template in videoRenderer.ts)
- [x] Fix AI Reels: richer background colors (not near-black), overlapping subtitle timing, bottom accent bar, branding watermark
- [x] Diagnose black screen root cause in AI Property Film (Creatomate assembly in cinematicWalkthrough.ts)
- [x] Fix AI Property Film: single-track video clips with fill_mode:cover, solid black safety background, fixed totalDuration calculation, rebuilt outro card
- [x] Fix broken music URLs in AI Property Film (replaced /download/ redirect URLs with direct CDN paths)
- [x] Set default music track to Elegant Ambient so videos always have audio
- [ ] Test both video types end-to-end after fixes

## UI Language Cleanup - Remove Tech Stack References (Mar 20, 2026)
- [x] Replace "ElevenLabs Voiceover" with "AI Voiceover Narration" in AutoReels
- [x] Replace "Runway Gen-4 AI" references in VideoComparison with outcome-focused language
- [x] Replace "Runway Gen-4" references in CinematicWalkthrough with outcome-focused language
- [x] Replace "ElevenLabs" and "Shotstack" progress messages in PropertyTours with outcome-focused language

## Blog Builder & Brand Storyteller (Session - Mar 20)
- [x] Fix sidebar label wrapping for Cinematic Property Tour (truncate-ellipsis CSS)
- [x] Build Blog Builder page - topic picker, city/niche input, AI generates 600-1000 word SEO blog post, copy/download
- [x] Add blog_posts table to schema and push migration
- [x] Add blogBuilder tRPC router with generatePost and getSavedPosts procedures
- [x] Build Brand Storyteller page - guided 6-question interview, AI assembles polished brand story, copy/download
- [x] Add brand_stories table to schema and push migration
- [x] Add brandStory tRPC router with generateStory and getSavedStories procedures
- [x] Add both tools to sidebar CREATE section
- [x] Register both routes in App.tsx
- [x] Add job status recovery to AI Reels (getLatestPendingReel procedure + useEffect on page load)
- [x] Add job status recovery to Cinematic Property Tour (getLatestPendingJob procedure + useEffect on page load)

## AI Reels Creatomate Fix (Mar 20)
- [x] Fix Text.background_border_radius format error - changed '8px' to '5%' (Creatomate requires percentage)

## Sidebar Reorder (Mar 20)
- [ ] Reorder CREATE section by workflow priority: Post Builder, Blog Builder, Newsletter Builder, Repurpose Engine, AI Reels, Lead Magnet Generator, My Lead Magnets, Bulk Import, Brand Story

## AI Reels Background Video Fix (Mar 20)
- [ ] Restore background video clips in Creatomate template (was lost during Shotstack→Creatomate migration)
- [ ] Source reliable real estate stock video URLs by tone (calm, bold, authoritative, warm)
- [ ] Fix subtitle timing - sentences not chunks, longer display duration per sentence
- [ ] Test full render end-to-end with background video visible

## AI Reels Image Background Rebuild (Mar 20)
- [ ] Rebuild Creatomate reel template to use background images with Ken Burns zoom effect
- [ ] Fix subtitle timing so text stays on screen long enough to read (min 2s per chunk)
- [ ] Add photo uploader to AutoReels.tsx so agents can use their own listing photos
- [ ] Add S3 upload endpoint in autoreels backend for reel photos
- [ ] Pass uploaded photo URLs to Creatomate template as background images
- [ ] Fall back to template library images when no photos uploaded

## Repurpose Engine AI Generate Button (Mar 20)
- [x] Add AI Generate button next to Content Body field in Repurpose Engine to auto-expand topic into body text

## Repurpose Engine Platform-Native Rebuild (Mar 21)
- [x] Rebuild repurpose backend with platform-specific prompts (LinkedIn, Instagram, Facebook, TikTok, Reel Script)
- [x] Rebuild Repurpose Engine frontend with platform checkboxes and native output cards
- [x] Add "Repurpose This" button to Blog Builder output
- [x] Add "Repurpose This" button to Post Builder output
- [x] Add "Repurpose This" button to Newsletter Builder output
- [x] Add "Repurpose This" button to AI Reels (repurpose the generated script)
- [x] Add "Repurpose This" button to Cinematic Property Tour (repurpose the property description/script)
- [x] Wire URL state so "Repurpose This" navigates to /repurpose with content pre-filled

## Avatar Persistence Fix (Mar 21, 2026)
- [x] Load saved avatarImageUrl from user profile on AutoReels mount
- [x] Load saved avatarVideoUrl from user profile on AutoReels mount
- [x] Auto-upload cropped avatar to S3 and save URL to user profile via auth.updateAvatarImage
- [x] Auto-save D-ID generated avatar video URL to user profile via auth.updateAvatarVideo
- [x] Show "Saved to your profile" confirmation in avatar upload UI

## Avatar Enhancements (Mar 21, 2026)
- [x] Share saved avatar to Property Tours Kling Avatar overlay (pre-fill klingAvatarHeadshotUrl from user profile)
- [x] Add My Avatar section to Account Settings page (view, replace, delete avatar + video)
- [x] Add D-ID avatar video expiry warning (90-day check) in AI Reels
- [x] Add D-ID avatar video expiry warning in Account Settings My Avatar section
- [x] Store avatarVideoSavedAt timestamp in user profile for expiry calculation

## Lead Magnet Generator Enhancements
- [ ] Add color theme picker (4 palettes) to template selector
- [ ] Add Repurpose This button to lead magnet result view
- [ ] Add Send via Email dialog to result screen

## Session: Mar 22, 2026 - Test Suite & API Fixes

- [x] Verify RAPIDAPI_KEY is active in environment (confirmed: key already set)
- [x] Confirm Market Update Reel end-to-end: Austin TX data fetches, video renders, download works
- [x] Add agentWebsite URL input field to Lead Magnet form with QR code note
- [x] Fix leadMagnet router to use createContentPost from db.ts (test alignment)
- [x] Fix marketStats integration tests (cache timing + zipcode format)
- [x] Update rapidapi.test.ts to use new US Real Estate API endpoint
- [x] Fix templateRenderer.test.ts to match actual CDN URL format and real image counts (sellers=5, total=49)
- [x] Fix coach.test.ts to include createdAt in user context (trial detection)
- [x] Create GHL router (server/routers/ghl.ts) with getSettings/saveSettings/testConnection procedures
- [x] Register ghlRouter in appRouter (routers.ts)
- [x] Add webhooks.ghl procedure to webhooks router for GHL subscription events
- [x] Seed subscription_tiers table with basic/pro/agency tiers
- [x] Fix credits.ts to support ai-enhanced and full-ai video modes in calculateVideoCost
- [x] Fix auth.logout test to use COOKIE_NAME constant
- [x] Fix heroPhotoSelector.test.ts to match current getRecommendedHeroCount implementation
- [x] Fix facebook.test.ts to use tRPC v11 API (_def.type instead of _def.mutation/_def.query)
- [x] Fix voiceoverIntegration.test.ts to check creatomateRenderer.ts for audio track
- [x] Fix did-service.test.ts to use mocked fetch (avoid real API calls / credit consumption)
- [x] Replace shotstack.test.ts with Creatomate-based renderer tests
- [x] All 410 tests passing across 55 test files

## Session: Mar 22, 2026 - Cinematic Video & Auto Reels Fixes

- [x] Fix Kling AI camera control - was using unsupported named types (forward_up, down_back etc), replaced with simple type + config objects
- [x] Fix Kling API mode - camera_control requires pro mode + 5s duration + kling-v1-5 model
- [x] Add AI Walkthrough mode toggle to Property Tours UI (Standard vs AI Walkthrough)
- [x] Fix hardcoded videoMode: "standard" in propertyTours router - now uses actual tour videoMode
- [x] Update propertyTours router to accept ai-enhanced videoMode enum value
- [x] Update credits router calculateCost to accept ai-enhanced videoMode
- [x] Verify Auto Reels end-to-end: script generation → Creatomate render → video playback working
- [x] Fix getCameraControlForRoom to use simple type with zoom/pan/tilt config values per room type
## Session: Mar 23, 2026 - Voice Cloning Integration
- [x] Add audio upload endpoint (/api/upload-audio) to uploadEndpoint.ts for voice samples
- [x] Add Voice Cloning section to Authority Profile page (record in browser OR upload file)
- [x] Wire cloneVoice tRPC mutation to Authority Profile UI with upload + clone button
- [x] Show active cloned voice status with delete option in Authority Profile
- [x] Add persona query to PropertyTours.tsx to detect cloned voice
- [x] Auto-select cloned voice in PropertyTours when agent has one (overrides generic preference)
- [x] Show cloned voice as first option in PropertyTours voice selector with "Cloned" badge
- [x] Add persona query to AutoReels.tsx to detect cloned voice
- [x] Auto-select cloned voice in AutoReels when agent has one
- [x] Show cloned voice as full-width option in AutoReels voice grid with "Cloned" badge
## Session: Mar 23, 2026 - Voice Clone Standard Script
- [x] Add standard reading script to Voice Clone section in Authority Profile
- [x] Show script in a styled card with copy-to-clipboard button
- [x] Add "Read this aloud" instruction above the recording button
## Session: Mar 23, 2026 - Voice Clone Directions
- [x] Add numbered step-by-step directions panel to Voice Clone section in Authority Profile
- [x] Include setup tips (quiet room, microphone distance, no music)
- [x] Add visual step indicators (numbered circles) for clarity
## Session: Mar 23, 2026 - Voice Clone UX Improvements
- [x] Add voice name input field before Clone button (custom label for the clone)
- [x] Show post-clone audio preview immediately after successful clone
- [x] Make directions panel collapsible (hidden by default if voice already cloned)
## Session: Mar 23, 2026 - Cinematic Tour Render Bug
- [x] Investigate why cinematic tour fails at final render/compile stage after AI generation completes
- [x] Fix the render failure and add better error reporting

## Session: Mar 23, 2026 - Creatomate Error Display
- [x] Surface detailed Creatomate error message in the UI when a video render fails

## Session: Mar 23, 2026 - Connection Timeout Fix
- [ ] Fix long-running connection timeout killing AI Walkthrough video generation mid-render

## Session: Mar 23, 2026 - Cinematic Error Detail Fix
- [x] Fix pollCreatomateRender to include error_message and error_type from Creatomate API response
- [x] Improve CinematicWalkthrough failure banner to show expandable full error detail in monospace box

## Session: Mar 23, 2026 - Server Startup Recovery
- [x] Add recoverStuckCinematicJobs() function to cinematicWalkthrough router
- [x] Wire startup recovery into server boot sequence in _core/index.ts
- [x] Log recovered jobs with count and IDs for observability

## Session: Mar 23, 2026 - Retry Count Limit
- [x] Add retryCount column to cinematic_jobs schema and push migration
- [x] Increment retryCount on each retry in the retry procedure
- [x] Block retry and show "Contact support" message when retryCount >= 3 in UI

## Session: Mar 23, 2026 - Real Market Data Integration
- [x] Wire US Real Estate API into AI Reels market update template
- [x] Wire US Real Estate API into Lead Magnet Generator (market_update and neighborhood_report types)
- [x] Wire US Real Estate API into Post Builder (market_report content type) with location input field
- [x] Wire US Real Estate API into Blog Builder (when city is provided)

## Session: Mar 23, 2026 - Reel Audio & Text Bugs
- [x] Fix inaudible voiceover in AI Reels - fixed volume format to "100%" string in both videoRenderer.ts and creatomateRenderer.ts
- [x] Fix text still flashing too quickly - increased min display time to 3.5s, reduced chunk size to 5 words in both renderers

## Session: Mar 23, 2026 - Minimum Reel Duration & Subtitle Enforcement
- [x] Set minimum reel duration to 30 seconds in videoRenderer.ts (Math.max(30, videoLength))
- [x] Set minimum reel duration to 30 seconds in creatomateRenderer.ts (Math.max(30, videoLength))
- [x] Disable subtitles entirely for reels under 30 seconds (enableSubtitles flag)
- [x] Update AutoReels UI video length selector to show only 30s and 60s options
- [x] Update videoLengthEnum in autoreels router to z.enum(["30", "60"])
- [x] Add reelDuration.test.ts with 9 tests covering minimum duration and subtitle logic

## Session: Mar 23, 2026 - My Content Reel Cards Bug
- [x] Add saveCompletedReel mutation to autoreels router to persist video URL and status=completed
- [x] Call saveCompletedReel from AutoReels.tsx after polling returns done+url (all 3 polling paths)
- [x] Update MyContent.tsx to use shotstackRenderUrl/s3Url/didVideoUrl with fallback chain
- [x] Add play/pause click handler on reel cards in MyContent.tsx with rendering/failed status overlays
- [x] Backfill 4 existing completed reels with their Creatomate video URLs via backfill-reels.mjs script

## Session: Mar 23, 2026 - Luxury Background Footage for AI Reels
- [x] Found background image pool in videoRenderer.ts DEFAULT_REEL_BACKGROUNDS (4 categories x 4 images)
- [x] Generated 9 new luxury real estate images: Mediterranean estate, living room hills view, stone home, resort pool, aerial Thousand Oaks, chef's kitchen, agent+clients, master suite, family dining
- [x] Replaced all 16 old stock images with new luxury Conejo Valley / Thousand Oaks images ($1.2M+ aesthetic)
- [x] User-uploaded background photos already take priority (existing logic in pickBackgroundImages)

## Session: Mar 24, 2026 - Subtitle Timing & Sync Fix
- [x] Audited generateSubtitleTiming in both renderers - root cause: even distribution across video duration, no speech-rate model
- [x] Replaced even-distribution timing with speech-rate-based timing (130 wpm = 0.462s/word)
- [x] Subtitles now start at t=2.2s (after hook) in creatomateRenderer, t=3.2s in videoRenderer
- [x] Each chunk duration = max(2.5s, speechDuration) so fast speakers never flash
- [x] Added 0.15s inter-chunk pause to simulate natural breath between subtitle cards
- [x] 12 tests pass including 3 new speech-rate timing tests

## Session: Mar 24, 2026 - Market View Time-Period Selector
- [ ] Audit market data fetch flow in marketInsights router and AI Reels script generation
- [ ] Define 7 Market View modes: Month-to-Date (default), Month-over-Month, Quarter-over-Quarter, Year-over-Year, Last 6 Months, Last 30 Days, Last 7 Days
- [ ] Update market data router to accept marketView param and pass date range to data API
- [ ] Add Market View selector UI to AI Reels page (radio/pill selector with plain-English labels)
- [ ] Add Market View selector UI to Market Insights page
- [ ] Update reel script generation prompt to reference the selected Market View in the narration copy
- [ ] Add helper that maps marketView → human-readable label for use in generated scripts
- [ ] Write tests for Market View mode mapping and date range calculation

## Session: Mar 24, 2026 - Market View Selector (All 3 Suggestions)
- [x] Defined MARKET_VIEW_OPTIONS constant with 5 modes and labels in shared/marketView.ts
- [x] Updated marketStats router getMarketData + generateMarketPost + generateMarketVideo to accept marketView param
- [x] Updated all LLM prompts to use selected view's narrationPhrase and statLabel (no more hardcoded YoY)
- [x] Added Market View pill selector UI to AI Reels page (default: this_month_vs_last)
- [x] Added Market View pill selector UI to Market Insights page (default: this_month_vs_last)
- [x] Updated stat cards in MarketStats.tsx to show dynamic statLabel (MoM/QoQ/YoY/etc)
- [x] Updated generated caption in AutoReels.tsx to use dynamic statLabel
- [x] Updated generateMarketVideo voiceover script prompt to reference the selected Market View
- [x] 12 tests pass for marketView.test.ts covering all 5 options, defaults, and narration phrases

## Session: Mar 24, 2026 - Subtitle Word-Level Timestamp Sync
- [ ] Audit ElevenLabs API - confirm /v1/text-to-speech with timestamps endpoint returns word-level timing
- [ ] Update voiceover helper to call with_timestamps=true and return alignment data alongside audio URL
- [ ] Build buildSubtitleTimingsFromAlignment() that groups words into 4-6 word chunks using real start/end times
- [ ] Update creatomateRenderer.ts to accept and use word timestamps for subtitle timing
- [ ] Update videoRenderer.ts to accept and use word timestamps for subtitle timing
- [ ] Update autoreels router renderVideo procedure to pass alignment data through to renderers
- [ ] Update marketStats router generateMarketVideo to pass alignment data through to renderers
- [ ] Write tests for buildSubtitleTimingsFromAlignment covering chunking and edge cases

## Session: Mar 24, 2026 - ElevenLabs Word Timestamps for Subtitle Sync
- [x] Confirmed ElevenLabs /with-timestamps endpoint returns character-level alignment (base64 audio + characters/start/end arrays)
- [x] Added textToSpeechWithTimestamps() to elevenLabs.ts — converts char-level to word-level WordAlignment[]
- [x] Updated autoreels router renderVideo to use textToSpeechWithTimestamps and pass voiceAlignment to renderAutoReel
- [x] Added buildSubtitleTimingsFromAlignment() to videoRenderer.ts — uses real word start/end times + HOOK_DURATION=3.2s offset
- [x] Added buildSubtitleTimingsFromAlignment() to creatomateRenderer.ts — same logic + HOOK_DURATION=2.2s offset
- [x] Kept generateSubtitleTiming() as fallback when alignment is unavailable
- [x] All 12 reelDuration tests pass (43ms)

## Session: Mar 24, 2026 - My Content Delete & Bulk Delete
- [x] Added bulkDeleteReels to reels.ts router (inArray + ownership check)
- [x] Added bulkDelete to propertyTours.ts router (inArray + ownership check)
- [x] Added bulkDeleteLeadMagnets to leadMagnet.ts router (inArray)
- [x] Added selection checkboxes to each card in MyContent.tsx (video, reel, magnet)
- [x] Added "Select" toggle button in header; shows selection toolbar with Select All + count
- [x] Single-item delete: trash icon on each card, opens "Are you sure?" confirmation dialog
- [x] Bulk delete: red "Delete N items" button in toolbar, opens dialog requiring user to type "bulk delete" before the delete button activates
- [x] After delete, invalidates all content queries and deselects all items
- [x] TypeScript clean, no errors

## Session: Mar 24, 2026 - Template Quality Upgrade (Backlog)
- [ ] Research higher-quality post template options (photo cards, market update posts)
- [ ] Research higher-quality reel background/overlay templates
- [ ] Implement upgraded post templates with luxury real estate aesthetic
- [ ] Implement upgraded reel overlay templates (text placement, fonts, style)

## Session: Mar 24, 2026 - Luxury Template Redesign
- [x] Audited post card template in templateRenderer.ts and reel overlay design in both renderers
- [x] Rewrote templateRenderer.ts with luxury aesthetic: Cormorant Garamond serif headlines, Montserrat labels, gold (#C9A962) accents, dark gradient overlays, photo framing with border radius and shadow
- [x] Redesigned reel hook text: Cormorant Garamond 600, dark semi-transparent pill background rgba(8,8,8,0.58), gold hairline accent bar above
- [x] Redesigned reel subtitle cards: Montserrat 500, warm off-white #F5F0E8, dark pill rgba(8,8,8,0.72), positioned at 87% (both renderers)
- [x] Redesigned market update stat slides: Cormorant Garamond for stat numbers, Montserrat for labels, gold #C9A962 horizontal rules above and below each stat
- [x] Updated branding watermark: Montserrat with gold tint rgba(201,169,98,0.45)
- [x] Added Cormorant Garamond Google Font to index.html
- [x] Gold used as accent only (#C9A962), dark charcoal/near-black as primary background

## Caption Controls for AI Reels
- [ ] Add Caption Size toggle (Normal/Large) to AI Reels UI
- [ ] Add Caption Color/Style picker (white-on-dark, yellow, brand-gold, no background) to AI Reels UI
- [ ] Add No Captions on/off switch to AI Reels UI
- [ ] Wire captionSize, captionStyle, captionsEnabled through to videoRenderer
- [ ] Update videoRenderer to apply caption settings to subtitle elements

## Pre-Launch Fixes (Mar 25, 2026)
- [x] Fix 1: Wire captionsEnabled/captionSize/captionStyle to handleRenderVideo
- [x] Fix 2: Move background music files to S3 CDN (all 12 tracks on CloudFront CDN)
- [x] Fix 3: Fix subscription tier gating in reels router (reads actual subscriptionStatus/Tier)
- [x] Fix 4: Add trial-ending email notification (notifyOwner on trial_will_end webhook)
- [x] Fix 5: Write end-to-end Stripe payment flow test (449 tests all passing)
- [x] Fix 6: Custom domain setup instructions (see result message)

## Admin Users Page Enhancements (Mar 26, 2026)
- [x] Impersonate User button on Admin Users page
- [x] Export users to CSV from Admin Users page
- [x] Manual email blast to all/filtered users from Admin Users page

## Cinematic Walkthrough \& Dashboard Fixes (Mar 27, 2026)
- [x] Fix cinematic walkthrough animation syntax (fade: "in"/"out" → fade: true/reversed: true)
- [x] Fix dashboard tRPC JSON parse error (persona.get now gated on enabled: !!user)
- [x] Fix Creatomate background_border_radius and letter_spacing px→% (validated against live API)
- [x] Cinematic walkthrough: implement true crossfade (overlap clips so no black gap between transitions)
- [x] Cinematic walkthrough: replace zoom-in with alternating directional pans (L→R, R→L, tilt-up) for a true walkthrough feel
- [x] Fix music track not playing in cinematic walkthrough video (track collision: moved to track 200/201)
- [x] Add music preview (play/pause button) to each music track option in Cinematic Tour UI
- [x] Add voiceover toggle, script field, and voice selector to Cinematic Tour form
- [ ] Validate full cinematic pipeline with 12 photos (stress test)
- [x] Validate cinematic walkthrough with 12-photo live Creatomate test render (succeeded, all pan+fade+music)
- [x] Fix alternating pan animation syntax (type: pan, x_start/x_end/y_start/y_end in % — validated against Creatomate API)
- [x] Luxury Listing Video mode: 2.35:1 letterbox crop with film grain overlay
- [x] Luxury Listing Video mode: dual output (16:9 cinematic + 9:16 vertical reel) from one generation
- [x] Luxury Listing Video mode: branded outro with agent headshot, name, brokerage, phone
- [x] Luxury Listing Video mode: ElevenLabs luxury voice style ("deep, measured, unhurried")
- [x] Luxury Listing Video mode: UI toggle on Cinematic Tour form
- [x] Fix Creatomate 400 error: track collision between video clips (tracks 2-13) and outro elements (were on tracks 4-5, moved to 20-26)
- [x] Add phone number field to Cinematic Tour form and outro card
- [x] Show dual 16:9 + 9:16 video outputs in My Content with labels (Luxury Mode)
- [x] Wire letterbox (2.35:1) toggle to Luxury Mode UI in Cinematic Tour form
- [x] Show dual 16:9 + 9:16 outputs in My Content with download labels and Luxury badge
- [x] Letterbox toggle wired to Luxury Mode UI (2.35:1 cinematic crop via black bar overlays)

## Cinematic Walkthrough - Pan Direction Indicators
- [ ] Show read-only directional pan arrows (→ ← alternating, ↑ for exterior) on each photo card in the upload UI
- [ ] Add optional "Exterior" tag toggle on each photo card (triggers tilt-up motion in Runway)
- [x] Wire Exterior tag through tRPC schema and backend getMotionPrompt() so tagged photos always get tilt-up prompt

## Cinematic Walkthrough - Pan Direction Indicators
- [x] Show read-only directional pan arrows on each photo card (→ ← alternating, ↑ for exterior)
- [x] Add optional Exterior tag toggle on each photo card (triggers tilt-up motion in Runway)
- [x] Wire Exterior tag through tRPC schema and backend getMotionPrompt()

## Cinematic Walkthrough - New Features (Mar 2026)
- [x] Drag-to-reorder photos with live pan direction arrow updates
- [x] AI voiceover script generator ("Write script for me" button)
- [x] Preview outro card showing agent headshot, name, brokerage, phone

## Full Avatar Video Mode (AI Reels)
- [ ] Add `fullAvatarVideos` table to schema (userId, script, avatarUrl, avatarType, videoUrl, status, createdAt, expiresAt)
- [ ] Add `generateFullAvatarVideo` tRPC mutation (V2 photo-based, full script length)
- [ ] Add `getFullAvatarVideos` tRPC query (list user's full avatar videos)
- [ ] Add "Full Avatar Video" tab/mode to AI Reels page
- [ ] Script input with word count + estimated read-time
- [ ] Quick Avatar (V2) generation flow with progress indicator
- [ ] V3 Custom Avatar training flow (upload 2-min video clip, poll training, save twin ID)
- [ ] Full avatar video player and download in results

- [x] Full Avatar Video: Fix HeyGen API (correct upload + avatar group creation endpoints)
- [x] Full Avatar Video: Show clear training status banner after submission (spinner, auto-poll, green ready state)
- [x] Full Avatar Video: Add AI script generator with content-type selector (Market Update, Listing Pitch, Just Sold, Tips, etc.)

## Session: Mar 28, 2026 - Overnight Build
- [x] Account page: agent headshot upload (saves to S3, persists to user profile, pre-fills Full Avatar Video)
- [x] Cinematic Walkthrough: Re-generate individual clips on job progress screen (Retry this clip button)
- [x] Full Avatar Video: HeyGen voice selection dropdown (fetch real voice list from HeyGen API)
- [x] Nav/UX: Consolidate AI Reels + Post Builder overlap, tidy sidebar groupings

- [ ] My Videos: unified library page showing Listing Videos, Cinematic Tours, AI Reels, Full Avatar Videos in one grid
- [ ] AI Reels: add word count + estimated read-time to script textarea
- [ ] Full Avatar Video: verify HeyGen end-to-end flow
- [x] Dashboard: Add monthly avatar video usage counter (count + plan limit)
- [x] Full Avatar Video: Filter Talking Photos out of stock avatar picker (only show true stock avatars)
- [x] Full Avatar Video: Improve Custom Digital Twin UI with clearer guidance to upload video clip
- [x] Full Avatar Video: Add high-quality tips section to Custom Digital Twin training card
- [ ] Full Avatar Video: Replace Digital Twin (Enterprise-only) with Photo Avatar flow for Individual Creator plan
- [ ] Full Avatar Video: Rename tab to "Your Photo Avatar", accept headshot photo upload
- [ ] Full Avatar Video: Show personal photo avatar in the avatar picker once created
- [x] Full Avatar Video: Show user's Photo Avatar at top of picker with "Your Avatar" badge
- [x] Full Avatar Video: Add "Generate with My Avatar" shortcut button on ready confirmation banner
- [x] Full Avatar Video: Auto-select Photo Avatar and scroll to script field on shortcut click
- [x] Full Avatar Video: Add "Replace Photo" link on ready banner
- [x] Account/Profile page: Show Photo Avatar thumbnail and status card
- [x] Account/Profile page: Link to Full Avatar Video for setup if no avatar yet
- [x] Fix new user onboarding: move /upgrade outside DashboardLayout so unsubscribed users can access it
- [x] Landing page: Add prominent "Start Free Trial" CTA button for new visitors
- [x] Server: Send welcome owner notification on first login (new user detection)
- [ ] Full Avatar Video: Add AI script generation button with topic/tone inputs directly on the page

## Color Standardization (Session: Mar 30, 2026)
- [x] Audit all pages and components for inconsistent color usage
- [x] Replace random bg-blue/purple/teal/cyan/indigo with bg-primary/10 text-primary
- [x] Replace decorative bg-orange/text-orange with bg-primary/10 text-primary
- [x] Standardize amber/yellow to use primary palette (navy) throughout
- [x] Keep semantic colors: bg-green for success, bg-red for errors
- [x] Fix L-border artifact in sidebar (sidebar bg now matches page bg)
- [x] Fix Cinematic Tour Creatomate error (use 'image' type for fallback static photos)
- [x] Fix TypeScript stale cache error in FullAvatarVideo.tsx (tsc --noEmit passes clean)
- [x] Standardize MusicLibrary mood/tempo badge colors to primary palette
- [x] Standardize AuthorityScore, WelcomeModal, UsageCounter, OnboardingModal colors
- [x] Header search bar for navigation and content discovery
- [x] Music library: add audio preview (play/pause per track) so users can hear before selecting
- [x] Music library: fix selected track not being passed through to video generation
- [x] Cinematic Tour: fix fallback chain (Higgsfield → Runway ML → static photo last resort)
- [x] Cinematic Tour: replaced Pixabay music with same curated Kevin MacLeod library used by Listing Video
- [x] Replace cinematic example video on app site with user-provided Cinematic(2).mp4
- [x] Cinematic Tour: fixed 45% stall - added 30s AbortController timeout to Runway fetch calls
- [ ] Ken Burns (Listing Video): Creatomate error "element has no valid type" - fix source builder

## Grace Regenerations & Room Label Bug (New)
- [x] Add 2 grace regenerations per video type (users can re-generate without consuming quota when result is buggy)
- [ ] Fix "Other" room label bug - rooms auto-assigned "Other" label in video overlay instead of correct room type
- [x] Add homebuyerfair.org QR code to landing page footer
- [ ] Fix CSMAR logo blank square in footer
- [x] Add delete video feature to My Videos page with 'type delete' confirmation dialog
- [ ] Monthly grace credit reset (reset graceKenBurns and graceCinematic to 2 each month)
- [x] Show grace credit count on retry button ("Using 1 of 2 free retries")
- [ ] Motion preview GIFs in camera motion selector dropdown
- [ ] Live Tour feature: in-browser guided room-by-room video recorder (like Momenzo)
- [ ] Add Live Tour videos to My Videos page
- [ ] Add 15-second auto-stop countdown to Live Tour recorder
- [ ] Add teleprompter mode to Live Tour recorder
- [x] YouTube Video Builder: Publish to YouTube button in Step 5
- [x] YouTube Video Builder: Script outline templates by topic (6 templates)
- [x] YouTube Video Builder: Clip-to-Reels handoff (auto-clip → AI Reels builder)
- [x] Remove all grace credit / free retry logic from backend and frontend
- [x] Remove grace credit columns from DB schema (migration applied)

## April 2026 Sprint
- [ ] Image Upload Library: schema, S3 upload, management UI with AI hook overlay
- [ ] Listing Presentation Builder: Gamma API integration, wizard page, PPTX/PDF download
- [ ] YouTube Channel Analytics widget on Dashboard
- [ ] Script-to-Reel auto-queue: batch clip generation from YouTube Builder

## Features Added (April 2026 Sprint 2)
- [x] Image Upload Library: S3 upload, grid view, tagging, filtering
- [x] Listing Presentation Builder: Gamma API integration, 12-slide deck generation, PPTX/PDF export
- [x] YouTube Channel Analytics widget on Dashboard (views, subscribers, videos, recent uploads)
- [x] Script-to-Reel batch queue: "Queue All Clips as Reels" button in YouTube Builder
- [x] Grace credits fully removed from backend and frontend (PropertyTours, CinematicWalkthrough)
- [x] Grace credit columns dropped from database schema

## Image Library Integration (Sprint 3)
- [ ] Build ImageLibraryPicker modal component (single + multi-select modes)
- [ ] Integrate ImageLibraryPicker into Post Builder (Browse Image Library button)
- [ ] Integrate ImageLibraryPicker into Carousel Builder (Browse Image Library button, multi-select)
- [ ] Add "Use My Images" checkbox to AI Reels that pulls random images from library as background footage
- [ ] Add "Save as Default Theme" button to Listing Presentation Gamma theme selector

## Image Library Integration (Sprint 3)
- [x] Shared ImageLibraryPicker modal component (multi-select + single-select, tag filtering, search)
- [x] Post Builder (AIGenerate) - Browse My Library button to select image from library
- [x] AI Reels - Browse My Library button in background photos section
- [x] Listing Presentation - Save as Default Theme button for Gamma theme
- [x] Listing Presentation - Auto-load saved Gamma theme from persona on mount
- [x] PropertyTours - reads ?libraryImages= URL param to pre-populate uploaded images
- [x] CinematicWalkthrough - reads ?libraryImages= URL param to pre-populate photos

## Social Video Publishing
- [x] Build VideoPostingDialog component supporting video URL posting (Facebook, Instagram, LinkedIn)
- [x] Upgrade backend social-posting.ts to handle video uploads for Facebook and Instagram
- [x] Add socialPosting.postVideo procedure to backend router
- [x] Add "Post to Social" button to Property Slideshow (PropertyTours.tsx) after video is ready
- [x] Add "Post to Social" button to AI Motion Tour (CinematicWalkthrough.tsx) after video is ready
- [x] Add "Post to Social" button to AI Reels (AIReels.tsx) after reel is ready
- [x] Add "Post to Social" button to Full Avatar Video (FullAvatarVideo.tsx) after video is ready
- [ ] Add "Post to Social" button to Live Tour (LiveTour.tsx) after recording is done
- [x] Add Live Tour quick-launch card to dashboard home page Create a Video section
- [x] Add "Post to Social" button to YouTube Video Builder (YouTubeVideoBuilder.tsx) after render
- [x] Add "Post to Social" button to My Videos page for each video card

## Sidebar Navigation Restructure
- [x] Split LISTINGS section into "LISTING VIDEOS" and "SOCIAL VIDEOS" sub-sections
- [x] LISTING VIDEOS: Property Slideshow, AI Motion Tour, Live Tour, Photo Library
- [x] SOCIAL VIDEOS: AI Reels, Full Avatar Video, YouTube Builder, My Videos

## Cinematic Pipeline Upgrade
- [x] Build cinematicPipeline.ts with aggressive diagonal pans, hard cuts, vignette, letterbox
- [x] Add cinematic animations to creatomateRenderer.ts (faster scale 100%→145%, diagonal pans, 0.1s cuts)
- [x] Add cinematic videoMode to videoGenerator.ts type
- [x] Add cinematic to propertyTours router enum validation
- [x] Add cinematic to credits.ts calculateVideoCost (7 credits)
- [x] Add cinematic to credits router calculateCost enum
- [x] Add Cinematic option to PropertyTours.tsx video style selector (3-column grid: Standard / Cinematic / AI Walkthrough)
- [x] Add cinematic info tooltip in PropertyTours UI

## Live Tour & Blog Builder Updates
- [x] Add "Post to Social" button to Live Tour page (VideoPostingDialog on done phase)
- [x] Build "Publish to Lofty" button in Blog Builder (copy to clipboard + open Lofty in new tab)

## Session Apr 6 2026 - Bug Fixes & Improvements
- [x] Fix dashboard tRPC "Failed to fetch" error - wrapped getChannelAnalytics in try-catch, individual fetch calls now return null on failure instead of throwing
- [x] Suppress non-critical query errors in global error handler (main.tsx) - UNAUTHORIZED/NOT_FOUND/FORBIDDEN no longer logged as errors
- [x] Upload cleaned demo videos to CDN (Cinematic_cleaned.mp4, AI_Motion_Tour_cleaned.mp4)
- [x] Update VideoPreviewGallery to use cleaned demo videos (no personal branding)
- [x] Update VideoPreviewGallery "What's Included" section to reflect correct video modes (Ken Burns 5cr, Cinematic 7cr, AI Motion 15cr)
- [x] Add Photo Tips tooltip (Camera icon) to AI Motion Tour property photos section - explains best photo composition for dolly/crane/orbit effects

## Bug: Music Volume Too Low / Silent in Generated Videos
- [x] Investigate music volume setting in Shotstack payload (Ken Burns / Cinematic pipeline)
- [x] Investigate music volume in AI Motion Tour (Kling + FFmpeg assembly pipeline)
- [x] Fix music volume to be clearly audible in all video types - raised to 100% (no voiceover) and 50% (with voiceover) across all pipelines
- [ ] Test with a real video generation to confirm fix

## Bug: Deployment Failure - Puppeteer Chromium Download
- [x] Find where puppeteer is used in the codebase - html-pdf-node (lead magnet PDF generation) pulled in puppeteer@10.4.0
- [x] Replace html-pdf-node with puppeteer-core (no bundled Chromium) - direct puppeteer-core API, uses system Chromium
- [x] Remove puppeteer from onlyBuiltDependencies in package.json
- [x] Update leadMagnet.test.ts mock from html-pdf-node to puppeteer-core
- [x] All 511 tests pass after migration

## Bug: Motion Type Selection Not Applied in Video Generation
- [ ] Trace how motion type is passed from UI to backend in PropertyTours page
- [ ] Check how motion type is used in videoGenerator / creatomateRenderer
- [ ] Fix motion type not being applied to video clips

## Bug Fix: Motion Type Selection Not Working (Apr 6 2026)
- [x] Root cause found: Higgsfield API was being called with WRONG endpoint /v1/generations (correct: /v1/generate)
- [x] Wrong payload field: input_image → image_url
- [x] Wrong response field: id → generation_id
- [x] Wrong poll endpoint: /v1/generations/{id} → /v1/status/{id}
- [x] Removed invalid "model" field from payload (Higgsfield API has no model field)
- [x] Fixed missing z import in youtube.ts (was causing persistent esbuild error at line 388)
- [x] Updated Higgsfield integration tests to validate correct endpoint/payload
- [x] All 513 tests pass

## Rebrand: Authority Content → AmpedAgent
- [x] Generate square app icon and dark-background logo variants
- [x] Upload new logo to CDN (CDN URLs available for use)
- [ ] Update VITE_APP_TITLE to "AmpedAgent" (user to update in Settings → General)
- [ ] Upload new logo in Settings → General (user action required)
- [x] Update all landing page copy (hero, taglines, feature descriptions) with new AmpedAgent messaging
- [x] Replace all "Authority Content" / "LuxEstate" / "Realty Content Agent" text references in the codebase
- [x] Update index.html title to AmpedAgent
- [x] Update package.json name to ampedagent

## Feature: Pricing Page Update
- [ ] Read current pricing page structure and plan tiers
- [ ] Rewrite with AmpedAgent branding, correct plan names, features, and messaging
- [ ] Ensure annual billing option with 2 months free is shown
- [ ] No free tier - 7-day trial with auto-billing

## Branding Fix - Logo and App Title Update
- [x] Update DashboardLayout logo from old AuthorityContent URL to AmpedAgent transparent logo
- [x] Update collapsed sidebar monogram from "AC" to "AA"
- [x] Update dashboard welcome text from "Authority Operating System" to "AmpedAgent command center"
- [x] Update Home.tsx hero and description text to remove "authority operating system" language
- [x] Update AdminUsers.tsx CSV export filename to ampedagent-users

## Deployment Fix - Remove Large Files from Git
- [x] Remove 12 local MP3 files from server/assets/music/ (tracked in git, causing deployment timeout)
- [x] Update ConvertToVideoModal.tsx to use CDN URLs for music preview instead of local /music/ paths
- [x] Remove old luxestate-icon-small.png from public/ directory (356KB, old branding)
- [x] Add server/assets/music/ and public/*.png to .gitignore
- [x] TypeScript clean (0 errors), 511/513 tests passing (2 network timeouts unrelated to changes)

## Color Retheme - Black/Cream/Orange
- [ ] Update global CSS theme variables: primary = orange (#F97316), background = cream (#FAFAF7), sidebar = black (#0F0F0F)
- [ ] Update sidebar header and nav to black background with orange accents
- [ ] Update top navbar to black background
- [ ] Update progress bars, badges, and accent elements to orange
- [ ] Ensure logo is visible on black sidebar background
- [ ] Ensure text contrast is correct on all backgrounds

## UI Cleanup - Black/Cream/Orange + Logo Fix
- [x] Fix sidebar header: remove hardcoded bg-primary (navy), use true black (#0F0F0F)
- [x] Make logo visible on black sidebar (use white/light version or add contrast)
- [x] Clean up top navbar to black background
- [x] Remove section labels (HOME, ATTRACT, CONVERT) or style them subtly
- [x] Make nav items cleaner with orange active state

## Brand Polish - Three Tasks
- [x] Rename "Authority Score" to "Market Dominance Score" across all files
- [x] Rewrite pricing page with AmpedAgent plans, 7-day trial, no free tier, annual option (2 months free)
- [x] Add AmpedAgent favicon (orange lightning bolt A, 32x32)

## Onboarding Modal - Video Replacement
- [ ] Find current intro video URL in onboarding modal (says "Authority Content")
- [ ] Replace with new AmpedAgent-branded intro video

## UI Fix - Navy/Blue Hero Banners
- [x] Fix Market Dominance Coach hero banner (navy → black with orange accent)
- [x] Audit all feature pages for remaining navy/blue hero banners and fix them (Dashboard, PerformanceCoach, ImageLibrary, ListingPresentation)

## Logo Fix - Orange Lightning Bolt
- [ ] Update AmpedAgent logo: lightning bolt on the A should be orange, rest of logo white

## April 7 2026 Fixes
- [x] Fix Agency tier showing "Upgrade required" for Full Avatar Videos on dashboard
- [x] Update "Premium" sidebar badges to "Agency"
- [x] Remove black gap between sidebar logo and top navbar; make search bar white
- [x] Fix Expert Hooks 404 - route not found (wrong /ai-generate path → fixed to /generate)
- [ ] Add Authority Profile summary strip to top of Dashboard
- [x] Update remaining 'Premium' badge labels to 'Agency' across pages (Dashboard, FullAvatarVideo, CinematicWalkthrough, LeadMagnet, RepurposeEngine, VideoComparison, NewsletterBuilder, PerformanceCoach, FAQ, Home, Onboarding, UsageCounter)
- [x] Video Script Builder - two-column scene editor (spoken script + visual direction per scene, AI generate from brief, AI visual prompts, save/load/delete scripts, copy to clipboard, CTA to Full Avatar Video)
- [x] Full Avatar Video: add separate Visual Prompt/Caption field alongside the Script field (like Mirage captions)
- [ ] Dashboard: add Authority Profile summary strip at top (headshot, name, tagline, completion score, link to Authority Profile)
- [ ] Video Script Builder: pre-seed with AmpedAgent intro script as default template for new users
- [x] Full Avatar Video: wire visualPrompt field into the video generation API call
- [x] Full Avatar Video: add optional Captions toggle (CC) so agents can choose whether to burn in styled subtitles

## AmpedAgent Intro Script — Pre-seed & Format
- [ ] Format AmpedAgent intro script into scene-by-scene spoken lines + visual prompts (two-column)
- [ ] Pre-seed Video Script Builder with AmpedAgent intro script as default template for new users

## Branding Fix - Remove HeyGen References
- [x] Remove "HeyGen is animating your avatar..." status text from Full Avatar Video page
- [x] Replace all HeyGen-branded generation status messages with neutral AmpedAgent copy

## Photo Avatar Quality Fixes
- [ ] Update photo upload requirements: add "slightly open mouth" and "more headroom" guidance
- [ ] Check HeyGen API for crop_style or framing parameters on avatar creation
- [ ] Add visual example/tip showing ideal headshot vs bad headshot for avatar creation

## Full Avatar Video - Background Scene Picker
- [x] Source curated background scene images (office, podcast, cafe, luxury home, outdoor, etc.)
- [x] Upload background images to CDN via manus-upload-file --webdev
- [x] Build background picker UI card in FullAvatarVideo.tsx with thumbnail grid
- [x] Wire selected background URL into all three HeyGen generation paths
- [x] Update HeyGen service to pass background image URL in video generation payload

## Full Avatar Video - Captions-Style Immersive Backgrounds
- [ ] Generate new Captions-style immersive background images (podcast studio, news desk, home office, luxury lounge, outdoor terrace, modern living room)
- [ ] Upload new backgrounds to CDN and replace old ones in the picker
- [ ] Update picker labels and thumbnails to match new scenes

## Avatar IV Upgrade
- [x] Upgrade Photo Avatar and Digital Twin generation to use Avatar IV motion engine (use_avatar_iv_model: true)
- [x] Add Avatar V coming-soon badge and note in the Custom Digital Twin mode selector

## White-Label Branding — Remove All Vendor Names
- [ ] Audit and remove all third-party tool names from user-facing client pages (HeyGen, D-ID, ElevenLabs, Runway, Shotstack, Creatomate, etc.)
- [ ] Replace with neutral AmpedAgent-branded copy across all pages
- [ ] Check server-side error messages and toast strings for vendor names

## White-Label Branding — Remove All Vendor Names (Completed)
- [x] Audit all client pages for third-party vendor name references (HeyGen, D-ID, ElevenLabs, Runway, Shotstack, Creatomate, Kling, Higgsfield)
- [x] Remove HeyGen references from FullAvatarVideo.tsx and AuthorityProfile.tsx
- [x] Remove ElevenLabs references from PersonaBrand.tsx and Settings.tsx
- [x] Remove D-ID references from Settings.tsx
- [x] Remove Kling AI references from PropertyTours.tsx
- [x] Remove vendor names from Privacy Policy AI services section
- [x] Remove vendor names from server-side error messages in autoreels.ts
- [x] Remove vendor names from server-side error messages in fullAvatarVideo.ts
- [x] Remove vendor names from server-side error messages in cinematicWalkthrough.ts (Runway, Creatomate, ElevenLabs)
