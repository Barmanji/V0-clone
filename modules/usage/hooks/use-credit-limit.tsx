"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { CreditLimitDialog } from "../components/credit-limit-dialog";

/**
 * Fail-safe for exhausted credits. Shows a toast for every plan, and only
 * opens the upgrade dialog for free users. Paid users are left alone.
 */
export const useCreditLimit = () => {
  const [open, setOpen] = useState(false);

  const handleCreditLimit = useCallback((planIsPro: boolean) => {
    toast.error("Your credits are exhausted", {
      description: planIsPro
        ? "Pro credits reset at the end of your billing cycle."
        : "Upgrade to Pro for 100 generations per month.",
    });

    if (!planIsPro) {
      setOpen(true);
    }
  }, []);

  const creditLimitDialog = (
    <CreditLimitDialog open={open} onOpenChange={setOpen} />
  );

  return { handleCreditLimit, creditLimitDialog };
};
