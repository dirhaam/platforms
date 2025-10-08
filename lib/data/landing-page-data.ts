import React from 'react';

// Sample data for the landing page components
export const heroData = {
  title: "Build Your Booking Business with Booqing",
  subtitle: "Create a professional booking system for your business in minutes. Manage appointments, communicate with customers via WhatsApp, and grow your business with powerful analytics.",
  ctaButtons: [
    {
      text: "Start Free Trial",
      href: "#register",
      variant: "default" as const,
      size: "lg" as const
    },
    {
      text: "View Demo",
      href: "/demo",
      variant: "outline" as const,
      size: "lg" as const
    }
  ]
};

export const featuresData = [
  {
    id: "booking-management",
    title: "Smart Booking Management",
    description: "Effortlessly manage appointments with an intuitive calendar system and automated scheduling.",
    icon: React.createElement('svg', {
      className: "w-6 h-6 text-blue-600",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, React.createElement('path', {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 2,
      d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    })),
    benefits: [
      "Real-time availability tracking",
      "Automated booking confirmations",
      "Recurring appointment support",
      "Blackout date management"
    ]
  },
  {
    id: "whatsapp-integration",
    title: "WhatsApp Integration",
    description: "Connect with customers through WhatsApp with automated reminders and professional messaging.",
    icon: React.createElement('svg', {
      className: "w-6 h-6 text-blue-600",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, React.createElement('path', {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 2,
      d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    })),
    benefits: [
      "Automated booking reminders",
      "Professional message templates",
      "Multi-device support",
      "Chat inbox management"
    ]
  },
  {
    id: "home-visits",
    title: "Home Visit Services",
    description: "Expand your business with location-based services and route optimization.",
    icon: React.createElement('svg', {
      className: "w-6 h-6 text-blue-600",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, [
      React.createElement('path', {
        key: 1,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      }),
      React.createElement('path', {
        key: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      })
    ]),
    benefits: [
      "Address validation",
      "Service area management",
      "Travel time calculation",
      "Route optimization"
    ]
  },
  {
    id: "analytics",
    title: "Business Analytics",
    description: "Make data-driven decisions with comprehensive analytics and reporting tools.",
    icon: React.createElement('svg', {
      className: "w-6 h-6 text-blue-600",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, React.createElement('path', {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 2,
      d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    })),
    benefits: [
      "Revenue tracking",
      "Customer insights",
      "Performance metrics",
      "Exportable reports"
    ]
  },
  {
    id: "customization",
    title: "Brand Customization",
    description: "Create a professional online presence that reflects your brand identity.",
    icon: React.createElement('svg', {
      className: "w-6 h-6 text-blue-600",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, React.createElement('path', {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 2,
      d: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
    })),
    benefits: [
      "Custom landing pages",
      "Brand colors and logos",
      "Multiple templates",
      "Mobile-responsive design"
    ]
  },
  {
    id: "financial",
    title: "Financial Management",
    description: "Track payments, generate invoices, and manage your business finances efficiently.",
    icon: React.createElement('svg', {
      className: "w-6 h-6 text-blue-600",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, React.createElement('path', {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 2,
      d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    })),
    benefits: [
      "PDF invoice generation",
      "Payment tracking",
      "Financial reporting",
      "QR code payments"
    ]
  }
];

export const testimonialsData = [
  {
    id: "salon-owner",
    name: "Sari Dewi",
    business: "Salon Cantik Sari",
    businessType: "Beauty Salon",
    content: "Booqing has transformed how I manage my salon appointments. The WhatsApp integration is amazing - my customers love getting reminders, and I've reduced no-shows by 80%.",
    rating: 5,
    avatar: "SD"
  },
  {
    id: "massage-therapist",
    name: "Budi Santoso",
    business: "Terapi Sehat Budi",
    businessType: "Massage Therapy",
    content: "The home visit feature is perfect for my massage therapy business. I can easily manage my schedule and the route optimization saves me so much time traveling between clients.",
    rating: 5,
    avatar: "BS"
  },
  {
    id: "consultant",
    name: "Dr. Maya Putri",
    business: "Konsultasi Kesehatan Maya",
    businessType: "Health Consultant",
    content: "As a health consultant, I need a professional booking system. Booqing's customizable landing page and automated reminders have helped me grow my practice significantly.",
    rating: 5,
    avatar: "MP"
  },
  {
    id: "fitness-trainer",
    name: "Andi Rahman",
    business: "Personal Training Andi",
    businessType: "Fitness Training",
    content: "The analytics feature helps me understand my business better. I can see which services are most popular and when my peak hours are. It's been invaluable for planning.",
    rating: 5,
    avatar: "AR"
  },
  {
    id: "tutor",
    name: "Rina Sari",
    business: "Les Privat Rina",
    businessType: "Private Tutoring",
    content: "Managing student schedules used to be a nightmare. Now with Booqing, everything is automated. Parents can book sessions online and get reminders automatically.",
    rating: 5,
    avatar: "RS"
  },
  {
    id: "photographer",
    name: "Dimas Pratama",
    business: "Foto Studio Dimas",
    businessType: "Photography",
    content: "The professional invoicing feature with QR codes has made payment collection so much easier. My clients appreciate the convenience and I get paid faster.",
    rating: 5,
    avatar: "DP"
  }
];

export const pricingPlansData = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small businesses just getting started",
    price: {
      monthly: 0,
      yearly: 0,
      currency: "Rp"
    },
    features: [
      "Up to 50 bookings per month",
      "Basic calendar management",
      "Email notifications",
      "1 staff member",
      "Basic landing page",
      "Customer database"
    ],
    limitations: [
      "No WhatsApp integration",
      "No home visit features",
      "Limited customization",
      "Basic analytics only"
    ],
    ctaText: "Start Free",
    ctaHref: "#register"
  },
  {
    id: "professional",
    name: "Professional",
    description: "Everything you need to run a growing business",
    price: {
      monthly: 99000,
      yearly: 990000,
      currency: "Rp"
    },
    features: [
      "Unlimited bookings",
      "WhatsApp integration",
      "Home visit management",
      "Up to 5 staff members",
      "Custom landing page",
      "Advanced analytics",
      "PDF invoicing",
      "Payment tracking",
      "Automated reminders",
      "Priority support"
    ],
    isPopular: true,
    ctaText: "Start Professional",
    ctaHref: "#register"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Advanced features for large businesses",
    price: {
      monthly: 299000,
      yearly: 2990000,
      currency: "Rp"
    },
    features: [
      "Everything in Professional",
      "Unlimited staff members",
      "Multi-location support",
      "Advanced integrations",
      "Custom branding",
      "API access",
      "Dedicated account manager",
      "Custom reporting",
      "White-label options",
      "24/7 phone support"
    ],
    ctaText: "Contact Sales",
    ctaHref: "/contact"
  }
];