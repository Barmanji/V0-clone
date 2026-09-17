"use client";
import Link from "next/link";
import { CrownIcon } from "lucide-react";
import { formatDuration, intervalToDuration } from "date-fns";
import { Button } from "@/components/ui/button";
import { useStatus } from "../hooks/usage";
// import { useAuth } from "@clerk/nextjs";
import { Spinner } from "@/components/ui/spinner";
import { getCurrentUser } from "@/modules/auth/actions";
import { useEffect, useState } from "react";

export const Usage = () => {
  const { data, isLoading, error } = useStatus();

  const [hasProAccess, setHasProAccess] = useState<boolean | null>(null);
  useEffect(() => {
    const fetchUserPlan = async () => {
      const dbUser = await getCurrentUser();

      if (dbUser) {
        // Pull out just the Plan property here
        setHasProAccess(dbUser.Plan === "PAID");
      }
    };

    fetchUserPlan();
  }, []);
  if (isLoading) {
    return (
      <div className="rounded-t-xl bg-background border border-b-0 p-2.5">
        <Spinner className={"text-emerald-400"} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-t-xl bg-background border border-b-0 p-2.5">
        <p className="text-sm text-destructive">Error loading usage</p>
      </div>
    );
  }

  const points = data?.remainingPoints ?? 0;
  const msBeforeNext = data?.msBeforeNext ?? 0;

  return (
    <div className="rounded-t-xl bg-background border border-b-0 p-2.5">
      <div className="flex items-center gap-x-2">
        <div>
          <p className="text-sm">{points} credits remaining</p>
          <p className="text-xs text-muted-foreground">
            Resets in{" "}
            {formatDuration(
              intervalToDuration({
                start: new Date(),
                // Reset countdown is inherently wall-clock dependent.
                // eslint-disable-next-line react-hooks/purity
                end: new Date(Date.now() + msBeforeNext),
              }),
              { format: ["months", "days", "hours"] },
            )}
          </p>
        </div>
        {!hasProAccess && (
          <Button
            size={"lg"}
            variant={"secondary"}
            className={"ml-auto bg-green-600"}
          >
            <Link href={"/pricing"}>
              <CrownIcon /> Upgrade
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

