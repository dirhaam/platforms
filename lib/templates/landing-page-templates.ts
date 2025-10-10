export interface LandingPageTemplate {
  id: string;
  name: string;
  category: string;
  preview: string;
  description: string;
  sections: {
    hero: boolean;
    services: boolean;
    about: boolean;
    reviews: boolean;
    contact: boolean;
    gallery: boolean;
    businessHours: boolean;
  };
  customization: {
    colors: boolean;
    fonts: boolean;
    layout: boolean;
  };
  isActive: boolean;
}

export const LANDING_PAGE_TEMPLATES: LandingPageTemplate[] = [
  {
    id: 'modern',
    name: 'Modern Professional',
    category: 'Professional',
    preview: '/templates/modern-preview.jpg',
    description: 'Clean, modern design perfect for professional services',
    sections: {
      hero: true,
      services: true,
      about: true,
      reviews: false,
      contact: true,
      gallery: false,
      businessHours: true,
    },
    customization: {
      colors: true,
      fonts: true,
      layout: true,
    },
    isActive: true,
  },
  {
    id: 'classic',
    name: 'Classic Business',
    category: 'Traditional',
    preview: '/templates/classic-preview.jpg',
    description: 'Traditional business layout with emphasis on trust and reliability',
    sections: {
      hero: true,
      services: true,
      about: true,
      reviews: true,
      contact: true,
      gallery: true,
      businessHours: true,
    },
    customization: {
      colors: true,
      fonts: false,
      layout: false,
    },
    isActive: true,
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    category: 'Minimal',
    preview: '/templates/minimal-preview.jpg',
    description: 'Minimalist design focusing on essential information',
    sections: {
      hero: true,
      services: true,
      about: false,
      reviews: false,
      contact: true,
      gallery: false,
      businessHours: true,
    },
    customization: {
      colors: true,
      fonts: true,
      layout: true,
    },
    isActive: true,
  },
  {
    id: 'beauty',
    name: 'Beauty & Wellness',
    category: 'Beauty',
    preview: '/templates/beauty-preview.jpg',
    description: 'Elegant design tailored for beauty and wellness businesses',
    sections: {
      hero: true,
      services: true,
      about: true,
      reviews: true,
      contact: true,
      gallery: true,
      businessHours: true,
    },
    customization: {
      colors: true,
      fonts: true,
      layout: true,
    },
    isActive: true,
  },
  {
    id: 'healthcare',
    name: 'Healthcare Professional',
    category: 'Healthcare',
    preview: '/templates/healthcare-preview.jpg',
    description: 'Professional medical and healthcare focused design',
    sections: {
      hero: true,
      services: true,
      about: true,
      reviews: false,
      contact: true,
      gallery: false,
      businessHours: true,
    },
    customization: {
      colors: false,
      fonts: false,
      layout: false,
    },
    isActive: true,
  },
];

export function getTemplateById(templateId: string): LandingPageTemplate | null {
  return LANDING_PAGE_TEMPLATES.find(template => template.id === templateId) || null;
}

export function getTemplatesByCategory(category: string): LandingPageTemplate[] {
  return LANDING_PAGE_TEMPLATES.filter(template => 
    template.category === category && template.isActive
  );
}

export function getDefaultTemplate(): LandingPageTemplate {
  return LANDING_PAGE_TEMPLATES[0]; // Modern template as default
}

export function getRecommendedTemplate(businessCategory: string): LandingPageTemplate {
  const categoryMap: Record<string, string> = {
    'Beauty & Wellness': 'beauty',
    'Healthcare': 'healthcare',
    'Professional Services': 'modern',
    'Fitness & Sports': 'modern',
    'Education & Training': 'classic',
    'Home Services': 'classic',
    'Automotive': 'classic',
    'Food & Beverage': 'modern',
    'Entertainment': 'modern',
    'Other': 'modern',
  };

  const recommendedId = categoryMap[businessCategory] || 'modern';
  return getTemplateById(recommendedId) || getDefaultTemplate();
}