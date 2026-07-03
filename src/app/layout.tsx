import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Apex Marketing — AI-Powered Marketing Automation",
  description:
    "Apex Marketing is an AI-powered marketing automation platform that analyzes your brand, generates content, and manages your social media presence.",
  keywords: ["marketing", "automation", "AI", "brand analysis", "social media"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans")} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
