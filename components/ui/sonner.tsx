"use client";

import type { ComponentProps } from "react";
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = ComponentProps<typeof SonnerToaster>;

export const Toaster = (props: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "system"}
      position="top-center"
      richColors
      closeButton
      className="toaster group"
      {...props}
    />
  );
};
