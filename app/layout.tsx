import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Dr. Golecha's Herbal Farm | Nature's Goodness. Tradition's Wisdom.",
    template: "%s | Dr. Golecha's Herbal Farm",
  },
  description:
    "Discover herbal wellness, traditional Ayurvedic preparations, natural foods and botanical personal care from Dr. Golecha's Herbal Farm.",
  icons: {
    icon: "/dr-golechas-logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "Dr. Golecha's Herbal Farm",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
