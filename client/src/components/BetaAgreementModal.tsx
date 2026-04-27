import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShieldCheck, Lock, AlertTriangle } from "lucide-react";

interface BetaAgreementModalProps {
  open: boolean;
  onAccepted: () => void;
}

export function BetaAgreementModal({ open, onAccepted }: BetaAgreementModalProps) {
  const [agreedConfidential, setAgreedConfidential] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const acceptBetaAgreement = trpc.auth.acceptBetaAgreement.useMutation({
    onSuccess: () => {
      toast.success("Welcome to the Amped Agent beta program!");
      onAccepted();
    },
    onError: (err) => {
      toast.error(`Error recording agreement: ${err.message}`);
    },
  });

  const canProceed = agreedConfidential && agreedTerms;

  const handleAccept = () => {
    if (!canProceed) return;
    acceptBetaAgreement.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="text-xl">Beta Tester Agreement</DialogTitle>
          </div>
          <DialogDescription>
            Before accessing Amped Agent, please review and accept the following
            agreement. This is required to participate in the beta program.
          </DialogDescription>
        </DialogHeader>

        {/* Agreement body */}
        <ScrollArea className="h-64 rounded-md border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
          <div className="space-y-4 pr-2">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Confidentiality</p>
                <p>
                  All features, workflows, content, design, and functionality of
                  Amped Agent are confidential and proprietary. You agree not to
                  disclose, share, screenshot, record, or describe the platform
                  to any third party without prior written consent from Amped
                  Agent LLC.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">No Reverse Engineering or Competitive Use</p>
                <p>
                  You agree not to reverse engineer, decompile, copy, reproduce,
                  or use any part of the platform to build a competing product or
                  service. Access is granted solely for personal beta testing and
                  feedback purposes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Feedback Ownership</p>
                <p>
                  Any feedback, suggestions, ideas, or bug reports you submit
                  become the sole property of Amped Agent LLC. You grant Amped
                  Agent a perpetual, irrevocable, royalty-free license to use
                  your feedback in any manner without compensation or attribution.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Beta Software Disclaimer</p>
                <p>
                  This is pre-release beta software provided "as is" without
                  warranty of any kind. Features may change, be removed, or
                  behave unexpectedly. Amped Agent LLC is not liable for any
                  loss of data, business interruption, or damages arising from
                  your use of the beta platform.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Trade Secrets & Intellectual Property</p>
                <p>
                  The platform, its architecture, AI workflows, prompt systems,
                  algorithms, and business logic constitute trade secrets and
                  proprietary intellectual property of Amped Agent LLC. Unauthorized
                  use, disclosure, or reproduction may result in legal action.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground border-t pt-3">
              By accepting, you acknowledge that you have read, understood, and
              agree to be bound by this Beta Tester Agreement and the{" "}
              <a
                href="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                Terms of Service
              </a>
              . This agreement is legally binding.
            </p>
          </div>
        </ScrollArea>

        {/* Checkboxes */}
        <div className="space-y-3 mt-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="agree-confidential"
              checked={agreedConfidential}
              onCheckedChange={(v) => setAgreedConfidential(!!v)}
              className="mt-0.5"
            />
            <Label
              htmlFor="agree-confidential"
              className="text-sm leading-snug cursor-pointer"
            >
              I agree to keep all platform details, features, and functionality
              strictly confidential and will not disclose them to any third party.
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="agree-terms"
              checked={agreedTerms}
              onCheckedChange={(v) => setAgreedTerms(!!v)}
              className="mt-0.5"
            />
            <Label
              htmlFor="agree-terms"
              className="text-sm leading-snug cursor-pointer"
            >
              I have read and agree to the{" "}
              <a
                href="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                Beta Tester Agreement &amp; Terms of Service
              </a>
              , including the no reverse-engineering, feedback ownership, and
              beta disclaimer clauses.
            </Label>
          </div>
        </div>

        {/* CTA */}
        <Button
          className="w-full mt-2"
          disabled={!canProceed || acceptBetaAgreement.isPending}
          onClick={handleAccept}
        >
          {acceptBetaAgreement.isPending ? "Recording agreement..." : "I Agree & Continue"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
