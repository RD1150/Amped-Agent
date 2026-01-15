# LinkedIn OAuth Setup Guide

## Overview
This guide will help you set up LinkedIn OAuth integration for Realty Content Agent so users can connect their LinkedIn accounts and post content.

---

## Step 1: Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **"Create app"**
3. Fill in the app details:
   - **App name:** Realty Content Agent
   - **LinkedIn Page:** Select your company page (or create one)
   - **App logo:** Upload the RCA logo
   - **Legal agreement:** Check the box
4. Click **"Create app"**

---

## Step 2: Configure OAuth Settings

1. In your app dashboard, go to the **"Auth"** tab
2. Under **"OAuth 2.0 settings"**, add these **Redirect URLs**:
   ```
   https://your-domain.manus.space/integrations?platform=linkedin
   http://localhost:3000/integrations?platform=linkedin
   ```
   (Replace `your-domain` with your actual Manus domain)

3. Under **"OAuth 2.0 scopes"**, request these permissions:
   - `openid`
   - `profile`
   - `email`
   - `w_member_social` (Post, comment and like posts)

4. Click **"Update"**

---

## Step 3: Get Your Credentials

1. In the **"Auth"** tab, find:
   - **Client ID**
   - **Client Secret** (click "Show" to reveal)

2. Copy these values

---

## Step 4: Add Credentials to Manus

### Option A: Using Manus UI (Recommended)
1. Go to your project's **Management UI**
2. Click **Settings** → **Secrets**
3. Add these environment variables:
   - `LINKEDIN_CLIENT_ID`: [Your Client ID]
   - `LINKEDIN_CLIENT_SECRET`: [Your Client Secret]

### Option B: Using `.env` file (Local Development)
Create a `.env` file in the project root:
```
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
```

---

## Step 5: Request App Review (For Production)

**Important:** LinkedIn apps start in "Development Mode" with limited access.

### Development Mode Limitations:
- Only you (the app owner) and up to 100 test users can connect
- Test users must be added manually in the app dashboard

### To Go Live:
1. In your app dashboard, go to the **"Products"** tab
2. Request access to **"Share on LinkedIn"** product
3. Fill out the application form
4. Wait for LinkedIn approval (usually 1-2 weeks)

---

## Step 6: Test the Integration

1. Restart your dev server:
   ```bash
   cd /home/ubuntu/luxestate
   pnpm dev
   ```

2. Go to **Integrations** page in your app

3. Click **"Connect LinkedIn"**

4. You'll be redirected to LinkedIn to authorize the app

5. After authorization, you'll be redirected back and see "Connected" status

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URL in your LinkedIn app matches exactly (including `?platform=linkedin`)
- Check for trailing slashes or http vs https mismatches

### Error: "invalid_scope"
- Make sure you've requested the correct scopes in your LinkedIn app
- `w_member_social` requires app review for production use

### Error: "unauthorized_client"
- Your app is in Development Mode
- Add test users in the LinkedIn app dashboard
- Or complete app review to go live

---

## Testing Posting

Once connected, you can test posting to LinkedIn:

1. Create a post in **Content Calendar**
2. Select **LinkedIn** as the platform
3. Click **"Publish Now"**
4. Check your LinkedIn profile to see the post

---

## Production Checklist

Before launching to real users:

- [ ] LinkedIn app approved and live
- [ ] Redirect URLs updated with production domain
- [ ] Environment variables set in Manus Settings → Secrets
- [ ] Test posting from multiple accounts
- [ ] Monitor LinkedIn API rate limits (500 requests/day per user)

---

## LinkedIn API Limits

**Free Tier:**
- 500 API calls per day per user
- 100 posts per day per user
- Rate limit: 100 requests per 15 minutes

**Enterprise:**
- Contact LinkedIn for higher limits

---

## Support

If you encounter issues:
1. Check LinkedIn Developer Console for error messages
2. Review LinkedIn API documentation: https://docs.microsoft.com/en-us/linkedin/
3. Contact LinkedIn Developer Support: https://www.linkedin.com/help/linkedin/ask/

---

## Next Steps

After LinkedIn is working:
1. Test with real users
2. Monitor API usage in LinkedIn Developer Console
3. Consider adding LinkedIn Company Page posting (requires different OAuth flow)
4. Add LinkedIn Analytics integration to track post performance
