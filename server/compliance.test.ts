import { describe, it, expect } from "vitest";
import { verifyCompliance } from "./complianceAudit";

describe("Property Tour Compliance Validation", () => {
  describe("Legal Rights Confirmation", () => {
    it("should require legal rights confirmation", () => {
      const result = verifyCompliance({
        tourType: "listing-agent",
        address: "123 Main St",
        isUserListingAgent: true,
        legalRightsConfirmed: false,
      });

      expect(result.compliant).toBe(false);
      expect(result.violations).toContain("Legal rights confirmation required");
    });

    it("should pass when legal rights are confirmed", () => {
      const result = verifyCompliance({
        tourType: "listing-agent",
        address: "123 Main St",
        isUserListingAgent: true,
        legalRightsConfirmed: true,
      });

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Listing Agent Mode", () => {
    it("should require attribution when using full address and not listing agent", () => {
      const result = verifyCompliance({
        tourType: "listing-agent",
        address: "123 Main St, City, State 12345",
        isUserListingAgent: false,
        legalRightsConfirmed: true,
        // Missing listingAgentName and listingAgentBrokerage
      });

      expect(result.compliant).toBe(false);
      expect(result.violations).toContain(
        "Listing Agent Mode with full address requires listing agent attribution"
      );
    });

    it("should pass when user is the listing agent", () => {
      const result = verifyCompliance({
        tourType: "listing-agent",
        address: "123 Main St, City, State 12345",
        isUserListingAgent: true,
        legalRightsConfirmed: true,
      });

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should pass when attribution is provided", () => {
      const result = verifyCompliance({
        tourType: "listing-agent",
        address: "123 Main St, City, State 12345",
        isUserListingAgent: false,
        listingAgentName: "John Doe",
        listingAgentBrokerage: "ABC Realty",
        legalRightsConfirmed: true,
      });

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should pass when no full address is provided", () => {
      const result = verifyCompliance({
        tourType: "listing-agent",
        address: "Downtown Area",
        isUserListingAgent: false,
        legalRightsConfirmed: true,
      });

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Buyer Tour Mode", () => {
    it("should reject full addresses", () => {
      const result = verifyCompliance({
        tourType: "buyer-tour",
        address: "456 Oak Ave, City, State 67890",
        isUserListingAgent: false,
        legalRightsConfirmed: true,
      });

      expect(result.compliant).toBe(false);
      expect(result.violations).toContain(
        "Buyer Tour Mode cannot include full property address"
      );
    });

    it("should allow generic location descriptions", () => {
      const result = verifyCompliance({
        tourType: "buyer-tour",
        address: "Luxury Waterfront Community",
        isUserListingAgent: false,
        legalRightsConfirmed: true,
      });

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should allow neighborhood names", () => {
      const result = verifyCompliance({
        tourType: "buyer-tour",
        address: "Downtown Historic District",
        isUserListingAgent: false,
        legalRightsConfirmed: true,
      });

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Market Highlight Mode", () => {
    it("should reject full addresses", () => {
      const result = verifyCompliance({
        tourType: "market-highlight",
        address: "789 Pine Rd, City, State 11111",
        isUserListingAgent: false,
        legalRightsConfirmed: true,
      });

      expect(result.compliant).toBe(false);
      expect(result.violations).toContain(
        "Market Highlight Mode cannot include full property address"
      );
    });

    it("should allow market area descriptions", () => {
      const result = verifyCompliance({
        tourType: "market-highlight",
        address: "North Beach Market Area",
        isUserListingAgent: false,
        legalRightsConfirmed: true,
      });

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Address Detection", () => {
    it("should detect full addresses with street numbers", () => {
      const addresses = [
        "123 Main St",
        "456 Oak Avenue",
        "789 Pine Road, City, State 12345",
        "1 First Street",
      ];

      addresses.forEach((address) => {
        const result = verifyCompliance({
          tourType: "buyer-tour",
          address,
          isUserListingAgent: false,
          legalRightsConfirmed: true,
        });

        expect(result.compliant).toBe(false);
        expect(result.violations).toContain(
          "Buyer Tour Mode cannot include full property address"
        );
      });
    });

    it("should allow addresses without numbers", () => {
      const addresses = [
        "Downtown Area",
        "Waterfront District",
        "Historic Neighborhood",
        "Luxury Community",
      ];

      addresses.forEach((address) => {
        const result = verifyCompliance({
          tourType: "buyer-tour",
          address,
          isUserListingAgent: false,
          legalRightsConfirmed: true,
        });

        expect(result.compliant).toBe(true);
        expect(result.violations).toHaveLength(0);
      });
    });
  });

  describe("Multiple Violations", () => {
    it("should report all violations", () => {
      const result = verifyCompliance({
        tourType: "listing-agent",
        address: "123 Main St",
        isUserListingAgent: false,
        legalRightsConfirmed: false,
        // Missing attribution
      });

      expect(result.compliant).toBe(false);
      expect(result.violations).toHaveLength(2);
      expect(result.violations).toContain("Legal rights confirmation required");
      expect(result.violations).toContain(
        "Listing Agent Mode with full address requires listing agent attribution"
      );
    });
  });
});
