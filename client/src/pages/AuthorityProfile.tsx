import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Target, Sparkles, TrendingUp, Save } from "lucide-react";

export default function AuthorityProfile() {
  const { data: persona, isLoading } = trpc.persona.get.useQuery();
  
  // Customer Avatar
  const [avatarType, setAvatarType] = useState("");
  const [avatarDescription, setAvatarDescription] = useState("");
  
  // Brand Values
  const [brandValues, setBrandValues] = useState<string[]>([]);
  const [newBrandValue, setNewBrandValue] = useState("");
  
  // Market Context
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [marketType, setMarketType] = useState("");
  const [keyTrends, setKeyTrends] = useState<string[]>([]);
  const [newTrend, setNewTrend] = useState("");

  useEffect(() => {
    if (persona) {
      // Parse customer avatar
      if (persona.customerAvatar) {
        try {
          const avatar = JSON.parse(persona.customerAvatar);
          setAvatarType(avatar.type || "");
          setAvatarDescription(avatar.description || "");
        } catch (e) {
          console.error("Failed to parse customerAvatar", e);
        }
      }
      
      // Parse brand values
      if (persona.brandValues) {
        try {
          const values = JSON.parse(persona.brandValues);
          setBrandValues(Array.isArray(values) ? values : []);
        } catch (e) {
          console.error("Failed to parse brandValues", e);
        }
      }
      
      // Parse market context
      if (persona.marketContext) {
        try {
          const market = JSON.parse(persona.marketContext);
          setCity(market.city || "");
          setState(market.state || "");
          setMarketType(market.marketType || "");
          setKeyTrends(Array.isArray(market.keyTrends) ? market.keyTrends : []);
        } catch (e) {
          console.error("Failed to parse marketContext", e);
        }
      }
    }
  }, [persona]);

  const updateProfile = trpc.persona.updateAuthorityProfile.useMutation({
    onSuccess: () => {
      toast.success("Authority Profile updated!");
    },
    onError: (error: any) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!avatarType) {
      toast.error("Please select a customer avatar type");
      return;
    }

    updateProfile.mutate({
      customerAvatar: JSON.stringify({
        type: avatarType,
        description: avatarDescription,
      }),
      brandValues: JSON.stringify(brandValues),
      marketContext: JSON.stringify({
        city,
        state,
        marketType,
        keyTrends,
      }),
    });
  };

  const addBrandValue = () => {
    if (newBrandValue.trim() && brandValues.length < 5) {
      setBrandValues([...brandValues, newBrandValue.trim()]);
      setNewBrandValue("");
    }
  };

  const removeBrandValue = (index: number) => {
    setBrandValues(brandValues.filter((_, i) => i !== index));
  };

  const addTrend = () => {
    if (newTrend.trim() && keyTrends.length < 5) {
      setKeyTrends([...keyTrends, newTrend.trim()]);
      setNewTrend("");
    }
  };

  const removeTrend = (index: number) => {
    setKeyTrends(keyTrends.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Authority Profile</h1>
        <p className="text-muted-foreground">
          Define your customer avatar, brand values, and market context to get personalized content analysis from the Performance Coach
        </p>
      </div>

      <div className="space-y-6">
        {/* Customer Avatar */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Customer Avatar
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Who are you trying to reach with your content?
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="avatarType">Primary Audience</Label>
              <Select value={avatarType} onValueChange={setAvatarType}>
                <SelectTrigger id="avatarType" className="mt-1.5">
                  <SelectValue placeholder="Select your target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first-time-buyers">First-Time Home Buyers</SelectItem>
                  <SelectItem value="luxury-sellers">Luxury Sellers</SelectItem>
                  <SelectItem value="investors">Real Estate Investors</SelectItem>
                  <SelectItem value="relocators">Relocating Families</SelectItem>
                  <SelectItem value="downsizers">Downsizers/Empty Nesters</SelectItem>
                  <SelectItem value="move-up-buyers">Move-Up Buyers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="avatarDescription">Audience Description</Label>
              <Textarea
                id="avatarDescription"
                placeholder="Describe your ideal client in detail (e.g., 'Young professionals, 28-35, first-time buyers, tech industry, value modern design and walkability')"
                value={avatarDescription}
                onChange={(e) => setAvatarDescription(e.target.value)}
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
        </Card>

        {/* Brand Values */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Brand Values
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            What core values define your personal brand? (Max 5)
          </p>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Trust, Local Expertise, Family-Focused"
                value={newBrandValue}
                onChange={(e) => setNewBrandValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addBrandValue()}
                disabled={brandValues.length >= 5}
              />
              <Button onClick={addBrandValue} disabled={brandValues.length >= 5}>
                Add
              </Button>
            </div>

            {brandValues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {brandValues.map((value, index) => (
                  <div
                    key={index}
                    className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                  >
                    {value}
                    <button
                      onClick={() => removeBrandValue(index)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Market Context */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Market Context
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tell us about your local market
          </p>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., San Francisco"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="e.g., CA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="marketType">Market Type</Label>
              <Select value={marketType} onValueChange={setMarketType}>
                <SelectTrigger id="marketType" className="mt-1.5">
                  <SelectValue placeholder="Select market type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">Hot Market (Seller's Market)</SelectItem>
                  <SelectItem value="balanced">Balanced Market</SelectItem>
                  <SelectItem value="buyers">Buyer's Market</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Key Market Trends (Max 5)</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  placeholder="e.g., Rising inventory, Tech layoffs, New construction boom"
                  value={newTrend}
                  onChange={(e) => setNewTrend(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTrend()}
                  disabled={keyTrends.length >= 5}
                />
                <Button onClick={addTrend} disabled={keyTrends.length >= 5}>
                  Add
                </Button>
              </div>

              {keyTrends.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {keyTrends.map((trend, index) => (
                    <div
                      key={index}
                      className="bg-muted px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                    >
                      {trend}
                      <button
                        onClick={() => removeTrend(index)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          size="lg"
          className="w-full"
        >
          {updateProfile.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Authority Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
