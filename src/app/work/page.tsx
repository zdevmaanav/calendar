import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import '@/app/marketing.css';

const WorkPage = dynamic(() => import('@/components/marketing/WorkPage'), { ssr: false });

export const metadata: Metadata = {
  title: 'Our Work — Apex Marketing',
  description:
    'See our portfolio of digital transformations. Every brand we touch gets a complete AI-powered marketing overhaul.',
};

export default function Work() {
  return (
    <WorkPage />
  );
}
