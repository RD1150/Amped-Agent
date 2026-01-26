import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Search } from "lucide-react";
import { TEMPLATE_LIBRARY, type Template, type TemplateCategory } from "../../../shared/templates";

interface ComprehensiveTemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (template: Template) => void;
  audienceFilter?: TemplateCategory;
}

const categoryLabels: Record<TemplateCategory, string> = {
  buyers: "Buyers",
  sellers: "Sellers",
  investors: "Investors",
  general: "General/Authority",
};

const colorSchemeGradients: Record<string, string> = {
  blue: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
  green: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
  gold: "linear-gradient(135deg, #fbbf24 0%, #C9A962 100%)",
  red: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
  purple: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
  teal: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
  orange: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
};

export default function ComprehensiveTemplateSelector({
  selectedTemplateId,
  onSelectTemplate,
  audienceFilter,
}: ComprehensiveTemplateSelectorProps) {
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">(
    audienceFilter || "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Filter templates
  const filteredTemplates = TEMPLATE_LIBRARY.filter((template) => {
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.useCase.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group by category for display
  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<TemplateCategory, Template[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Your Template</h3>
        <p className="text-sm text-muted-foreground">
          Select from 50 professional templates designed for real estate content
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Category Filter */}
        {!audienceFilter && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              All Templates ({TEMPLATE_LIBRARY.length})
            </Button>
            {(Object.keys(categoryLabels) as TemplateCategory[]).map((category) => {
              const count = TEMPLATE_LIBRARY.filter((t) => t.category === category).length;
              return (
                <Button
                  key={category}
                  variant={categoryFilter === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(category)}
                >
                  {categoryLabels[category]} ({count})
                </Button>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
      </div>

      {/* Templates Grid - Grouped by Category */}
      <div className="space-y-8">
        {(Object.keys(templatesByCategory) as TemplateCategory[]).map((category) => (
          <div key={category}>
            <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
              {categoryLabels[category]}
              <Badge variant="secondary">{templatesByCategory[category].length}</Badge>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {templatesByCategory[category].map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedTemplateId === template.id
                      ? "ring-2 ring-primary shadow-lg"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => onSelectTemplate(template)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Template Preview */}
                    <div
                      className="w-full h-32 rounded-lg flex items-center justify-center relative overflow-hidden"
                      style={{
                        background: colorSchemeGradients[template.colorScheme] || colorSchemeGradients.blue,
                      }}
                    >
                      <div className="text-center px-4 text-white">
                        <div className="text-xs font-semibold mb-1 opacity-80">
                          {template.designStyle.toUpperCase()}
                        </div>
                        <div className="text-sm font-bold leading-tight">
                          {template.name}
                        </div>
                      </div>

                      {/* Selected Checkmark */}
                      {selectedTemplateId === template.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Template Info */}
                    <div>
                      <h5 className="font-semibold text-sm mb-1">{template.name}</h5>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </div>

                    {/* Use Case */}
                    <div className="text-xs text-muted-foreground italic line-clamp-2">
                      "{template.useCase}"
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No templates found matching your search.</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
            }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
