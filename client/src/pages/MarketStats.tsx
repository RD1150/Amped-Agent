import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, TrendingUp, Home, DollarSign, Calendar, Sparkles, TrendingDown, Minus, Mic, Video, Loader2 } from "lucide-react";

interface MarketData {
  location: string;
  medianPrice: number;
  priceChange: number;
  daysOnMarket: number;
  activeListings: number;
  inventoryChange: number;
  pricePerSqft: number;
  marketTemperature: 'hot' | 'balanced' | 'cold';
  insights?: string[];
}

export default function MarketStats() {
  const [location, setLocation] = useState("");
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Voiceover state
  const [enableVoiceover, setEnableVoiceover] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { data: voicePref } = trpc.auth.getVoicePreference.useQuery();
  const generateMarketVideoMutation = trpc.marketStats.generateMarketVideo.useMutation();
  const utils = trpc.useUtils();

  // Fetch market stats (mock data for now)
  const fetchMarketStats = trpc.marketStats.getMarketData.useMutation({
    onSuccess: (data: any) => {
      setMarketData(data);
    },
    onError: (error: any) => {
      alert(`Error: ${error.message}`);
    },
  });

  // Generate post from market stats
  const generatePostMutation = trpc.marketStats.generateMarketPost.useMutation({
    onSuccess: () => {
      alert('Market stats post generated! Check your content calendar.');
      setIsGenerating(false);
    },
    onError: (error: any) => {
      alert(`Generation failed: ${error.message}`);
      setIsGenerating(false);
    },
  });

  const handleSearch = async () => {
    if (!location.trim()) {
      alert("Please enter a city, state, or zipcode");
      return;
    }

    fetchMarketStats.mutate({ location });
  };

  const handleGeneratePost = async () => {
    if (!marketData) return;
    
    setIsGenerating(true);
    await generatePostMutation.mutateAsync({
      location: marketData.location,
      medianPrice: marketData.medianPrice,
      priceChange: marketData.priceChange,
      daysOnMarket: marketData.daysOnMarket,
      activeListings: marketData.activeListings,
      inventoryChange: marketData.inventoryChange,
      pricePerSqft: marketData.pricePerSqft,
      marketTemperature: marketData.marketTemperature,
      insights: marketData.insights,
    });
  };

  const handleGenerateVideo = async () => {
    if (!marketData) return;
    setIsGeneratingVideo(true);
    setVideoUrl(null);
    try {
      const result = await generateMarketVideoMutation.mutateAsync({
        location: marketData.location,
        medianPrice: marketData.medianPrice,
        priceChange: marketData.priceChange,
        daysOnMarket: marketData.daysOnMarket,
        activeListings: marketData.activeListings,
        inventoryChange: marketData.inventoryChange,
        pricePerSqft: marketData.pricePerSqft,
        marketTemperature: marketData.marketTemperature,
        insights: marketData.insights,
        enableVoiceover,
        voiceId: enableVoiceover ? (voicePref?.voiceId || "21m00Tcm4TlvDq8ikWAM") : undefined,
        voiceoverStyle: enableVoiceover ? (voicePref?.voiceoverStyle || "professional") : undefined,
      });

      // Poll for completion
      const renderId = result.renderId;
      let attempts = 0;
      const poll = async (): Promise<void> => {
        if (attempts++ >= 60) throw new Error("Video rendering timeout");
        const status = await utils.autoreels.checkRenderStatus.fetch({ renderId });
        if (status.status === "done" && status.url) {
          setVideoUrl(status.url);
          toast.success("Market update video ready!");
        } else if (status.status === "failed") {
          throw new Error(status.error || "Rendering failed");
        } else {
          await new Promise(r => setTimeout(r, 5000));
          return poll();
        }
      };
      await poll();
    } catch (err: any) {
      toast.error(err.message || "Video generation failed.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-gray-500";
  };

  const getMarketTempColor = (temp: string) => {
    if (temp === 'hot') return "bg-red-500/20 text-red-500";
    if (temp === 'cold') return "bg-blue-500/20 text-blue-500";
    return "bg-yellow-500/20 text-yellow-500";
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
              placeholder="Enter city, state, or zipcode (e.g., Austin, TX or 78701)..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={fetchMarketStats.isPending}>
              <Search className="h-4 w-4 mr-2" />
              {fetchMarketStats.isPending ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Stats Display */}
      {marketData && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">{marketData.location}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMarketTempColor(marketData.marketTemperature)}`}>
                  {marketData.marketTemperature.charAt(0).toUpperCase() + marketData.marketTemperature.slice(1)} Market
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Voiceover toggle */}
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-violet-500/5 border-violet-500/20">
                <Mic className="h-4 w-4 text-violet-500" />
                <Label htmlFor="market-vo" className="text-sm cursor-pointer">Voiceover</Label>
                <span className="text-xs text-violet-500 font-medium">+5 credits</span>
                <Switch id="market-vo" checked={enableVoiceover} onCheckedChange={setEnableVoiceover} />
              </div>
              <Button onClick={handleGeneratePost} disabled={isGenerating} variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Post"}
              </Button>
              <Button onClick={handleGenerateVideo} disabled={isGeneratingVideo} size="lg">
                {isGeneratingVideo ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rendering Video...</>
                ) : (
                  <><Video className="h-4 w-4 mr-2" /> Generate Video{enableVoiceover ? " + Voiceover" : ""}</>
                )}
              </Button>
            </div>
          </div>

          {/* Video output */}
          {videoUrl && (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle>Market Update Video</CardTitle></CardHeader>
              <CardContent>
                <div className="aspect-video max-w-2xl mx-auto rounded-lg overflow-hidden bg-black">
                  <video src={videoUrl} controls className="w-full h-full" />
                </div>
                <div className="flex gap-3 mt-4 justify-center">
                  <Button variant="outline" onClick={() => { const a = document.createElement('a'); a.href = videoUrl; a.download = `market-update-${Date.now()}.mp4`; a.click(); }}>
                    Download Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Median Home Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${marketData.medianPrice.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(marketData.priceChange)}
                  <p className={`text-xs font-medium ${getTrendColor(marketData.priceChange)}`}>
                    {marketData.priceChange > 0 ? '+' : ''}{marketData.priceChange}% YoY
                  </p>
                </div>
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
                <p className="text-2xl font-bold">{marketData.daysOnMarket}</p>
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
                <p className="text-2xl font-bold">{marketData.activeListings.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(marketData.inventoryChange)}
                  <p className={`text-xs font-medium ${getTrendColor(marketData.inventoryChange)}`}>
                    {marketData.inventoryChange > 0 ? '+' : ''}{marketData.inventoryChange}% YoY
                  </p>
                </div>
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
                <p className="text-2xl font-bold">${marketData.pricePerSqft}</p>
                <p className="text-xs text-muted-foreground mt-1">Average price per square foot</p>
              </CardContent>
            </Card>
          </div>

          {/* Market Insights - Now using real data from RapidAPI */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Market Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {marketData.insights && marketData.insights.length > 0 ? (
                marketData.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p className="text-sm text-muted-foreground">
                      {insight}
                    </p>
                  </div>
                ))
              ) : (
                // Fallback to generic insights if API doesn't provide them
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p className="text-sm text-muted-foreground">
                      The {marketData.location} market is currently <span className="font-semibold text-foreground">{marketData.marketTemperature}</span>, 
                      with median home prices at <span className="font-semibold text-foreground">${marketData.medianPrice.toLocaleString()}</span>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p className="text-sm text-muted-foreground">
                      Homes are selling in an average of <span className="font-semibold text-foreground">{marketData.daysOnMarket} days</span>, 
                      {marketData.daysOnMarket < 30 ? ' indicating strong buyer demand.' : marketData.daysOnMarket > 60 ? ' suggesting a buyer-friendly market.' : ' showing a balanced market.'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p className="text-sm text-muted-foreground">
                      Inventory is {marketData.inventoryChange > 0 ? 'up' : marketData.inventoryChange < 0 ? 'down' : 'stable'} 
                      {marketData.inventoryChange !== 0 && ` ${Math.abs(marketData.inventoryChange)}%`} year-over-year, 
                      with <span className="font-semibold text-foreground">{marketData.activeListings.toLocaleString()} active listings</span>.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!marketData && !fetchMarketStats.isPending && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Market Data Yet</h3>
            <p className="text-muted-foreground">
              Enter a location above to view market statistics and generate insights
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
