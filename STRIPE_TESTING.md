# Stripe Credit Purchase Testing Guide

## Test Environment Setup

The Authority Content platform has Stripe integration configured with test mode enabled. All credit packages are ready for testing.

## Credit Packages

1. **Starter Package**: $49 for 100 credits
2. **Professional Package**: $149 for 350 credits (includes 50 bonus credits)
3. **Agency Package**: $399 for 1,000 credits (includes 200 bonus credits)

## Testing Steps

### 1. Navigate to Credits Page

- Log in to Authority Content
- Click on "Credits" in the sidebar navigation
- You should see your current balance (50 free trial credits) and the three credit packages

### 2. Purchase Credits with Test Card

Use the following test card details:

```
Card Number: 4242 4242 4242 4242
Expiration: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Test Flow:**
1. Click "Purchase" on any credit package
2. Stripe Checkout should open in a new window
3. Fill in the test card details above
4. Complete the purchase
5. You should be redirected back to the Credits page

### 3. Verify Credit Addition

After successful payment:
1. Check your credit balance in the header (should show updated balance)
2. Navigate to Credits page to see transaction history
3. Verify the purchase appears in the transaction list with:
   - Correct credit amount
   - Purchase timestamp
   - Transaction type: "Credit Purchase"

### 4. Test Webhook

The webhook endpoint is configured at `/api/stripe/webhook` and handles:
- `checkout.session.completed` - Adds credits to user balance
- `payment_intent.succeeded` - Logs successful payment

**Verification:**
1. Check server logs for webhook events
2. Confirm credits were added immediately after payment
3. Verify transaction record was created in database

### 5. Test All Three Packages

Repeat the above steps for each credit package to ensure:
- $49 package adds 100 credits
- $149 package adds 350 credits
- $399 package adds 1,000 credits

### 6. Test Edge Cases

**Insufficient Credits:**
1. Navigate to Property Tours
2. Try to generate a Full AI Cinematic video (40 credits)
3. If balance < 40, you should see an error message
4. Click the "Purchase more credits" link
5. Complete purchase and retry video generation

**Multiple Purchases:**
1. Purchase credits multiple times
2. Verify balance accumulates correctly
3. Check transaction history shows all purchases

## Expected Results

✅ Stripe Checkout opens correctly
✅ Test payment processes successfully
✅ Credits are added to user balance immediately
✅ Transaction appears in history
✅ Webhook receives and processes events
✅ All three packages work correctly
✅ Error handling works for insufficient credits

## Troubleshooting

**Checkout doesn't open:**
- Check browser console for errors
- Verify Stripe publishable key is set
- Ensure popup blockers are disabled

**Credits not added:**
- Check server logs for webhook errors
- Verify webhook secret is correct
- Test webhook manually using Stripe CLI

**Transaction not recorded:**
- Check database for credit_transactions table
- Verify user ID is correctly associated
- Review server logs for database errors

## Production Deployment

Before going live:
1. Switch to live Stripe keys in Settings → Payment
2. Configure live webhook endpoint
3. Test with real card (will charge actual money)
4. Generate 99% discount promo code for testing (minimum $0.50 charge)

## Notes

- Test mode webhooks are automatically verified
- Test event IDs start with `evt_test_`
- No actual money is charged in test mode
- Test data can be cleared from Stripe Dashboard
