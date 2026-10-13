export function isNextImageSourceConfigured(source: string): boolean {
  if (source.startsWith("/")) return true;
  try {
    const url = new URL(source);
    return url.protocol === "https:" && url.hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}
