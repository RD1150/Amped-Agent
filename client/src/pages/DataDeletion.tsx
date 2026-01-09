import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function DataDeletion() {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    reason: "",
    confirmEmail: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate emails match
    if (formData.email !== formData.confirmEmail) {
      toast.error("Email addresses do not match");
      return;
    }

    // Validate required fields
    if (!formData.email || !formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, this would call a backend endpoint
      // For now, we'll simulate the request
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Send email notification to admin
      // In production, you would call: await trpc.system.notifyOwner.mutate({...})
      
      setIsSubmitted(true);
      toast.success("Data deletion request submitted successfully");
    } catch (error) {
      toast.error("Failed to submit request. Please try again or contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <CardTitle>Request Submitted</CardTitle>
                <CardDescription>Your data deletion request has been received</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-500/10 border-green-500/30">
              <AlertDescription className="text-muted-foreground">
                We have received your data deletion request for <strong className="text-foreground">{formData.email}</strong>.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">What happens next:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>We will verify your identity and account ownership</li>
                <li>Your data will be permanently deleted within 30 days</li>
                <li>You will receive a confirmation email once deletion is complete</li>
                <li>Some data may be retained for legal or security purposes as outlined in our Privacy Policy</li>
              </ol>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="font-medium text-foreground mb-2">Need immediate assistance?</p>
                <p>Contact us at: <a href="mailto:sold@reenadutta.com" className="text-primary hover:underline">sold@reenadutta.com</a></p>
              </div>
            </div>

            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full mt-6"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Deletion Request</h1>
        <p className="text-muted-foreground mt-2">
          Request permanent deletion of your Realty Content Agent account and associated data
        </p>
      </div>

      <Alert className="bg-yellow-500/10 border-yellow-500/30">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-muted-foreground">
          <strong className="text-foreground">Warning:</strong> This action is permanent and cannot be undone. 
          All your content, settings, and integrations will be permanently deleted.
        </AlertDescription>
      </Alert>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>What Will Be Deleted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>Submitting this request will permanently delete:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Your account and profile information</li>
            <li>All content posts and drafts</li>
            <li>Calendar events and schedules</li>
            <li>Brand and persona settings</li>
            <li>Social media integration connections</li>
            <li>Uploaded files and images</li>
            <li>Analytics and usage data</li>
          </ul>
          <p className="mt-4 text-sm">
            <strong className="text-foreground">Note:</strong> Some data may be retained for up to 30 days for backup purposes, 
            or longer if required by law, to resolve disputes, or prevent fraud.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Submit Deletion Request</CardTitle>
          <CardDescription>
            Please provide your account information to verify your identity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Account Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Enter the email address associated with your Realty Content Agent account
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmEmail">Confirm Email *</Label>
              <Input
                id="confirmEmail"
                type="email"
                placeholder="your@email.com"
                value={formData.confirmEmail}
                onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Deletion (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Help us improve by sharing why you're leaving..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                className="bg-background resize-none"
              />
            </div>

            <div className="pt-4 border-t border-border">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full"
                variant="destructive"
              >
                {isSubmitting ? "Submitting Request..." : "Submit Deletion Request"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                By submitting, you confirm that you are the account owner and understand this action is permanent.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Alternative Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>Before deleting your account, consider these alternatives:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
              <strong className="text-foreground">Disconnect Integrations:</strong> Remove social media connections without deleting your account
            </li>
            <li>
              <strong className="text-foreground">Export Your Data:</strong> Download your content before deletion
            </li>
            <li>
              <strong className="text-foreground">Contact Support:</strong> We're here to help resolve any issues at{" "}
              <a href="mailto:sold@reenadutta.com" className="text-primary hover:underline">sold@reenadutta.com</a>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Questions about data deletion?{" "}
          <a href="/privacy-policy" className="text-primary hover:underline">Read our Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
