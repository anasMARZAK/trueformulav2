import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Espace Membre & Abonnements — TRUE FORMULA',
  description: 'Gérez vos abonnements mensuels, modifiez la fréquence de livraison et consultez l’historique de vos commandes.',
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
