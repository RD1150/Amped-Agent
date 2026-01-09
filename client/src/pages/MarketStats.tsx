import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Home, DollarSign, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function MarketStats() {
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const utils = trpc.useUtils();

  const handleSearch = async () => {
    if (!location.trim()) {
      toast.error("Please enter a city, zipcode, or address");
      return;
    }

    setIsSearching(true);
    
    // TODO: Implement market stats API call
    setTimeout(() => {
      setIsSearching(false);
      toast.info("Market stats feature coming soon!");
    }, 1000);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market Statistics</h1>
          <p className="text-muted-foreground mt-1">
            Get real-time market data and generate insights for any location
          </p>
        </div>
      </div>

      {/* Search Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Search Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter city, zipcode, or address..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Stats Display - Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Median Home Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">--</p>
            <p className="text-xs text-muted-foreground mt-1">Search a location to see data</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Days on Market
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">--</p>
            <p className="text-xs text-muted-foreground mt-1">Average time to sell</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Home className="h-4 w-4" />
              Active Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">--</p>
            <p className="text-xs text-muted-foreground mt-1">Current inventory</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Price per Sq Ft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">--</p>
            <p className="text-xs text-muted-foreground mt-1">Average pricing</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Generate Post Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Market Update Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Once you search for a location, you'll be able to generate AI-powered market update posts with insights and statistics.
          </p>
          <Button disabled className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Post (Search location first)
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-secondary/30 border-border">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">What You'll Get:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Real-time market statistics for any city, zipcode, or neighborhood</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Year-over-year trends and market temperature analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>AI-generated market insights and social media captions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>One-click posting to your content calendar</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
