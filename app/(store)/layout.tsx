import type { ReactNode } from "react";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { absoluteUrl, serializeJsonLd } from "@/lib/seo/site-url";
import { getPublicStoreIdentity } from "@/lib/store/public-settings";
import { getStoreCategories } from "@/lib/store-categories";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [categories, identity] = await Promise.all([
    getStoreCategories(),
    getPublicStoreIdentity(),
  ]);
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: identity.storeName,
    description: identity.tagline,
    url: absoluteUrl("/"),
    ...(identity.logo ? { logo: absoluteUrl(identity.logo) } : {}),
    ...(identity.contactInformation.phone
      ? {
          telephone: identity.contactInformation.phone,
          contactPoint: {
            "@type": "ContactPoint",
            telephone: identity.contactInformation.phone,
            contactType: "customer service",
          },
        }
      : {}),
    ...(identity.contactInformation.email
      ? { email: identity.contactInformation.email }
      : {}),
    ...(identity.contactInformation.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: identity.contactInformation.address,
            addressCountry: "IN",
          },
        }
      : {}),
    sameAs: identity.socialLinks.map(({ url }) => url),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(organizationJsonLd),
        }}
      />
      <Header categories={categories} identity={identity} />
      <main className="flex-1">{children}</main>
      <Footer identity={identity} />
      <WhatsAppButton identity={identity} />
    </div>
  );
}
