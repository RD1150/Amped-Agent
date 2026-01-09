import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Introduction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Welcome to Realty Content Agent ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
          <p>
            Realty Content Agent is a premium real estate content AI platform that helps real estate professionals create, schedule, and publish 
            engaging social media content. By using our service, you agree to the collection and use of information in accordance with this policy.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h3 className="text-foreground font-semibold mb-2">Personal Information</h3>
            <p>When you register for Realty Content Agent, we collect:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Name and email address</li>
              <li>Business information (business name, website, phone number)</li>
              <li>Brand preferences (colors, voice, target audience)</li>
              <li>Social media account information when you connect platforms</li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Content Data</h3>
            <p>We collect and store:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Content you create or generate using our AI tools</li>
              <li>Property listings and market data you input</li>
              <li>Images and media files you upload</li>
              <li>Scheduling preferences and calendar data</li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Social Media Integration Data</h3>
            <p>When you connect social media accounts (Facebook, Instagram, LinkedIn, X), we collect:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Access tokens to post content on your behalf</li>
              <li>Page and account information</li>
              <li>Post engagement metrics (views, likes, comments, shares)</li>
              <li>We do NOT access your personal messages or private information</li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Usage Information</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Device information (browser type, operating system)</li>
              <li>Usage patterns and feature interactions</li>
              <li>Log data (IP address, access times, pages viewed)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>We use your information to:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong className="text-foreground">Provide Services:</strong> Generate AI content, schedule posts, manage your social media presence</li>
            <li><strong className="text-foreground">Personalization:</strong> Customize content based on your brand voice and preferences</li>
            <li><strong className="text-foreground">Analytics:</strong> Track post performance and provide engagement insights</li>
            <li><strong className="text-foreground">Communication:</strong> Send service updates, feature announcements, and support responses</li>
            <li><strong className="text-foreground">Improvement:</strong> Analyze usage patterns to enhance our platform</li>
            <li><strong className="text-foreground">Security:</strong> Detect and prevent fraud, abuse, and security incidents</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Data Sharing and Disclosure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>We do not sell your personal information. We may share your data with:</p>
          
          <div>
            <h3 className="text-foreground font-semibold mb-2">Service Providers</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Cloud hosting providers (for data storage)</li>
              <li>AI service providers (for content generation)</li>
              <li>Analytics services (for platform improvement)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Social Media Platforms</h3>
            <p>
              When you authorize us to post on your behalf, we share content with Facebook, Instagram, LinkedIn, and X 
              according to your instructions. This is necessary to provide our core service.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Legal Requirements</h3>
            <p>
              We may disclose your information if required by law, court order, or to protect our rights, property, or safety.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Data Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            We implement industry-standard security measures to protect your data:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Encryption of data in transit (HTTPS/TLS)</li>
            <li>Encryption of sensitive data at rest (access tokens, passwords)</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication</li>
            <li>Secure cloud infrastructure</li>
          </ul>
          <p className="mt-4">
            However, no method of transmission over the internet is 100% secure. While we strive to protect your data, 
            we cannot guarantee absolute security.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Your Rights and Choices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong className="text-foreground">Access:</strong> Request a copy of your personal data</li>
            <li><strong className="text-foreground">Correction:</strong> Update or correct inaccurate information</li>
            <li><strong className="text-foreground">Deletion:</strong> Request deletion of your data (see Data Deletion section)</li>
            <li><strong className="text-foreground">Export:</strong> Download your content and data</li>
            <li><strong className="text-foreground">Disconnect:</strong> Revoke social media integrations at any time</li>
            <li><strong className="text-foreground">Opt-out:</strong> Unsubscribe from marketing communications</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, contact us at <a href="mailto:sold@reenadutta.com" className="text-primary hover:underline">sold@reenadutta.com</a>
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            We retain your information for as long as your account is active or as needed to provide services. 
            When you delete your account, we will delete or anonymize your data within 30 days, except where:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Required by law to retain longer</li>
            <li>Necessary to resolve disputes or enforce agreements</li>
            <li>Needed for legitimate business purposes (fraud prevention, security)</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Third-Party Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Our platform integrates with third-party services (Facebook, Instagram, LinkedIn, X, GoHighLevel). 
            These services have their own privacy policies:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Facebook Privacy Policy</a></li>
            <li><a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Instagram Privacy Policy</a></li>
            <li><a href="https://www.linkedin.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn Privacy Policy</a></li>
            <li><a href="https://twitter.com/en/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">X (Twitter) Privacy Policy</a></li>
          </ul>
          <p className="mt-4">
            We are not responsible for the privacy practices of these third-party services.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Children's Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Realty Content Agent is not intended for use by individuals under 18 years of age. We do not knowingly collect 
            personal information from children. If you believe we have collected data from a child, please contact us immediately.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>International Data Transfers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate 
            safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Changes to This Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by email or 
            through a prominent notice on our platform. Your continued use of Realty Content Agent after changes constitutes acceptance 
            of the updated policy.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="mt-4 space-y-1">
            <p><strong className="text-foreground">Email:</strong> <a href="mailto:sold@reenadutta.com" className="text-primary hover:underline">sold@reenadutta.com</a></p>
            <p><strong className="text-foreground">Data Deletion:</strong> <a href="/data-deletion" className="text-primary hover:underline">Submit a data deletion request</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
