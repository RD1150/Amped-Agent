export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-slate max-w-none space-y-6">
        <p className="text-muted-foreground">
          Last Updated: February 19, 2026
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            AmpedAgent ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered content generation platform for real estate professionals.
          </p>
          <p>
            By using AmpedAgent, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Information You Provide</h3>
          <p>We collect information that you voluntarily provide when using our Service:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, password, and profile details</li>
            <li><strong>Professional Information:</strong> Real estate brokerage, license number, location, specialization</li>
            <li><strong>Content Inputs:</strong> Text, images, videos, and other media you upload or provide for content generation</li>
            <li><strong>Generated Content:</strong> All content created using our AI tools, including posts, videos, and marketing materials</li>
            <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store full credit card numbers)</li>
            <li><strong>Communications:</strong> Messages, feedback, and support requests you send to us</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
          <p>We automatically collect certain information when you use our Service:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Usage Data:</strong> Features used, content generated, time spent, actions taken</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
            <li><strong>Log Data:</strong> Access times, pages viewed, errors encountered</li>
            <li><strong>Cookies and Tracking:</strong> Session cookies, authentication tokens, analytics data</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Information from Third Parties</h3>
          <p>We may receive information from third-party services you connect to AmpedAgent:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Social Media Platforms:</strong> When you connect Instagram, Facebook, or LinkedIn accounts</li>
            <li><strong>OAuth Providers:</strong> Authentication data from login providers</li>
            <li><strong>Payment Processors:</strong> Transaction data from Stripe</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Service Delivery</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Generate AI-powered content based on your inputs</li>
            <li>Process and store your generated content</li>
            <li>Provide access to your content library and history</li>
            <li>Enable social media integrations and posting</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Account Management</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and maintain your account</li>
            <li>Authenticate your identity and manage sessions</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send account-related notifications and updates</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Service Improvement</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Analyze usage patterns to improve features</li>
            <li>Train and refine AI models (using aggregated, anonymized data only)</li>
            <li>Identify and fix technical issues</li>
            <li>Develop new features and services</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Communication</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Respond to your inquiries and support requests</li>
            <li>Send service announcements and updates</li>
            <li>Provide tips, tutorials, and best practices</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.5 Legal and Safety</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Enforce our Terms of Service and policies</li>
            <li>Detect and prevent fraud, abuse, and illegal activity</li>
            <li>Comply with legal obligations and respond to lawful requests</li>
            <li>Protect our rights, property, and safety</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Services</h2>
          <p>
            AmpedAgent integrates with several third-party services to provide our features. These services have their own privacy policies and may collect data independently:
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 AI and Media Services</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>OpenAI:</strong> Powers text generation and content moderation</li>
            <li><strong>D-ID:</strong> Generates AI avatar videos from your headshots</li>
            <li><strong>ElevenLabs:</strong> Provides AI voiceover generation</li>
            <li><strong>Shotstack:</strong> Renders video content with effects and music</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Payment Processing</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Stripe:</strong> Processes all payments and subscriptions. We do not store full credit card numbers.</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Infrastructure and Analytics</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Amazon S3:</strong> Stores uploaded media and generated content</li>
            <li><strong>CloudFront CDN:</strong> Delivers content quickly and securely</li>
            <li><strong>Analytics Services:</strong> Tracks usage patterns and performance</li>
          </ul>

          <p className="mt-4">
            We carefully vet all third-party services for security and privacy compliance. However, we are not responsible for their privacy practices. Please review their privacy policies independently.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Storage and Security</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Data Storage</h3>
          <p>Your data is stored in secure, encrypted databases and cloud storage:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Data:</strong> Stored in encrypted databases with regular backups</li>
            <li><strong>Media Files:</strong> Stored in Amazon S3 with encryption at rest</li>
            <li><strong>Generated Content:</strong> Retained for 90 days unless you delete it earlier</li>
            <li><strong>AI Avatar Videos:</strong> Stored for 90 days, then automatically deleted</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Security Measures</h3>
          <p>We implement industry-standard security measures to protect your data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>SSL/TLS encryption for all data transmission</li>
            <li>Encrypted storage for sensitive information</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and authentication requirements</li>
            <li>Automated content moderation to prevent harmful content</li>
          </ul>

          <p className="mt-4">
            However, no method of transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Retention</h2>
          <p>We retain your information for as long as necessary to provide our Service and comply with legal obligations:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Data:</strong> Retained while your account is active, plus 30 days after deletion</li>
            <li><strong>Generated Content:</strong> Retained for 90 days, then automatically deleted</li>
            <li><strong>Payment Records:</strong> Retained for 7 years for tax and accounting purposes</li>
            <li><strong>Usage Logs:</strong> Retained for 90 days for troubleshooting and analytics</li>
            <li><strong>Legal Holds:</strong> Data may be retained longer if required by law or legal proceedings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Privacy Rights</h2>
          <p>You have the following rights regarding your personal information:</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Access and Portability</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Request a copy of all personal data we hold about you</li>
            <li>Export your generated content in standard formats</li>
            <li>View your account information and usage history</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Correction and Update</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Update your account information at any time through Settings</li>
            <li>Correct inaccurate or incomplete personal data</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Deletion</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Delete your account and associated data at any time</li>
            <li>Request deletion of specific content or information</li>
            <li>Note: Some data may be retained for legal or legitimate business purposes</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.4 Opt-Out and Restrictions</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Opt out of marketing communications (service emails still required)</li>
            <li>Disable certain data collection features</li>
            <li>Restrict processing of your data for specific purposes</li>
          </ul>

          <p className="mt-4">
            To exercise these rights, contact us at <strong>privacy@authoritycontent.co</strong>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Cookies and Tracking</h2>
          <p>We use cookies and similar tracking technologies to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
            <li><strong>Analytics Cookies:</strong> Track usage patterns and performance</li>
            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
          </ul>
          <p className="mt-4">
            You can control cookies through your browser settings, but disabling essential cookies may affect Service functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Children's Privacy</h2>
          <p>
            AmpedAgent is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately at <strong>privacy@authoritycontent.co</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using AmpedAgent, you consent to the transfer of your information to the United States and other countries where we operate.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. California Privacy Rights (CCPA)</h2>
          <p>
            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right to know what personal information is collected, used, shared, or sold</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
            <li>Right to non-discrimination for exercising your privacy rights</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, contact us at <strong>privacy@authoritycontent.co</strong>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. European Privacy Rights (GDPR)</h2>
          <p>
            If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right to access your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure ("right to be forgotten")</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to withdraw consent</li>
          </ul>
          <p className="mt-4">
            To exercise these rights or file a complaint with a supervisory authority, contact us at <strong>privacy@authoritycontent.co</strong>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes via email or through the Service. Your continued use of AmpedAgent after such changes constitutes acceptance of the updated Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
          </p>
          <p className="mt-2">
            <strong>AmpedAgent</strong><br />
            Email: privacy@authoritycontent.co<br />
            Support: support@authoritycontent.co<br />
            Website: https://authoritycontent.co
          </p>
        </section>

        <section className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
          <h3 className="text-lg font-semibold text-primary mb-2">📧 Questions About Your Privacy?</h3>
          <p className="text-primary/80">
            We're committed to transparency and protecting your data. If you have any questions about how we handle your information, please don't hesitate to reach out to our privacy team at <strong>privacy@authoritycontent.co</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
