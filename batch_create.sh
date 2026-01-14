#!/bin/bash
# Create Stripe files
mkdir -p server/webhooks
touch server/products.ts
touch server/stripe.ts  
touch server/webhooks/stripe.ts

# Create landing page
touch client/src/pages/Landing.tsx

# Create legal pages  
touch client/src/pages/Terms.tsx
touch client/src/pages/AIDisclaimer.tsx
touch client/src/pages/FairHousing.tsx

echo "Files created successfully"
