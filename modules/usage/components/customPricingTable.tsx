"use client";

import { CircleCheck, CircleX } from "lucide-react";
import { useEffect, useState } from "react";
import Script from "next/script"; // 1. Added Script import
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { getCurrentUser } from "@/modules/auth/actions";
import {
  createRazorpayOrder,
  verifyPaymentAndSave,
} from "@/modules/razorpay/actions";
import { toast } from "sonner";

interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayCheckoutResponse) => void | Promise<void>;
  theme?: { color?: string };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

interface PricingCards2CardsPlan {
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
  button: {
    text: string;
    url: string;
  };
  highlighted?: boolean;
  featureListLabel?: string;
  image?: string;
}

interface PricingCards2CardsProps {
  heading: string;
  description: string;
  plans: PricingCards2CardsPlan[];
  className?: string;
}

type Pricing2Props = PricingCards2CardsProps;
type Props = Partial<Pricing2Props>;

const defaultProps: Pricing2Props = {
  heading: "Pricing",
  description: "Choose the plan that fits your needs",
  plans: [
    {
      name: "Free",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/placeholder/pricing-plans/plan1.svg",
      description: "For individuals getting started",
      monthlyPrice: "₹0",
      yearlyPrice: "₹0",
      features: [
        "5 AI generations per month",
        "Unlimited public projects",
        "Live sandbox previews",
        "Share projects with a link",
      ],
      button: {
        text: "Get Started",
        url: "https://shadcnblocks.com",
      },
    },
    {
      name: "Pro",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/placeholder/pricing-plans/plan2.svg",
      description: "For professionals and teams",
      monthlyPrice: "₹1",
      yearlyPrice: "$499",
      features: [
        "100 AI generations per month",
        "Priority AI generation queue",
        "Team collaboration on projects",
        "Private projects & custom domains",
        "Priority email support",
        "One click Hosting"
      ],
      button: {
        text: "Purchase",
        url: "https://barmanji.com",
      },
      highlighted: true,
    },
  ],
};

export const CustomPricingTable = (props: Props) => {
  const { heading, description, plans, className } = {
    ...defaultProps,
    ...props,
  };

  const [isYearly, setIsYearly] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isPlanLoading, setIsPlanLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((user) => setIsPro(user?.Plan === "PAID"))
      .catch((error) => console.error("Failed to load current plan:", error))
      .finally(() => setIsPlanLoading(false));
  }, []);

  const handleCheckout = async (plan: PricingCards2CardsPlan) => {
    if (plan.name === "Pro" && isPro) {
      toast("You're already on the Pro plan");
      return;
    }

    if (plan.name === "Free") {
      if (isPro) return;
      toast("You're on the Free plan");
      return;
    }

    // Safety check for Razorpay script load
    if (typeof window === "undefined" || !window.Razorpay) {
      alert("Razorpay SDK failed to load. Please refresh and try again.");
      return;
    }

    const priceString = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const numericPrice = Number(priceString.replace(/[^0-9.-]+/g, ""));

    if (!numericPrice) return;

    const res = await createRazorpayOrder(numericPrice);

    if (!res.success) {
      alert("Failed to create Razorpay order");
      return;
    }

    const { orderId, amount, keyId } = res;

    const options: RazorpayCheckoutOptions = {
      key: keyId,
      amount: amount,
      currency: "INR",
      name: "Barmanji Corp.",
      description: `Subscription for ${plan.name} Plan`,
      order_id: orderId,
      handler: async function (response: RazorpayCheckoutResponse) {
        const result = await verifyPaymentAndSave({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });

        if (result?.success) {
          toast.success("Payment Successful! Pro plan unlocked.");
          setIsPro(true);
        } else {
          toast.error(result?.error || "Payment verification failed");
        }
      },
      theme: {
        color: "#3399cc",
      },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <section className={cn("py-12", className)}>
      <div className="flex flex-col items-center mb-6">
        <Image
          src={"/logo.svg"}
          width={60}
          height={60}
          alt="logo"
          className="hidden md:block invert dark:invert-0"
        />
      </div>

      <div className="container">
        <div className="mx-auto mb-5 max-w-5xl text-center">
          <h2 className="mb-4 text-4xl font-semibold tracking-tight lg:text-5xl">
            {heading}
          </h2>
          <p className="text-muted-foreground lg:text-lg">{description}</p>
        </div>
        <div className="flex flex-col items-center gap-10">
          <div className="flex items-center gap-5 text-base font-semibold">
              Monthly
              <Switch
                className="scale-125"
                checked={isYearly}
                onCheckedChange={() => setIsYearly(!isYearly)}
              />
              Yearly
            </div>
          <div className="mx-auto flex w-full max-w-5xl min-w-0 flex-col items-stretch gap-4 md:flex-row md:items-stretch md:justify-center">
            {(plans ?? []).map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  "flex w-full max-w-full min-w-0 flex-col justify-between gap-8 text-left shadow-none ring-0 md:flex-1 md:basis-0",
                  plan.highlighted
                    ? "border-2 border-primary"
                    : "border border-border",
                )}
              >
                <CardHeader className="gap-0.5">
                  <CardTitle>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{plan.name}</p>
                      {!isPlanLoading &&
                        ((plan.name === "Free" && !isPro) ||
                          (plan.name === "Pro" && isPro)) && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            <CircleCheck className="size-3" />
                            Current plan
                          </span>
                        )}
                    </div>
                  </CardTitle>
                  <div className="mb-5 flex min-w-0 flex-wrap items-end gap-x-1">
                    <span className="min-w-0 text-4xl font-medium tracking-tight">
                      {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-xl font-normal text-muted-foreground">
                      {isYearly ? "/per year" : "/per month"}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-6" />
                  {plan.featureListLabel && (
                    <p className="mb-3 font-semibold">
                      {plan.featureListLabel}
                    </p>
                  )}
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CircleCheck className="size-4 shrink-0" />
                        <span className="min-w-0 wrap-break-word">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto">
                  {plan.name === "Free" && isPro ? (
                    <Button
                      className="w-full cursor-not-allowed"
                      variant="outline"
                      disabled
                    >
                      <CircleX className="size-4" />
                      Unavailable
                    </Button>
                  ) : plan.name === "Free" ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleCheckout(plan)}
                    >
                      <CircleCheck className="size-4" />
                      Current plan
                    </Button>
                  ) : plan.name === "Pro" && isPro ? (
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => handleCheckout(plan)}
                    >
                      <CircleCheck className="size-4" />
                      Current plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                      onClick={() => handleCheckout(plan)}
                    >
                      {plan.button.text}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Added Razorpay Script element */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
    </section>
  );
};
