/**
 * Template Design System
 * Professional template layouts with image backgrounds, overlays, and agent branding
 * Inspired by realestatecontent.ai visual style
 */

import { TemplateCategory } from '../../../shared/templates';
import { PlatformSize } from '../../../shared/platformSizes';

export interface TemplateDesignConfig {
  layout: 'sidebar-left' | 'sidebar-right' | 'overlay-center' | 'split-screen' | 'full-bleed';
  backgroundImagePrompt: string;
  overlayStyle: {
    type: 'gradient' | 'solid' | 'blur';
    opacity: number;
    color?: string;
  };
  sidebarConfig?: {
    width: number; // percentage of canvas width
    backgroundColor: string;
    verticalText?: string;
  };
  agentBranding: {
    showHeadshot: boolean;
    headshotPosition: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    headshotSize: number; // pixels
    showContactInfo: boolean;
    contactInfoPosition: 'bottom-left' | 'bottom-right' | 'sidebar';
  };
  typography: {
    headlineFont: string;
    headlineSize: number; // relative to canvas height
    headlineColor: string;
    bodyFont: string;
    bodySize: number;
    bodyColor: string;
  };
  ctaButtons?: {
    show: boolean;
    labels: string[];
    position: 'bottom-center' | 'bottom-right';
  };
}

/**
 * Get background image prompt based on template category
 */
export function getBackgroundImagePrompt(category: TemplateCategory): string {
  const prompts: Record<TemplateCategory, string> = {
    buyers: "Professional real estate photography of a beautiful modern family home interior, bright natural lighting, spacious living room with large windows, contemporary furniture, clean and inviting, high-end residential photography style",
    
    luxury_buyers: "Luxury mansion interior photography, grand entrance foyer with chandelier, marble floors, high ceilings, elegant furniture, sophisticated design, architectural digest style, ultra high-end residential",
    
    sellers: "Professional real estate listing photo, attractive suburban home exterior, well-maintained front yard, blue sky, welcoming curb appeal, professional photography, bright daylight",
    
    first_time_sellers: "Charming starter home interior, cozy living space, modern updates, bright and clean, move-in ready condition, professional real estate photography",
    
    expireds: "Professionally staged home interior, neutral colors, modern furniture, bright natural light, show-ready condition, high-quality real estate photography",
    
    urgent_sellers: "Clean and bright home interior, neutral staging, spacious rooms, natural lighting, quick-sale ready, professional real estate photo",
    
    fsbos: "Homeowner-friendly property photo, well-maintained home, attractive interior or exterior, natural lighting, welcoming atmosphere, professional quality",
    
    luxury_sellers: "Luxury property photography, high-end home exterior with landscaping, modern architecture, premium finishes, estate-quality photography, architectural style",
    
    investors: "Investment property photography, rental home exterior, multi-family building, or fix-and-flip opportunity, professional real estate investment photo",
    
    general: "Professional real estate office or modern home interior, bright and professional, clean design, real estate industry aesthetic"
  };
  
  return prompts[category] || prompts.general;
}

/**
 * Get template design configuration based on category and style
 */
export function getTemplateDesign(
  category: TemplateCategory,
  styleVariant: 'modern' | 'elegant' | 'bold' | 'minimal' | 'luxury' = 'modern'
): TemplateDesignConfig {
  const baseConfig: TemplateDesignConfig = {
    layout: 'sidebar-left',
    backgroundImagePrompt: getBackgroundImagePrompt(category),
    overlayStyle: {
      type: 'gradient',
      opacity: 0.3,
      color: '#000000'
    },
    sidebarConfig: {
      width: 15,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      verticalText: 'NEW TRENDS'
    },
    agentBranding: {
      showHeadshot: true,
      headshotPosition: 'bottom-left',
      headshotSize: 120,
      showContactInfo: true,
      contactInfoPosition: 'bottom-right'
    },
    typography: {
      headlineFont: 'Inter, sans-serif',
      headlineSize: 0.08, // 8% of canvas height
      headlineColor: '#FFFFFF',
      bodyFont: 'Inter, sans-serif',
      bodySize: 0.03,
      bodyColor: '#FFFFFF'
    },
    ctaButtons: {
      show: true,
      labels: ['Read Caption', 'Explore'],
      position: 'bottom-center'
    }
  };

  // Customize based on style variant
  switch (styleVariant) {
    case 'elegant':
      return {
        ...baseConfig,
        overlayStyle: {
          type: 'gradient',
          opacity: 0.4,
          color: '#1a1a1a'
        },
        typography: {
          ...baseConfig.typography,
          headlineFont: 'Playfair Display, serif',
          headlineColor: '#F5F5F5'
        }
      };
    
    case 'bold':
      return {
        ...baseConfig,
        layout: 'overlay-center',
        overlayStyle: {
          type: 'solid',
          opacity: 0.5,
          color: '#000000'
        },
        sidebarConfig: undefined,
        typography: {
          ...baseConfig.typography,
          headlineSize: 0.10,
          headlineFont: 'Montserrat, sans-serif'
        }
      };
    
    case 'minimal':
      return {
        ...baseConfig,
        overlayStyle: {
          type: 'gradient',
          opacity: 0.2
        },
        sidebarConfig: undefined,
        typography: {
          ...baseConfig.typography,
          headlineFont: 'Helvetica Neue, sans-serif',
          headlineSize: 0.07
        }
      };
    
    case 'luxury':
      return {
        ...baseConfig,
        layout: 'split-screen',
        overlayStyle: {
          type: 'gradient',
          opacity: 0.35,
          color: '#0a0a0a'
        },
        sidebarConfig: {
          width: 20,
          backgroundColor: 'rgba(10, 10, 10, 0.90)',
          verticalText: 'LUXURY'
        },
        typography: {
          ...baseConfig.typography,
          headlineFont: 'Cormorant Garamond, serif',
          headlineColor: '#F4E4C1'
        }
      };
    
    default:
      return baseConfig;
  }
}

/**
 * Calculate responsive dimensions based on platform size
 */
export function getResponsiveDimensions(platformSize: PlatformSize) {
  return {
    width: platformSize.width,
    height: platformSize.height,
    headlineSize: Math.floor(platformSize.height * 0.08),
    bodySize: Math.floor(platformSize.height * 0.03),
    headshotSize: Math.floor(platformSize.width * 0.15),
    sidebarWidth: Math.floor(platformSize.width * 0.15),
    padding: Math.floor(platformSize.width * 0.05)
  };
}
