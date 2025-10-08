import { HeroSection } from './HeroSection';
import { FeatureShowcase } from './FeatureShowcase';
import { TestimonialsSection } from './TestimonialsSection';
import { PricingSection } from './PricingSection';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
}

interface Testimonial {
  id: string;
  name: string;
  business: string;
  businessType: string;
  content: string;
  rating: number;
  avatar?: string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly?: number;
    currency: string;
  };
  features: string[];
  limitations?: string[];
  isPopular?: boolean;
  ctaText: string;
  ctaHref: string;
}

interface CTAButton {
  text: string;
  href: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

interface LandingPageProps {
  hero: {
    title: string;
    subtitle: string;
    ctaButtons: CTAButton[];
  };
  features: Feature[];
  testimonials: Testimonial[];
  pricingPlans: PricingPlan[];
}

export function LandingPage({ hero, features, testimonials, pricingPlans }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      <HeroSection 
        title={hero.title}
        subtitle={hero.subtitle}
        ctaButtons={hero.ctaButtons}
      />
      
      <FeatureShowcase features={features} />
      
      <TestimonialsSection testimonials={testimonials} />
      
      <PricingSection plans={pricingPlans} />
    </div>
  );
}