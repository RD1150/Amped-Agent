export default function AIDisclaimer() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <a href="/landing" className="flex items-center gap-2">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/OIiAbFpfnRfWzAsg.png" alt="Authority Content" className="h-8 object-contain" />
          </a>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">AI Content Disclaimer</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: January 14, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4">Important Notice About AI-Generated Content</h2>
            <p>
              Authority Content uses artificial intelligence to generate social media content. While our AI is trained to produce high-quality, relevant content for real estate professionals, it is essential that you understand the following:
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Review All Content Before Publishing</h2>
            <p>
              You are solely responsible for reviewing, editing, and approving all AI-generated content before publishing it to any platform. AI-generated content may contain:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Factual inaccuracies or outdated information</li>
              <li>Grammatical errors or awkward phrasing</li>
              <li>Content that may not align with your brand voice</li>
              <li>Information that requires verification</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Compliance with Laws and Regulations</h2>
            <p>
              You must ensure that all content you publish complies with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fair Housing Act and anti-discrimination laws</li>
              <li>Real estate advertising regulations in your jurisdiction</li>
              <li>Truth in advertising standards</li>
              <li>Copyright and intellectual property laws</li>
              <li>Platform-specific terms of service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Accuracy of Market Data</h2>
            <p>
              Market statistics and trending news features provide general information that may not reflect current conditions in your specific market. Always:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Verify market data with authoritative sources</li>
              <li>Update statistics to reflect current conditions</li>
              <li>Disclose the source and date of any data you share</li>
              <li>Consult with your broker before sharing market predictions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. No Professional Advice</h2>
            <p>
              AI-generated content is not a substitute for professional real estate, legal, or financial advice. Do not rely on AI-generated content to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Make business decisions</li>
              <li>Provide advice to clients</li>
              <li>Replace professional consultation</li>
              <li>Determine property values or market conditions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Your Responsibility</h2>
            <p>
              By using Authority Content, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for all content you publish</li>
              <li>You will review and edit AI-generated content appropriately</li>
              <li>You will ensure compliance with all applicable laws</li>
              <li>You will not hold Authority Content liable for any consequences resulting from your use of AI-generated content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
            <p>
              Authority Content is not responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Errors or inaccuracies in AI-generated content</li>
              <li>Consequences of publishing unreviewed content</li>
              <li>Violations of laws or regulations resulting from your use of the Service</li>
              <li>Loss of business or reputation due to content issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Best Practices</h2>
            <p>
              We recommend the following best practices when using AI-generated content:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Always read content thoroughly before publishing</li>
              <li>Customize content to match your brand voice and local market</li>
              <li>Verify all facts, statistics, and claims</li>
              <li>Add personal insights and local expertise</li>
              <li>Consult with your broker or legal counsel when in doubt</li>
              <li>Keep records of content you publish</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
            <p>
              If you have questions about AI-generated content or this disclaimer, please contact us at:
            </p>
            <p className="mt-2">
              Email: <a href="mailto:support@realtycontentagent.com" className="text-primary hover:underline">support@realtycontentagent.com</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <a href="/landing" className="text-primary hover:underline">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
