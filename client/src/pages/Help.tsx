import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Video, 
  Mail,
  ExternalLink,
  Sparkles
} from "lucide-react";

const faqs = [
  {
    question: "How do I connect my social media accounts?",
    answer: "Navigate to the Integrations page from the sidebar. Click 'Connect' on the platform you want to link. You'll be redirected to authorize LuxEstate to post on your behalf. Make sure you have a business account for Facebook and Instagram."
  },
  {
    question: "How does the AI content generation work?",
    answer: "Our AI analyzes your brand settings, target audience, and the topic you provide to create engaging real estate content. You can generate property listings, market reports, tips, and more. The AI uses your brand voice to ensure consistency."
  },
  {
    question: "Can I import my property listings from a CSV file?",
    answer: "Yes! Go to the Import Data page and upload a CSV file with your property listings. The system will automatically parse the data and generate social media posts for each property, scheduling them across your calendar."
  },
  {
    question: "How do I schedule posts for specific times?",
    answer: "When creating content, you can select a date from the calendar or use the schedule option in the content creation dialog. Posts will be queued and published at the scheduled time once you connect your social media accounts."
  },
  {
    question: "What social media platforms are supported?",
    answer: "LuxEstate currently supports Facebook Business Pages, Instagram Business/Creator accounts, LinkedIn, and X (Twitter). Each platform requires proper authorization and business account setup."
  },
  {
    question: "How do I customize my brand voice?",
    answer: "Visit the Persona & Brand page to set up your business information, target audience, and preferred brand voice (professional, friendly, luxury, casual, or authoritative). The AI will use these settings when generating content."
  },
  {
    question: "Can I edit AI-generated content before posting?",
    answer: "Absolutely! All generated content is saved as drafts first. You can edit, refine, and customize any content before scheduling or publishing it to your social media accounts."
  },
  {
    question: "What file formats are supported for uploads?",
    answer: "You can upload images (JPG, PNG, GIF), documents (PDF, DOC, DOCX), and data files (CSV). Images can be used in your posts, while CSV files can be used for bulk property imports."
  },
];

export default function Help() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground mt-1">
          Get help with LuxEstate and learn how to make the most of your content
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border card-hover cursor-pointer">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">Documentation</p>
            <p className="text-xs text-muted-foreground">Read the guides</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border card-hover cursor-pointer">
          <CardContent className="p-4 text-center">
            <Video className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">Video Tutorials</p>
            <p className="text-xs text-muted-foreground">Watch and learn</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border card-hover cursor-pointer">
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">Live Chat</p>
            <p className="text-xs text-muted-foreground">Talk to support</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border card-hover cursor-pointer">
          <CardContent className="p-4 text-center">
            <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">Email Support</p>
            <p className="text-xs text-muted-foreground">Get in touch</p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Getting Started
          </CardTitle>
          <CardDescription>
            Follow these steps to set up your LuxEstate account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Set Up Your Brand</p>
                <p className="text-sm text-muted-foreground">
                  Go to Persona & Brand to define your business name, target audience, and preferred tone of voice.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Connect Social Media</p>
                <p className="text-sm text-muted-foreground">
                  Link your Facebook, Instagram, LinkedIn, or X accounts in the Integrations page.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Import Your Listings</p>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV with your property listings to auto-generate a month of content.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <p className="font-medium">Generate & Schedule</p>
                <p className="text-sm text-muted-foreground">
                  Use the AI Generator or Content Calendar to create and schedule your posts.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-medium text-lg">Still need help?</p>
              <p className="text-muted-foreground">
                Our support team is here to assist you with any questions.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email Support
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Live Chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
