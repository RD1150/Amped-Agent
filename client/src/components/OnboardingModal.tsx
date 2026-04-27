import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Building2, MapPin, Clock, ChevronRight, X, Plus } from "lucide-react";

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

const US_STATES_ABBR: Record<string, string> = {
  Alabama:"AL",Alaska:"AK",Arizona:"AZ",Arkansas:"AR",California:"CA",Colorado:"CO",
  Connecticut:"CT",Delaware:"DE",Florida:"FL",Georgia:"GA",Hawaii:"HI",Idaho:"ID",
  Illinois:"IL",Indiana:"IN",Iowa:"IA",Kansas:"KS",Kentucky:"KY",Louisiana:"LA",
  Maine:"ME",Maryland:"MD",Massachusetts:"MA",Michigan:"MI",Minnesota:"MN",
  Mississippi:"MS",Missouri:"MO",Montana:"MT",Nebraska:"NE",Nevada:"NV",
  "New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY",
  "North Carolina":"NC","North Dakota":"ND",Ohio:"OH",Oklahoma:"OK",Oregon:"OR",
  Pennsylvania:"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD",
  Tennessee:"TN",Texas:"TX",Utah:"UT",Vermont:"VT",Virginia:"VA",Washington:"WA",
  "West Virginia":"WV",Wisconsin:"WI",Wyoming:"WY","Washington D.C.":"DC"
};

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "Less than 1 year" },
  { value: "1", label: "1–2 years" },
  { value: "3", label: "3–5 years" },
  { value: "6", label: "6–10 years" },
  { value: "11", label: "11–20 years" },
  { value: "21", label: "20+ years" },
];

const MAX_CITIES = 10;

interface CityEntry { city: string; state: string; }

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [brokerageName, setBrokerageName] = useState("");
  const [cityEntries, setCityEntries] = useState<CityEntry[]>([{ city: "", state: "" }]);
  const [yearsExperience, setYearsExperience] = useState("");

  const saveOnboarding = trpc.auth.saveOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Welcome to Amped Agent! Your profile has been set up.");
      onComplete();
    },
    onError: (err) => {
      toast.error(`Error saving profile: ${err.message}`);
    },
  });

  const addCity = () => {
    if (cityEntries.length < MAX_CITIES) setCityEntries([...cityEntries, { city: "", state: "" }]);
  };

  const updateCity = (idx: number, field: keyof CityEntry, val: string) => {
    const updated = [...cityEntries];
    updated[idx] = { ...updated[idx], [field]: val };
    setCityEntries(updated);
  };

  const removeCity = (idx: number) => {
    if (cityEntries.length === 1) return;
    setCityEntries(cityEntries.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEntries = cityEntries.filter((e) => e.city.trim());
    if (!brokerageName.trim() || validEntries.length === 0 || !yearsExperience) {
      toast.error("Please fill in all fields and at least one city");
      return;
    }
    if (validEntries.some((e) => !e.state)) {
      toast.error("Please select a state for each city");
      return;
    }
    const abbr = (s: string) => US_STATES_ABBR[s] || s;
    saveOnboarding.mutate({
      brokerageName: brokerageName.trim(),
      primaryCity: validEntries[0].city.trim(),
      primaryState: abbr(validEntries[0].state),
      yearsExperience: parseInt(yearsExperience, 10),
      serviceCities: validEntries.map((e) => ({ city: e.city.trim(), state: abbr(e.state) })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="text-xl">Welcome to Amped Agent</DialogTitle>
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

          {/* Cities + per-city State */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              What markets do you serve?
              <span className="text-xs text-muted-foreground font-normal ml-1">(up to {MAX_CITIES})</span>
            </Label>

            <div className="space-y-2">
              {cityEntries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    placeholder={idx === 0 ? "Primary city or county" : `City or county ${idx + 1}`}
                    value={entry.city}
                    onChange={(e) => updateCity(idx, "city", e.target.value)}
                    className="flex-1 min-w-0"
                    required={idx === 0}
                  />
                  <Select value={entry.state} onValueChange={(v) => updateCity(idx, "state", v)}>
                    <SelectTrigger className="w-[90px] shrink-0">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {US_STATES_ABBR[state] || state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {cityEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCity(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {cityEntries.length < MAX_CITIES && (
              <button
                type="button"
                onClick={addCity}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
              >
                <Plus className="w-3 h-3" />
                Add another city or county
              </button>
            )}
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
