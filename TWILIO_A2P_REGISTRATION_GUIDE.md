# Twilio A2P 10DLC Registration Guide — AmpedAgent

**What is A2P 10DLC?**
A2P (Application-to-Person) 10DLC is the carrier-mandated registration system for businesses sending SMS messages from 10-digit long code (local) phone numbers in the US. Without registration, messages are heavily filtered or blocked by carriers. Registration is required by all major US carriers (AT&T, T-Mobile, Verizon).

**Current Status:** Infrastructure built and ready. Awaiting Twilio credentials and A2P registration approval.

---

## Step 1 — Create a Twilio Account

1. Go to [twilio.com](https://www.twilio.com) and sign up for a business account.
2. Complete identity verification (government ID required).
3. Purchase a local 10-digit phone number (approximately $1/month).
4. Note your **Account SID** and **Auth Token** from the Twilio Console dashboard.

---

## Step 2 — Add Twilio Credentials to AmpedAgent

In the AmpedAgent Settings → Secrets panel, add these three values:

| Secret Key | Where to Find It |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Account Info |
| `TWILIO_PHONE_NUMBER` | Twilio Console → Phone Numbers → Manage → Active Numbers (format: +15551234567) |

---

## Step 3 — Register Your Business (Brand Registration)

In the Twilio Console, navigate to **Messaging → Regulatory Compliance → A2P 10DLC**.

**Brand Registration requires:**
- Legal business name (as registered with the IRS/state)
- Business type (LLC, Corporation, Sole Proprietor, etc.)
- EIN / Tax ID (for businesses) — or SSN for sole proprietors
- Business address
- Business website URL — use **https://ampedagent.app**
- Business phone number
- Business email address
- Vertical: **Real Estate**

**Cost:** $4 one-time brand registration fee (billed by Twilio).

**Timeline:** Brand approval typically takes 1–5 business days.

---

## Step 4 — Register Your Campaign

After brand approval, register a **Campaign** (the specific use case for your messages).

**Campaign details to enter:**

| Field | Value |
|---|---|
| Campaign Use Case | **Mixed** (covers follow-up, notifications, and marketing) |
| Campaign Description | "AmpedAgent sends automated SMS follow-up messages to real estate open house visitors who have explicitly opted in via a digital sign-in form. Messages include property information, agent contact details, and scheduling links. All recipients have provided written TCPA consent at time of sign-in." |
| Message Flow | "Recipients sign in at an open house via a QR code form at ampedagent.app/oh/[slug]. The form includes an explicit SMS consent checkbox with TCPA disclosure. After signing in, they receive up to 3 follow-up messages from the listing agent over 7 days." |
| Sample Message 1 | "Hi Sarah! This is Jane Smith. Thanks for visiting 123 Main St today! I'd love to answer any questions. Book a call: https://calendly.com/jane. Reply STOP to unsubscribe." |
| Sample Message 2 | "Hi Sarah, Jane Smith here. Still thinking about 123 Main St? I can share comps and neighborhood info. Want me to send those over? Reply STOP to unsubscribe." |
| Opt-In Type | **Web Form** |
| Opt-In Image/URL | Screenshot of the open house sign-in form at ampedagent.app/oh/[any-slug] |
| Opt-Out Keywords | STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT |
| Help Keywords | HELP |
| Opt-Out Message | "You have been unsubscribed and will receive no further messages." |
| Help Message | "For help, contact support@ampedagent.app. Reply STOP to unsubscribe." |
| Subscriber Opt-In | YES — explicit checkbox on sign-in form |
| Subscriber Opt-Out | YES — STOP reply handled automatically |
| Subscriber Help | YES — HELP reply supported |
| Embedded Links | YES (booking URLs) |
| Embedded Phone Numbers | YES (agent phone number) |
| Age-Gated Content | NO |
| Direct Lending / Loan Arrangement | NO |

**Cost:** $10/month campaign fee (billed by Twilio, passed through from carriers).

**Timeline:** Campaign approval takes 2–6 weeks (this is the slow part — carriers review manually).

---

## Step 5 — Configure the Webhook URL

In Twilio Console → Phone Numbers → Manage → Active Numbers → [your number]:

Under **Messaging**, set the **Webhook URL** for incoming messages to:

```
https://ampedagent.app/api/twilio/webhook
```

HTTP Method: **POST**

This endpoint is already built and handles STOP/opt-out replies automatically.

---

## Step 6 — Test Before Going Live

Once credentials are added to AmpedAgent and A2P is approved:

1. Create an open house in AmpedAgent
2. Open the QR sign-in link on your own phone
3. Sign in with your own name, phone number, and check the SMS consent box
4. Verify you receive the follow-up text within a few minutes
5. Reply STOP and verify you're opted out in the Open House Manager lead list

---

## Important Compliance Notes

- **Never send to anyone without smsConsent = true in the database.** The platform enforces this automatically.
- **Keep consent records.** The database stores `smsConsentTimestamp` for every lead who opted in. This is your legal audit trail.
- **Message frequency:** AmpedAgent sends a maximum of 3 messages per lead per open house. This is disclosed in the consent language.
- **Content restrictions:** Do not modify the opt-out footer ("Reply STOP to unsubscribe"). It is required by CTIA guidelines.
- **Sole Proprietors:** If registering as a sole proprietor (no EIN), Twilio may require additional verification. Brand registration may take longer.

---

## Why A2P Takes So Long

The 2–6 week timeline is not Twilio's fault — it is the carriers (AT&T, T-Mobile, Verizon) who manually review campaigns. AfterCallPro and other platforms experience the same delays. There is no way to expedite this process.

**What you can do while waiting:**
- Add credentials to AmpedAgent (Step 2) — the platform is ready
- Build your open house lead list — consent data is being captured now
- When A2P is approved, SMS follow-ups activate automatically for all future leads

---

## Estimated Costs

| Item | Cost |
|---|---|
| Twilio phone number | ~$1/month |
| Brand registration | $4 one-time |
| Campaign registration | $10/month |
| SMS messages | $0.0079/message (outbound US) |
| 100 messages/month | ~$0.79 |
| 1,000 messages/month | ~$7.90 |

Total monthly overhead at low volume: ~$12/month.
