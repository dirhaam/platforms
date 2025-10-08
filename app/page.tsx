import Link from 'next/link';
import { LandingPage } from '@/components/main/LandingPage';
import { EnhancedSubdomainForm } from '@/components/registration/EnhancedSubdomainForm';
import { heroData, featuresData, testimonialsData, pricingPlansData } from '@/lib/data/landing-page-data';

export default async function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="font-bold text-xl text-gray-900">
            Booqing
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/demo"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Demo
            </Link>
            <Link
              href="/admin"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Landing Page */}
      <LandingPage 
        hero={heroData}
        features={featuresData}
        testimonials={testimonialsData}
        pricingPlans={pricingPlansData}
      />

      {/* Registration Section */}
      <section id="register" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Start Your Free Trial
            </h2>
            <p className="text-lg text-gray-600">
              Create your professional booking system in just a few steps
            </p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-8">
            <EnhancedSubdomainForm />
          </div>
        </div>
      </section>
    </div>
  );
}
