import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import '@/app/marketing.css';

const ServicesPage = dynamic(() => import('@/components/marketing/ServicesPage'), { ssr: false });

export const metadata: Metadata = {
  title: 'Services — Apex Marketing',
  description:
    'Everything your brand needs — from AI brand profiling to content generation, video avatars, social management, and real-time analytics.',
};

export default function Services() {
  return (
    <ServicesPage />
  );
}
