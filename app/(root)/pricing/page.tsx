"use client";

import Image from "next/image";
import { PricingTable } from "@clerk/nextjs";
export default function Page() {
  return (
    <div className="flex items-center justify-center w-full px-4 py-8">
      <div className="max-w-5xl w-full">
        <section className="space-y-8 flex flex-col items-center">
          <div className="flex flex-col items-center">
            <Image
              src={"/logo.svg"}
              width={60}
              height={60}
              alt="logo"
              className="hidden md:block invert dark:invert-0"
            />
          </div>
          <h1 className="text-xl md:text-3xl font-bold text-center">Pricing</h1>
          <p className="text-muted-foreground text-center text-sm md:text-base">
            Choose the plan that fits your needs
          </p>
          <PricingTable/>
        </section>
      </div>
    </div>
  );
}
