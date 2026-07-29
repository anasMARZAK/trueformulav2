import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administration Studio — TRUE FORMULA',
  description: 'Portail d’administration sécurisé pour la gestion du catalogue, des stocks et de la métrique des ventes.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
