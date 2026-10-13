import Link from "next/link";
import { Container } from "@/components/ui/container";
import type { getPublicStoreIdentity } from "@/lib/store/public-settings";

type StoreIdentity = Awaited<ReturnType<typeof getPublicStoreIdentity>>;

const footerGroups = [
  {
    title: "Shop",
    links: [
      ["Shop all", "/shop"],
      ["Farm essentials", "/shop/farm-essentials"],
      ["Ayurvedic wellness", "/shop/ayurvedic-wellness"],
      ["Herbal personal care", "/shop/herbal-personal-care"],
    ],
  },
  {
    title: "About",
    links: [
      ["Our story", "/about"],
      ["Our quality promise", "/quality"],
      ["Membership & rewards", "/membership"],
      ["Contact us", "/contact"],
    ],
  },
  {
    title: "Support",
    links: [
      ["Frequently asked questions", "/faq"],
      ["Shipping policy", "/shipping-policy"],
      ["Returns & replacements", "/returns"],
      ["Order tracking", "/order-tracking"],
    ],
  },
  {
    title: "Policies",
    links: [
      ["Privacy policy", "/privacy-policy"],
      ["Terms of service", "/terms"],
      ["Disclaimer", "/disclaimer"],
      ["Cancellation policy", "/cancellation-policy"],
    ],
  },
];

export function Footer({ identity }: { identity: StoreIdentity }) {
  return (
    <footer className="bg-teal text-white">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-12 lg:py-16">
        <div className="max-w-xs">
          <Link href="/" className="font-display text-3xl">
            {identity.storeName}
          </Link>
          {identity.tagline ? (
            <p className="mt-3 text-sm leading-6 text-white/70">
              {identity.tagline}
            </p>
          ) : null}
          {identity.contactInformation.email ||
          identity.contactInformation.phone ||
          identity.contactInformation.address ? (
            <address className="mt-4 space-y-1 text-xs text-white/70 not-italic">
              {identity.contactInformation.email ? (
                <a
                  href={`mailto:${identity.contactInformation.email}`}
                  className="block hover:text-white"
                >
                  {identity.contactInformation.email}
                </a>
              ) : null}
              {identity.contactInformation.phone ? (
                <a
                  href={`tel:${identity.contactInformation.phone}`}
                  className="block hover:text-white"
                >
                  {identity.contactInformation.phone}
                </a>
              ) : null}
              {identity.contactInformation.address ? (
                <span className="block">
                  {identity.contactInformation.address}
                </span>
              ) : null}
            </address>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/75">
            {identity.socialLinks.map((link) => (
              <a
                key={link.key}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-semibold tracking-[0.14em] text-[#e0c27d] uppercase">
              {group.title}
            </h2>
            <ul className="mt-4 space-y-3">
              {group.links.map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-white/75 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-white/15">
        <Container className="flex flex-col gap-2 py-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {identity.storeName}. All rights
            reserved.
          </p>
          <p>Made with care in India</p>
        </Container>
      </div>
    </footer>
  );
}
