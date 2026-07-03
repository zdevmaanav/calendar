import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import '@/app/marketing.css';

const HomePage = dynamic(() => import('@/components/marketing/HomePage'), { ssr: false });

export const metadata: Metadata = {
  title: 'Apex Marketing — AI-Powered Marketing Automation',
  description:
    'We build marketing machines that never sleep. Intelligent, automated, unstoppable. AI-powered brand analysis, content generation, and social media management.',
  keywords: [
    'marketing automation',
    'AI marketing',
    'brand intelligence',
    'content generation',
    'social media management',
  ],
};

export default function LandingPage() {
  return (
    <HomePage />
  );
}
