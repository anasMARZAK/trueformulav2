import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion Espace Membre — TRUE FORMULA',
  description: 'Accédez à votre compte membre TRUE FORMULA pour débloquer 20% de remise automatique sur vos abonnements.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
