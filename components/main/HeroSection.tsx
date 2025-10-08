import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CTAButton {
  text: string;
  href: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaButtons: CTAButton[];
}

export function HeroSection({ title, subtitle, ctaButtons }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-b from-blue-50 to-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {ctaButtons.map((button, index) => (
            <Button
              key={index}
              variant={button.variant || 'default'}
              size={button.size || 'lg'}
              asChild
            >
              <Link href={button.href}>
                {button.text}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}