/**
 * Supabase surfaces auth failures as terse strings ("Email rate limit exceeded",
 * "User already registered"). Shown verbatim they leave a member with no idea
 * what to do next — especially when they are simply retrying after mistyping an
 * address. This maps each case to a title plus a concrete next step.
 */

export type AuthErrorKind =
  | 'rate_limited'
  | 'already_registered'
  | 'invalid_credentials'
  | 'weak_password'
  | 'invalid_email'
  | 'unconfirmed_email'
  | 'network'
  | 'unknown';

export interface FriendlyAuthError {
  kind: AuthErrorKind;
  title: string;
  description: string;
  /** Seconds the caller should wait before allowing another attempt. */
  retryAfterSeconds?: number;
}

/** Pulls "try again in 47 seconds" out of a Supabase rate-limit message. */
function parseRetryAfter(message: string): number | undefined {
  const match = message.match(/(\d+)\s*second/i);
  if (match) return parseInt(match[1], 10);
  const minutes = message.match(/(\d+)\s*minute/i);
  if (minutes) return parseInt(minutes[1], 10) * 60;
  return undefined;
}

export function describeAuthError(
  error: unknown,
  language: 'en' | 'fr' = 'en'
): FriendlyAuthError {
  const raw = String((error as any)?.message ?? error ?? '').trim();
  const message = raw.toLowerCase();
  const isFr = language === 'fr';

  if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) {
    const retryAfterSeconds = parseRetryAfter(raw) ?? 60;
    return {
      kind: 'rate_limited',
      retryAfterSeconds,
      title: isFr ? 'Trop de tentatives' : 'Too many attempts',
      description: isFr
        ? `Veuillez patienter ${retryAfterSeconds} secondes avant de réessayer. Vos informations saisies sont conservées — corrigez-les puis relancez.`
        : `Please wait ${retryAfterSeconds} seconds before trying again. Your details are kept, so you can correct them and resubmit.`,
    };
  }

  if (message.includes('already registered') || message.includes('already been registered') || message.includes('user already exists')) {
    return {
      kind: 'already_registered',
      title: isFr ? 'Ce compte existe déjà' : 'That account already exists',
      description: isFr
        ? 'Connectez-vous plutôt, ou utilisez « Mot de passe oublié ? » si vous ne vous en souvenez plus.'
        : 'Sign in instead, or use “Forgot Password?” if you cannot remember it.',
    };
  }

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return {
      kind: 'invalid_credentials',
      title: isFr ? 'Identifiants incorrects' : 'Incorrect email or password',
      description: isFr
        ? 'Vérifiez votre adresse email et votre mot de passe, puis réessayez.'
        : 'Double-check the email and password, then try again.',
    };
  }

  if (message.includes('password should be') || message.includes('weak password') || message.includes('password must')) {
    return {
      kind: 'weak_password',
      title: isFr ? 'Mot de passe trop faible' : 'Password is too weak',
      description: isFr
        ? 'Utilisez au moins 8 caractères, avec des lettres et des chiffres.'
        : 'Use at least 8 characters, mixing letters and numbers.',
    };
  }

  if (message.includes('invalid email') || message.includes('unable to validate email')) {
    return {
      kind: 'invalid_email',
      title: isFr ? 'Adresse email invalide' : 'That email address is not valid',
      description: isFr
        ? 'Vérifiez l’orthographe de votre adresse (par exemple nom@domaine.com).'
        : 'Check the spelling of the address (for example name@domain.com).',
    };
  }

  if (message.includes('email not confirmed') || message.includes('not confirmed')) {
    return {
      kind: 'unconfirmed_email',
      title: isFr ? 'Email non confirmé' : 'Email not confirmed yet',
      description: isFr
        ? 'Ouvrez le lien de confirmation envoyé à votre adresse, puis reconnectez-vous.'
        : 'Open the confirmation link we sent you, then sign in again.',
    };
  }

  if (message.includes('fetch') || message.includes('network') || message.includes('failed to fetch')) {
    return {
      kind: 'network',
      title: isFr ? 'Problème de connexion' : 'Connection problem',
      description: isFr
        ? 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.'
        : 'We could not reach the server. Check your connection and try again.',
    };
  }

  return {
    kind: 'unknown',
    title: isFr ? 'Erreur d’authentification' : 'Authentication error',
    description: raw || (isFr ? 'Veuillez réessayer.' : 'Please try again.'),
  };
}
