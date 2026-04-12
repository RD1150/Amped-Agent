import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";

interface TermsAcceptanceModalProps {
  open: boolean;
  onAccept: () => void;
}

export default function TermsAcceptanceModal({ open, onAccept }: TermsAcceptanceModalProps) {
  const [hasRead, setHasRead] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted && hasRead) {
      onAccept();
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Welcome to Amped Agent</DialogTitle>
          <DialogDescription>
            Please review and accept our Terms of Service to continue
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">Content Responsibility</h3>
              <p className="text-muted-foreground">
                You are solely responsible for all content generated using Amped Agent. This includes ensuring accuracy of property information, compliance with Fair Housing Act regulations, and obtaining necessary permissions for uploaded media.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Fair Housing Compliance</h3>
              <p className="text-muted-foreground">
                All content must comply with the Fair Housing Act. You agree not to create content that discriminates based on race, color, religion, national origin, sex, familial status, or disability. While our system includes automated compliance checks, you remain solely responsible for ensuring your content meets all legal requirements.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Prohibited Content</h3>
              <p className="text-muted-foreground mb-2">You agree not to generate, upload, or distribute content that:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Violates anti-discrimination laws</li>
                <li>Contains hate speech, harassment, or threats</li>
                <li>Includes sexually explicit, violent, or graphic material</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains false, misleading, or deceptive information</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Content Moderation</h3>
              <p className="text-muted-foreground">
                Amped Agent employs automated content moderation systems to detect potentially harmful or non-compliant content. We reserve the right to block generation of content that violates our policies, suspend accounts that repeatedly violate these terms, and report illegal activity to appropriate authorities.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Limitation of Liability</h3>
              <p className="text-muted-foreground">
                Amped Agent is provided "as is" without warranties. We are not liable for any consequences resulting from your use of generated content. You agree to indemnify and hold harmless Amped Agent from any claims arising from your use of the service.
              </p>
            </section>

            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary">
                <strong>Important:</strong> By accepting these terms, you acknowledge that you have read, understood, and agree to be bound by our Terms of Service. You are solely responsible for all content you generate and publish using Amped Agent.
              </p>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              For complete terms, visit{" "}
              <Link href="/terms-of-service" className="text-primary hover:underline">
                Terms of Service
              </Link>
            </p>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-col gap-4">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="read" 
              checked={hasRead}
              onCheckedChange={(checked) => setHasRead(checked === true)}
            />
            <label
              htmlFor="read"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and understood the key terms above
            </label>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="accept" 
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              disabled={!hasRead}
            />
            <label
              htmlFor="accept"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I accept the Terms of Service and agree to be bound by them
            </label>
          </div>

          <Button 
            onClick={handleAccept} 
            disabled={!accepted || !hasRead}
            className="w-full"
          >
            Continue to Amped Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
