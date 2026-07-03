import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import '@/app/marketing.css';

const PricingPage = dynamic(() => import('@/components/marketing/PricingPage'), { ssr: false });

export const metadata: Metadata = {
  title: 'Pricing — Apex Marketing',
  description:
    'Simple, transparent pricing for AI-powered marketing automation. Starter, Pro, and Agency plans available.',
};

export default function Pricing() {
  return (
    <PricingPage />
  );
}
