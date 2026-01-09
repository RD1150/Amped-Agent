# LuxEstate - Project TODO

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
- [x] Sync user status between GHL and LuxEstate
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
- [ ] Remove hardcoded "LuxEstate" branding

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
- [x] Generate 1024x1024 app icon for LuxEstate
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
- [ ] Test end-to-end posting flow to GHL

## Market Stats Feature (Priority 2)
- [x] Create Market Stats page component
- [x] Add Market Stats to sidebar navigation
- [x] Build location search input (city, state, zipcode)
- [ ] Research and integrate real estate data API (Zillow, Realtor.com, or public data)
- [x] Display key metrics placeholders: median home price, days on market, inventory levels, price per sqft
- [ ] Add year-over-year comparison charts
- [ ] Show market temperature indicator (hot/balanced/cold)
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
- [ ] Add FAQ section
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
- [ ] Update all "LuxEstate" references in codebase
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
