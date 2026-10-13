import { connectToDatabase } from "@/lib/db/connect";
import { SiteSettingsModel } from "@/models/site-settings";

const socialLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  other: "More",
};

export async function getPublicStoreIdentity() {
  const fallback = {
    logo: "",
    storeName: "Dr. Golecha's Herbal Farm",
    tagline: "Herbal wellness from Maharashtra, India",
    contactInformation: {
      phone: "9762373730",
      email: "brahmanathpharma@gmail.com",
      address:
        "At Post Poonatgaon, Taluka Newasa, District Ahilyanagar, Maharashtra, India",
    },
    socialLinks: [],
  };

  if (!process.env.MONGODB_URI?.trim()) {
    return fallback;
  }
  await connectToDatabase();
  const settings = await SiteSettingsModel.findOne({ key: "store" })
    .select("logo storeName tagline socialLinks contactInformation")
    .exec();
  const entries = Array.from(settings?.socialLinks.entries() ?? []);

  return {
    logo: settings?.logo ?? fallback.logo,
    storeName: settings?.storeName || fallback.storeName,
    tagline: settings?.tagline ?? fallback.tagline,
    contactInformation: settings?.contactInformation ?? fallback.contactInformation,
    socialLinks: entries.flatMap(([key, value]) => {
      const label =
        socialLabels[key] ??
        key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replaceAll("_", " ")
          .replace(/\b\w/g, (character) => character.toUpperCase());
      if (typeof value !== "string" || !value) return [];
      try {
        const url = new URL(value);
        if (url.protocol !== "https:" && url.protocol !== "http:") return [];
        return [{ key, label, url: url.toString() }];
      } catch {
        return [];
      }
    }),
  };
}
