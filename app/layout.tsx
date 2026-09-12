import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { ClerkProvider } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "v0-clone",
    template: "%s | v0-clone",
  },
  description:
    "v0-clone — an AI-powered app builder that turns prompts into working web apps with a conversational question flow.",
  applicationName: "v0-clone",
  keywords: ["v0", "clone", "ai", "app builder", "nextjs"],
  creator: "v0-clone",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "v0-clone",
    title: {
      default: "v0-clone",
      template: "%s | v0-clone",
    },
    description:
      "v0-clone — an AI-powered app builder that turns prompts into working web apps.",
  },
  twitter: {
    card: "summary",
    title: "v0-clone",
    description:
      "v0-clone — an AI-powered app builder that turns prompts into working web apps.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-mono",
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <TooltipProvider>{children}</TooltipProvider>
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
