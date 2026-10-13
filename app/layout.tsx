import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Dr. Golechas | Thoughtful care, rooted in nature",
    template: "%s | Dr. Golechas",
  },
  description:
    "Discover thoughtfully selected farm essentials, wellness, and personal care from Dr. Golechas.",
  openGraph: {
    type: "website",
    siteName: "Dr. Golechas",
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
