import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      question: "How does Amped Agent work?",
      answer: "Amped Agent uses AI to generate professional social media content tailored to your target audience. Simply choose your audience (buyers, sellers, luxury buyers, etc.), select a template, and our AI creates engaging posts with beautiful graphics featuring your branding."
    },
    {
      question: "Can I customize the generated content?",
      answer: "Yes! You can customize the message text on any graphic, toggle your headshot on/off, and edit your branding information (name, DRE, brokerage, phone) at any time in your Account settings."
    },
    {
      question: "What social platforms can I post to?",
      answer: "You can post to LinkedIn, Facebook, Instagram, and X/Twitter. Connect your accounts in the Integrations page to enable one-click posting to multiple platforms simultaneously."
    },
    {
      question: "How many posts can I generate per month?",
      answer: "During the beta period, you have unlimited post generation. After launch, pricing tiers will be based on monthly post volume and features."
    },
    {
      question: "Do I need to provide my own images?",
      answer: "No! Every template comes with professionally generated background images (luxury estates, family homes, modern interiors, etc.) that match your audience and message. You can also upload your own property photos if desired."
    },
    {
      question: "Can I schedule posts in advance?",
      answer: "Yes! Use the Content Calendar to schedule posts for future dates and times. You can also bulk-upload property listings via CSV or Google Doc to auto-generate a month's worth of content."
    },
    {
      question: "What information appears on my posts?",
      answer: "Your posts display your agent name, DRE license number, brokerage name, brokerage DRE, phone number, and optional headshot. This ensures compliance and builds your personal brand."
    },
    {
      question: "Is my data secure?",
      answer: "Yes! All data is encrypted and stored securely. We never share your information with third parties. See our Privacy Policy for details."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes! There are no long-term contracts. You can cancel your subscription at any time from your Account settings."
    },
    {
      question: "Do you offer training or support?",
      answer: "Yes! We provide video tutorials, live onboarding calls, and email support. Contact us anytime at support@realtycontentagent.com."
    },
    {
      question: "What is Newsletter Builder?",
      answer: "Newsletter Builder is an Agency feature that gives you access to Newsletter Pro - a professional email newsletter creation tool. Design beautiful newsletters with a drag-and-drop editor, then download them to use with any email platform you already have (Mailchimp, Constant Contact, ActiveCampaign, etc.)."
    },
    {
      question: "How do I use newsletters with my email system?",
      answer: "It's simple! Create your newsletter in Newsletter Pro, download it as HTML or PDF, then upload it to your existing email marketing platform. This works with any CRM or email service - you're not locked into a specific system."
    },
    {
      question: "What's included in the Agency tier?",
      answer: "Agency ($149/month) includes everything in Professional, plus: 30 Script-to-Reel videos per month, full Newsletter Builder access, email list management tools, newsletter templates, email analytics, automated campaigns, voice cloning, multiple avatar styles, and priority support."
    },
    {
      question: "Do I need Newsletter Builder if I already have an email system?",
      answer: "Newsletter Builder is a creation tool, not a replacement for your email system. Use it to design professional newsletters quickly, then export them to your existing platform. It saves time on design while letting you keep your current subscriber lists and sending infrastructure."
    },
    {
      question: "Can I try Newsletter Builder before upgrading?",
      answer: "Premium tier includes a 14-day free trial. You can test Newsletter Builder and all Premium features risk-free before committing to the subscription."
    }
  ];

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about Amped Agent
          </p>
        </div>

        <Card className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <div className="text-center space-y-2 pt-4">
          <p className="text-sm text-muted-foreground">
            Still have questions?
          </p>
          <a 
            href="/contact" 
            className="text-sm text-primary hover:underline font-medium"
          >
            Contact our support team →
          </a>
        </div>
      </div>
    </div>
  );
}
