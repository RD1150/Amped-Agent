import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Building2, MapPin, Clock, ChevronRight } from "lucide-react";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","Washington D.C."
];

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "Less than 1 year" },
  { value: "1", label: "1–2 years" },
  { value: "3", label: "3–5 years" },
  { value: "6", label: "6–10 years" },
  { value: "11", label: "11–20 years" },
  { value: "21", label: "20+ years" },
];

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [brokerageName, setBrokerageName] = useState("");
  const [primaryCity, setPrimaryCity] = useState("");
  const [primaryState, setPrimaryState] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");

  const saveOnboarding = trpc.auth.saveOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Welcome to Authority Content! Your profile has been set up.");
      onComplete();
    },
    onError: (err) => {
      toast.error(`Error saving profile: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerageName.trim() || !primaryCity.trim() || !primaryState || !yearsExperience) {
      toast.error("Please fill in all fields");
      return;
    }
    saveOnboarding.mutate({
      brokerageName: brokerageName.trim(),
      primaryCity: primaryCity.trim(),
      primaryState,
      yearsExperience: parseInt(yearsExperience, 10),
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-amber-700" />
            </div>
            <DialogTitle className="text-xl">Welcome to Authority Content</DialogTitle>
          </div>
          <DialogDescription>
            Tell us a bit about yourself so we can personalize your content experience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Brokerage */}
          <div className="space-y-1.5">
            <Label htmlFor="brokerage" className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              Which brokerage are you with?
            </Label>
            <Input
              id="brokerage"
              placeholder="e.g. Keller Williams, RE/MAX, Coldwell Banker..."
              value={brokerageName}
              onChange={(e) => setBrokerageName(e.target.value)}
              required
            />
          </div>

          {/* City + State */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              What market do you serve?
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="City"
                value={primaryCity}
                onChange={(e) => setPrimaryCity(e.target.value)}
                required
                className="flex-1"
              />
              <Select value={primaryState} onValueChange={setPrimaryState} required>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Years of Experience */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              How long have you been in real estate?
            </Label>
            <Select value={yearsExperience} onValueChange={setYearsExperience} required>
              <SelectTrigger>
                <SelectValue placeholder="Select years of experience" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={saveOnboarding.isPending}
          >
            {saveOnboarding.isPending ? "Saving..." : (
              <span className="flex items-center gap-1.5">
                Get Started <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
