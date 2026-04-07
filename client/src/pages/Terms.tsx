import { Card } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: January 14, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using AmpedAgent ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p>
              AmpedAgent provides AI-powered social media content generation and scheduling tools for real estate professionals.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Subscription and Payment</h2>
            <p>
              The Service is offered at $79 per month with a 14-day free trial. Subscriptions automatically renew unless canceled. No refunds for partial months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. AI-Generated Content</h2>
            <p>
              You are solely responsible for reviewing and editing all AI-generated content before publication. We are not liable for consequences resulting from your use of AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Contact</h2>
            <p>
              Email: <a href="mailto:support@realtycontentagent.com" className="text-primary hover:underline">support@realtycontentagent.com</a>
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
