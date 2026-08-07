import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Collection — TRUE FORMULA',
  description:
    'Browse every True Formula formulation: cold-filtered native whey isolates, pharmaceutical-grade creatine, marine collagen, plant protein, and pre-workout.',
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
