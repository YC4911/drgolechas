import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { isNextImageSourceConfigured } from "@/lib/images";
import type { getPublicStoreIdentity } from "@/lib/store/public-settings";

type StoreIdentity = Awaited<ReturnType<typeof getPublicStoreIdentity>>;

export function Footer({ identity }: { identity: StoreIdentity }) {
  return (
    <footer className="bg-teal relative isolate overflow-hidden text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      >
        <Image
          src="/footer-farm-background.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[center_65%]"
        />
        <div className="bg-teal/55 absolute inset-0" />
      </div>
      <Container className="relative z-10 py-10 sm:py-12">
        <div className="relative flex flex-col items-center gap-6 text-center lg:min-h-52 lg:justify-center">
          <div className="max-w-xs min-w-0 lg:mx-auto">
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
                    className="block break-words hover:text-white"
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
            <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-white/75">
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
          <Link
            href="/"
            aria-label={`${identity.storeName} home`}
            className="order-first w-32 shrink-0 sm:w-40 lg:absolute lg:top-1/2 lg:right-0 lg:order-none lg:w-52 lg:-translate-y-1/2"
          >
            <Image
              src={identity.logo}
              alt={`${identity.storeName} logo`}
              width={240}
              height={190}
              unoptimized={!isNextImageSourceConfigured(identity.logo)}
              className="h-auto w-full object-contain"
            />
          </Link>
        </div>
      </Container>
      <div className="relative z-10 border-t border-white/15">
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
