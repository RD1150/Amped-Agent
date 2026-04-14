/**
 * Weekly Email Digest Job
 *
 * Runs every Monday at 8:00 AM (server local time).
 * For each opted-in user, generates a personalised weekly diagnosis
 * using the same LLM logic as the Dashboard WeeklyInsightBlock,
 * then sends it via Resend.
 */

import cron from "node-cron";
import { getDb } from "../db";
import { sendEmail } from "../emailService";
import { invokeLLM } from "../_core/llm";
import { getPersonaByUserId } from "../db";

// ── HTML Email Template ───────────────────────────────────────────────────────

function buildDigestEmail(params: {
  agentName: string;
  weeklyFocus: string;
  criticalIssue: { title: string; whatIsHappening: string; consequence: string; action: string };
  missedOpportunities: { title: string; insight: string; action: string }[];
  priorityActions: { rank: number; action: string; tool: string }[];
  leverageInsight: string;
  appUrl: string;
}): { subject: string; html: string } {
  const { agentName, weeklyFocus, criticalIssue, missedOpportunities, priorityActions, leverageInsight, appUrl } = params;

  const subject = `Your Weekly Strategy Briefing — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;

  const oppsHtml = missedOpportunities
    .map(
      (opp) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1e293b;">${opp.title}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;">${opp.insight}</p>
          <p style="margin:0;font-size:13px;color:#0f172a;border-left:2px solid #f59e0b;padding-left:8px;">${opp.action}</p>
        </td>
      </tr>`
    )
    .join("");

  const actionsHtml = priorityActions
    .map(
      (act) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="width:28px;vertical-align:top;">
                <span style="display:inline-block;width:22px;height:22px;background:#0f172a;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;">${act.rank}</span>
              </td>
              <td style="vertical-align:top;padding-left:8px;">
                <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#1e293b;">${act.action}</p>
                <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">${act.tool}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;">
                Weekly Diagnosis · AmpedAgent
              </p>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;line-height:1.3;">
                ${weeklyFocus}
              </h1>
              <p style="margin:8px 0 0;font-size:13px;color:#94a3b8;">
                Good morning, ${agentName}. Here's what to focus on this week.
              </p>
            </td>
          </tr>

          <!-- Critical Issue -->
          <tr>
            <td style="padding:24px 32px 0;">
              <table cellpadding="0" cellspacing="0" style="width:100%;background:#fff5f5;border-radius:8px;border-left:4px solid #ef4444;padding:16px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#ef4444;">⚠ Critical Issue</p>
                    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1e293b;">${criticalIssue.title}</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#64748b;">${criticalIssue.whatIsHappening}</p>
                    <p style="margin:0 0 8px;font-size:13px;color:#dc2626;font-weight:500;">${criticalIssue.consequence}</p>
                    <p style="margin:0;font-size:13px;color:#1e293b;border-left:2px solid #fca5a5;padding-left:8px;">${criticalIssue.action}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Missed Opportunities -->
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0 0 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#d97706;">💡 Missed Opportunities</p>
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                ${oppsHtml}
              </table>
            </td>
          </tr>

          <!-- Priority Actions -->
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0 0 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#16a34a;">✅ Priority Actions This Week</p>
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                ${actionsHtml}
              </table>
            </td>
          </tr>

          <!-- Leverage Insight -->
          <tr>
            <td style="padding:20px 32px 0;">
              <table cellpadding="0" cellspacing="0" style="width:100%;background:#fffbeb;border-radius:8px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#d97706;">🎯 Leverage Insight</p>
                    <p style="margin:0;font-size:13px;color:#92400e;">${leverageInsight}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 32px;" align="center">
              <a href="${appUrl}/coach"
                 style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                Open Full Coach →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                You're receiving this because you opted in to Weekly Diagnosis emails in AmpedAgent Settings.<br/>
                <a href="${appUrl}/settings" style="color:#64748b;">Manage preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

// ── Diagnosis Generator ───────────────────────────────────────────────────────

async function generateDigestForUser(userId: number): Promise<{
  weeklyFocus: string;
  criticalIssue: { title: string; whatIsHappening: string; consequence: string; action: string };
  missedOpportunities: { title: string; insight: string; action: string }[];
  priorityActions: { rank: number; action: string; tool: string }[];
  leverageInsight: string;
} | null> {
  try {
    const dbInst = await getDb();
    if (!dbInst) return null;

    const { eq, desc } = await import("drizzle-orm");
    const schema = await import("../../drizzle/schema");

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [persona, contentPostsRows, videosRows, blogPostsRows, leadMagnetsRows, userRows, podcastRows] =
      await Promise.all([
        getPersonaByUserId(userId),
        dbInst.select({ id: schema.contentPosts.id, createdAt: schema.contentPosts.createdAt })
          .from(schema.contentPosts).where(eq(schema.contentPosts.userId, userId))
          .orderBy(desc(schema.contentPosts.createdAt)).limit(200),
        dbInst.select({ id: schema.generatedVideos.id, createdAt: schema.generatedVideos.createdAt })
          .from(schema.generatedVideos).where(eq(schema.generatedVideos.userId, userId))
          .orderBy(desc(schema.generatedVideos.createdAt)).limit(100),
        dbInst.select({ id: schema.blogPosts.id, createdAt: schema.blogPosts.createdAt })
          .from(schema.blogPosts).where(eq(schema.blogPosts.userId, userId))
          .orderBy(desc(schema.blogPosts.createdAt)).limit(100),
        dbInst.select({ id: schema.leadMagnets.id, createdAt: schema.leadMagnets.createdAt })
          .from(schema.leadMagnets).where(eq(schema.leadMagnets.userId, userId))
          .orderBy(desc(schema.leadMagnets.createdAt)).limit(50),
        dbInst.select({ name: schema.users.name, subscriptionTier: schema.users.subscriptionTier })
          .from(schema.users).where(eq(schema.users.id, userId)).limit(1),
        dbInst.select({ id: schema.podcastEpisodes.id, createdAt: schema.podcastEpisodes.createdAt })
          .from(schema.podcastEpisodes).where(eq(schema.podcastEpisodes.userId, userId))
          .orderBy(desc(schema.podcastEpisodes.createdAt)).limit(50),
      ]);

    const postsLast7 = contentPostsRows.filter((p) => new Date(p.createdAt) >= sevenDaysAgo).length;
    const postsLast30 = contentPostsRows.filter((p) => new Date(p.createdAt) >= thirtyDaysAgo).length;
    const videosLast30 = videosRows.filter((v) => new Date(v.createdAt) >= thirtyDaysAgo).length;
    const blogsTotal = blogPostsRows.length;
    const leadMagnetsTotal = leadMagnetsRows.length;
    const podcastsTotal = podcastRows.length;
    const agentName = userRows[0]?.name || persona?.agentName || "Agent";
    const primaryCity = persona?.primaryCity || "your market";

    const activitySummary = [
      `Posts created (last 7 days): ${postsLast7}`,
      `Posts created (last 30 days): ${postsLast30}`,
      `Total posts ever: ${contentPostsRows.length}`,
      `Videos generated (last 30 days): ${videosLast30}`,
      `Total videos ever: ${videosRows.length}`,
      `Blog posts total: ${blogsTotal}`,
      `Lead magnets created: ${leadMagnetsTotal}`,
      `Podcast episodes created: ${podcastsTotal}`,
      `Profile completion: ${persona ? "filled" : "empty"}`,
    ].join("\n");

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a decisive real estate business strategist. Produce a weekly diagnosis — not suggestions, but directives. Be blunt, specific, and urgent.",
        },
        {
          role: "user",
          content: `Agent: ${agentName} | Market: ${primaryCity}\n\nACTIVITY DATA:\n${activitySummary}\n\nGenerate a weekly diagnosis.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "weekly_diagnosis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              criticalIssue: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  whatIsHappening: { type: "string" },
                  consequence: { type: "string" },
                  action: { type: "string" },
                },
                required: ["title", "whatIsHappening", "consequence", "action"],
                additionalProperties: false,
              },
              missedOpportunities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    insight: { type: "string" },
                    action: { type: "string" },
                  },
                  required: ["title", "insight", "action"],
                  additionalProperties: false,
                },
              },
              priorityActions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    rank: { type: "number" },
                    action: { type: "string" },
                    tool: { type: "string" },
                    href: { type: "string" },
                  },
                  required: ["rank", "action", "tool", "href"],
                  additionalProperties: false,
                },
              },
              leverageInsight: { type: "string" },
              weeklyFocus: { type: "string" },
            },
            required: ["criticalIssue", "missedOpportunities", "priorityActions", "leverageInsight", "weeklyFocus"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(typeof content === "string" ? content : "{}");
  } catch (err) {
    console.error(`[WeeklyDigest] Failed to generate diagnosis for user ${userId}:`, err);
    return null;
  }
}

// ── Main Job Runner ───────────────────────────────────────────────────────────

export async function sendWeeklyDigests(): Promise<void> {
  console.log("[WeeklyDigest] Starting weekly digest run...");
  const dbInst = await getDb();
  if (!dbInst) {
    console.error("[WeeklyDigest] Database unavailable");
    return;
  }

  const { eq } = await import("drizzle-orm");
  const { users } = await import("../../drizzle/schema");

  // Fetch all opted-in users who have an email address
  const optedIn = await dbInst
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.weeklyDigestEnabled, true));

  console.log(`[WeeklyDigest] ${optedIn.length} opted-in users found`);

  const APP_URL = process.env.APP_URL || "https://ampedagent.app";
  let sent = 0;
  let failed = 0;

  for (const user of optedIn) {
    if (!user.email) continue;
    try {
      const diagnosis = await generateDigestForUser(user.id);
      if (!diagnosis) { failed++; continue; }

      const persona = await getPersonaByUserId(user.id);
      const agentName = persona?.agentName || user.name || "Agent";

      const { subject, html } = buildDigestEmail({
        agentName,
        weeklyFocus: diagnosis.weeklyFocus,
        criticalIssue: diagnosis.criticalIssue,
        missedOpportunities: diagnosis.missedOpportunities,
        priorityActions: diagnosis.priorityActions,
        leverageInsight: diagnosis.leverageInsight,
        appUrl: APP_URL,
      });

      const ok = await sendEmail({ to: user.email, subject, html });
      if (ok) {
        // Update lastSentAt
        await dbInst
          .update(users)
          .set({ weeklyDigestLastSentAt: new Date() })
          .where(eq(users.id, user.id));
        sent++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`[WeeklyDigest] Error processing user ${user.id}:`, err);
      failed++;
    }
  }

  console.log(`[WeeklyDigest] Done. Sent: ${sent}, Failed: ${failed}`);
}

// ── Cron Registration ─────────────────────────────────────────────────────────

export function registerWeeklyDigestJob(): void {
  // Every Monday at 8:00 AM server time
  cron.schedule("0 8 * * 1", async () => {
    console.log("[WeeklyDigest] Cron triggered — Monday 8:00 AM");
    await sendWeeklyDigests();
  });
  console.log("[WeeklyDigest] Cron job registered — runs every Monday at 8:00 AM");
}
