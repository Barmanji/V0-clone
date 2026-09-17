"use client";

import { useRouter } from "next/navigation";
import { CrownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreditLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreditLimitDialog = ({
  open,
  onOpenChange,
}: CreditLimitDialogProps) => {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You&apos;re out of credits</DialogTitle>
          <DialogDescription>
            You&apos;ve used all your AI generations for this cycle. Upgrade to
            Pro to keep building with 100 generations per month.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button
            className="bg-green-600"
            onClick={() => {
              onOpenChange(false);
              router.push("/pricing");
            }}
          >
            <CrownIcon className="size-4" />
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
