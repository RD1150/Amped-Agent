import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

export type TemplateStyle = "modern_clean" | "bold_gradient" | "dark_luxury" | "market_authority";

interface TemplateSelectorProps {
  selectedTemplate: TemplateStyle;
  onSelectTemplate: (template: TemplateStyle) => void;
}

const templates = [
  {
    id: "modern_clean" as TemplateStyle,
    name: "Modern Clean",
    description: "Minimalist white background with professional typography",
    preview: "linear-gradient(to bottom, #ffffff, #f8f9fa)",
    textColor: "#1a1a1a",
  },
  {
    id: "bold_gradient" as TemplateStyle,
    name: "Bold Gradient",
    description: "Eye-catching gradient with strong visual impact",
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    textColor: "#ffffff",
  },
  {
    id: "dark_luxury" as TemplateStyle,
    name: "Dark Luxury",
    description: "Sophisticated dark background with gold accents",
    preview: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    textColor: "#C9A962",
  },
  {
    id: "market_authority" as TemplateStyle,
    name: "Market Authority",
    description: "Data-focused design for market insights and stats",
    preview: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    textColor: "#4ade80",
  },
];

export default function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Your Template Style</h3>
        <p className="text-sm text-muted-foreground">
          Select a visual style for your post. Your branding will be applied automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:scale-105 ${
              selectedTemplate === template.id
                ? "ring-2 ring-primary shadow-lg"
                : "hover:border-primary/50"
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <CardContent className="p-4 space-y-3">
              {/* Template Preview */}
              <div
                className="w-full h-32 rounded-lg flex items-center justify-center relative overflow-hidden"
                style={{ background: template.preview }}
              >
                <div
                  className="text-center px-4"
                  style={{ color: template.textColor }}
                >
                  <div className="text-xs font-semibold mb-1">Your Business Name</div>
                  <div className="text-lg font-bold leading-tight">
                    Sample Post Title
                  </div>
                  <div className="text-xs mt-2 opacity-80">Your Tagline Here</div>
                </div>

                {/* Selected Checkmark */}
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div>
                <h4 className="font-semibold text-sm">{template.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {template.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
