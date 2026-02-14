/**
 * Compliance Audit Logging System
 * Tracks all property tour creations for legal compliance and attribution verification
 */

import { getDb } from "./db";
import { propertyTours } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface ComplianceAuditLog {
  tourId: number;
  userId: number;
  tourType: "listing-agent" | "buyer-tour" | "market-highlight";
  hasFullAddress: boolean;
  isUserListingAgent: boolean;
  listingAgentName?: string;
  listingAgentBrokerage?: string;
  legalRightsConfirmed: boolean;
  complianceStatus: "compliant" | "non-compliant";
  violations: string[];
  timestamp: Date;
}

/**
 * Verify compliance rules for a property tour
 * Returns compliance status and any violations
 */
export function verifyCompliance(data: {
  tourType: "listing-agent" | "buyer-tour" | "market-highlight";
  address: string;
  isUserListingAgent: boolean;
  listingAgentName?: string;
  listingAgentBrokerage?: string;
  legalRightsConfirmed: boolean;
}): { compliant: boolean; violations: string[] } {
  const violations: string[] = [];
  const hasFullAddress = /\d/.test(data.address); // Check if address contains numbers

  // Rule 1: Legal rights must always be confirmed
  if (!data.legalRightsConfirmed) {
    violations.push("Legal rights confirmation required");
  }

  // Rule 2: Listing Agent Mode - if full address + not user listing agent → require attribution
  if (data.tourType === "listing-agent" && hasFullAddress && !data.isUserListingAgent) {
    if (!data.listingAgentName || !data.listingAgentBrokerage) {
      violations.push("Listing Agent Mode with full address requires listing agent attribution");
    }
  }

  // Rule 3: Buyer Tour Mode - cannot include full address
  if (data.tourType === "buyer-tour" && hasFullAddress) {
    violations.push("Buyer Tour Mode cannot include full property address");
  }

  // Rule 4: Market Highlight Mode - cannot include full address
  if (data.tourType === "market-highlight" && hasFullAddress) {
    violations.push("Market Highlight Mode cannot include full property address");
  }

  return {
    compliant: violations.length === 0,
    violations,
  };
}

/**
 * Log compliance audit for a property tour creation
 * Called automatically after tour creation
 */
export async function logComplianceAudit(
  tourId: number,
  userId: number,
  data: {
    tourType: "listing-agent" | "buyer-tour" | "market-highlight";
    address: string;
    isUserListingAgent: boolean;
    listingAgentName?: string;
    listingAgentBrokerage?: string;
    legalRightsConfirmed: boolean;
  }
): Promise<void> {
  const hasFullAddress = /\d/.test(data.address);
  const { compliant, violations } = verifyCompliance(data);

  const auditLog: ComplianceAuditLog = {
    tourId,
    userId,
    tourType: data.tourType,
    hasFullAddress,
    isUserListingAgent: data.isUserListingAgent,
    listingAgentName: data.listingAgentName,
    listingAgentBrokerage: data.listingAgentBrokerage,
    legalRightsConfirmed: data.legalRightsConfirmed,
    complianceStatus: compliant ? "compliant" : "non-compliant",
    violations,
    timestamp: new Date(),
  };

  // Log to console for now (can be extended to database table later)
  console.log("[Compliance Audit]", JSON.stringify(auditLog, null, 2));

  // If non-compliant, this should have been caught by backend validation
  // Log as warning for investigation
  if (!compliant) {
    console.warn("[Compliance Audit] NON-COMPLIANT TOUR CREATED:", {
      tourId,
      userId,
      violations,
    });
  }
}

/**
 * Verify compliance before video generation
 * Double-check compliance at render time
 */
export async function verifyComplianceBeforeRender(tourId: number): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { allowed: false, reason: "Database not available" };
  }

  const tour = await db
    .select()
    .from(propertyTours)
    .where(eq(propertyTours.id, tourId))
    .limit(1);

  if (!tour || tour.length === 0) {
    return { allowed: false, reason: "Tour not found" };
  }

  const tourData = tour[0];

  const { compliant, violations } = verifyCompliance({
    tourType: tourData.tourType || "listing-agent",
    address: tourData.address,
    isUserListingAgent: tourData.isUserListingAgent || false,
    listingAgentName: tourData.listingAgentName || undefined,
    listingAgentBrokerage: tourData.listingAgentBrokerage || undefined,
    legalRightsConfirmed: tourData.legalRightsConfirmed || false,
  });

  if (!compliant) {
    console.error("[Compliance] Render blocked for tour", tourId, "- Violations:", violations);
    return {
      allowed: false,
      reason: `Compliance violations: ${violations.join(", ")}`,
    };
  }

  return { allowed: true };
}
