import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Filter, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

type HookCategory = "buyer" | "seller" | "investor" | "local" | "luxury" | "relocation" | "general";
type HookFormat = "video" | "email" | "social" | "carousel";

interface Hook {
  id: number;
  category: HookCategory;
  format: HookFormat;
  hookText: string;
  useCase: string | null;
  exampleExpansion: string | null;
  isPremium: boolean | null;
  usageCount: number | null;
  createdAt: Date;
}

export default function Hooks() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HookCategory | "all">("all");
  const [selectedFormat, setSelectedFormat] = useState<HookFormat | "all">("all");

  // Fetch all hooks
  const { data: hooks, isLoading } = trpc.hooks.list.useQuery();

  // Filter hooks based on search and filters
  const filteredHooks = hooks?.filter((hook: Hook) => {
    const matchesSearch = hook.hookText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hook.useCase?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || hook.category === selectedCategory;
    const matchesFormat = selectedFormat === "all" || hook.format === selectedFormat;
    return matchesSearch && matchesCategory && matchesFormat;
  });

  const categories: Array<HookCategory | "all"> = ["all", "buyer", "seller", "investor", "local", "luxury", "relocation", "general"];
  const formats: Array<HookFormat | "all"> = ["all", "video", "email", "social", "carousel"];

  const getCategoryColor = (category: HookCategory) => {
    const colors: Record<HookCategory, string> = {
      buyer: "bg-blue-500/20 text-blue-500",
      seller: "bg-green-500/20 text-green-500",
      investor: "bg-purple-500/20 text-purple-500",
      local: "bg-orange-500/20 text-orange-500",
      luxury: "bg-yellow-500/20 text-yellow-500",
      relocation: "bg-pink-500/20 text-pink-500",
      general: "bg-gray-500/20 text-gray-500",
    };
    return colors[category];
  };

  const getFormatIcon = (format: HookFormat) => {
    const icons: Record<HookFormat, string> = {
      video: "🎥",
      email: "📧",
      social: "📱",
      carousel: "🎠",
    };
    return icons[format];
  };

  const handleUseHook = (hook: Hook) => {
    // Navigate to AI Generate page with hook pre-filled
    setLocation(`/ai-generate?hook=${encodeURIComponent(hook.hookText)}`);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Hooks Library</h1>
          <p className="text-muted-foreground mt-1">
            Browse proven hooks to start your social media posts, videos, and carousels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <TrendingUp className="h-3 w-3 mr-1" />
            {filteredHooks?.length || 0} hooks available
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hooks by text or use case..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Format Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Format</label>
            <div className="flex flex-wrap gap-2">
              {formats.map((format) => (
                <Button
                  key={format}
                  variant={selectedFormat === format ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFormat(format)}
                >
                  {format === "all" ? "All Formats" : format.charAt(0).toUpperCase() + format.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hooks Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading hooks...</p>
        </div>
      ) : filteredHooks && filteredHooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHooks.map((hook: Hook) => (
            <Card key={hook.id} className="bg-card border-border hover:border-primary transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getCategoryColor(hook.category)}>
                      {hook.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getFormatIcon(hook.format)} {hook.format}
                    </Badge>
                  </div>
                  {hook.isPremium && (
                    <Badge variant="secondary" className="text-xs">
                      ⭐ Pro
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold text-foreground leading-relaxed">
                    "{hook.hookText}"
                  </p>
                </div>

                {hook.useCase && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">When to use:</p>
                    <p className="text-sm text-muted-foreground">{hook.useCase}</p>
                  </div>
                )}

                {hook.exampleExpansion && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Example expansion:</p>
                    <p className="text-sm text-muted-foreground italic">
                      {hook.exampleExpansion.length > 100
                        ? hook.exampleExpansion.substring(0, 100) + "..."
                        : hook.exampleExpansion}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Used {hook.usageCount} times
                  </span>
                  <Button size="sm" onClick={() => handleUseHook(hook)}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Use This Hook
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Hooks Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find more hooks
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
