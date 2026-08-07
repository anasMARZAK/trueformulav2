'use client';

import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { AlertTriangle, Trash2, PauseCircle, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Replaces the native `alert()` / `confirm()` dialogs. Native modals cannot be
 * styled, block the whole tab, and read as a browser warning rather than part of
 * the store — so every blocking prompt now routes through this component.
 *
 * `intent` picks the icon, accent, and confirm-button colour, so a destructive
 * delete never looks like a neutral acknowledgement.
 */
export type ConfirmIntent = 'danger' | 'destructive' | 'warning' | 'info' | 'question';

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  intent?: ConfirmIntent;
  /** Hides the cancel button — use for pure acknowledgements (the old `alert()`). */
  acknowledgeOnly?: boolean;
}

const INTENT_STYLES: Record<
  ConfirmIntent,
  { Icon: typeof AlertTriangle; iconWrap: string; confirmVariant: 'destructive' | 'default' | 'ink' }
> = {
  danger: {
    Icon: AlertTriangle,
    iconWrap: 'bg-[#FDECEC] text-[#9A3A3A] border-[#F2C9C9]',
    confirmVariant: 'destructive',
  },
  destructive: {
    Icon: Trash2,
    iconWrap: 'bg-[#FDECEC] text-[#9A3A3A] border-[#F2C9C9]',
    confirmVariant: 'destructive',
  },
  warning: {
    Icon: PauseCircle,
    iconWrap: 'bg-[#FEF6E7] text-[#8A5C29] border-[#F0D9A8]',
    confirmVariant: 'ink',
  },
  info: {
    Icon: Info,
    iconWrap: 'bg-[#EAF2ED] text-[#2E5A44] border-[#C6DFD1]',
    confirmVariant: 'default',
  },
  question: {
    Icon: HelpCircle,
    iconWrap: 'bg-[#EAF2ED] text-[#2E5A44] border-[#C6DFD1]',
    confirmVariant: 'default',
  },
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<ConfirmOptions | null>(null);

  // The resolver lives in a ref rather than in state: resolving inside a state
  // updater would fire twice under React StrictMode, and the updater must stay
  // side-effect free.
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setPending(options);
    });
  }, []);

  // Settling is idempotent — Radix fires `onOpenChange(false)` right after an
  // action button is clicked, and that must not overwrite the real answer.
  const settle = React.useCallback((value: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setPending(null);
    resolve?.(value);
  }, []);

  const intent = pending?.intent ?? 'question';
  const { Icon, iconWrap, confirmVariant } = INTENT_STYLES[intent];

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <AlertDialogPrimitive.Root
        open={pending !== null}
        onOpenChange={(open) => {
          // Escape / outside-dismiss both count as "no".
          if (!open) settle(false);
        }}
      >
        <AlertDialogPrimitive.Portal>
          <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[#111827]/55 backdrop-blur-sm data-[state=open]:animate-fade-in" />
          <AlertDialogPrimitive.Content
            className={cn(
              'fixed left-1/2 top-1/2 z-[71] w-[calc(100%-2rem)] max-w-md',
              // The centring translate lives in the keyframes (see
              // .animate-dialog-in) because an animated `transform` replaces the
              // utility classes and the box lands off-centre.
              '-translate-x-1/2 -translate-y-1/2 animate-dialog-in',
              'rounded-3xl border border-[#C6DFD1] bg-[#FDFBF7] p-6 shadow-luxe-lg'
            )}
          >
            <div className="flex gap-4">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border',
                  iconWrap
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </div>

              <div className="min-w-0 space-y-1.5 pt-0.5">
                <AlertDialogPrimitive.Title className="font-serif text-lg font-bold leading-tight tracking-tight text-[#111827]">
                  {pending?.title}
                </AlertDialogPrimitive.Title>
                {pending?.description && (
                  <AlertDialogPrimitive.Description className="text-xs leading-relaxed text-[#4B5563]">
                    {pending.description}
                  </AlertDialogPrimitive.Description>
                )}
              </div>
            </div>

            {/* Both buttons settle the promise explicitly. Relying on Radix's
                close behaviour alone made every confirmation resolve `false`,
                because closing fires `onOpenChange(false)` regardless of which
                button was pressed — so accepting an action did nothing. */}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {!pending?.acknowledgeOnly && (
                <AlertDialogPrimitive.Cancel asChild>
                  <Button variant="outline" size="sm" className="sm:min-w-24" onClick={() => settle(false)}>
                    {pending?.cancelLabel || 'Cancel'}
                  </Button>
                </AlertDialogPrimitive.Cancel>
              )}
              <AlertDialogPrimitive.Action asChild>
                <Button
                  variant={confirmVariant}
                  size="sm"
                  className="sm:min-w-28"
                  onClick={() => settle(true)}
                >
                  {pending?.confirmLabel || 'Confirm'}
                </Button>
              </AlertDialogPrimitive.Action>
            </div>
          </AlertDialogPrimitive.Content>
        </AlertDialogPrimitive.Portal>
      </AlertDialogPrimitive.Root>
    </ConfirmContext.Provider>
  );
}

/**
 * `const confirm = useConfirm();` then `await confirm({ ... })`.
 * Resolves true when the user accepts, false on cancel/escape/outside click.
 */
export function useConfirm(): ConfirmFn {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
