"use client";

import { useState } from "react";
import { openStripeCheckout } from "@/lib/stripe-checkout-client";
import { useT } from "@/lib/i18n/context";

interface Props {
  bookingId: string;
  bookingCode: string;
}

export function StripeCheckoutButton({ bookingId, bookingCode }: Props) {
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await openStripeCheckout(bookingId, bookingCode);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : t("conf.paymentRetryError"));
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-[background-color,box-shadow,transform] hover:bg-brand-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65 active:scale-[0.98]"
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {loading ? t("submit.redirecting") : t("conf.retryPayment")}
      </button>
      {error && (
        <p role="alert" aria-live="polite" className="mt-2 text-center text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
