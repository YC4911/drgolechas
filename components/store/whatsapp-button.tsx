import { MessageCircle } from "lucide-react";
import type { getPublicStoreIdentity } from "@/lib/store/public-settings";

type StoreIdentity = Awaited<ReturnType<typeof getPublicStoreIdentity>>;

function whatsappHref(identity: StoreIdentity): string | null {
  const social = identity.socialLinks.find((link) => link.key === "whatsapp");
  if (social) return social.url;
  const digits = identity.contactInformation.phone.replace(/\D/g, "");
  const number =
    digits.length === 10
      ? `91${digits}`
      : digits.length === 11 && digits.startsWith("0")
        ? `91${digits.slice(1)}`
        : digits.length >= 12 && digits.length <= 15
          ? digits
          : null;
  return number ? `https://wa.me/${number}` : null;
}

export function WhatsAppButton({ identity }: { identity: StoreIdentity }) {
  const href = whatsappHref(identity);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-4 bottom-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#167b55] px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#116746] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#083847] sm:right-6 sm:bottom-6"
    >
      <MessageCircle aria-hidden="true" size={19} />
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  );
}
