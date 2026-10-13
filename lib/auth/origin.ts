export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  try {
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      .trim();
    const host = forwardedHost ?? request.headers.get("host");
    const protocol =
      request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ??
      requestUrl.protocol.slice(0, -1);
    const expectedOrigins = configuredOrigin
      ? new Set([new URL(configuredOrigin).origin])
      : new Set([
          requestUrl.origin,
          ...(host ? [new URL(`${protocol}://${host}`).origin] : []),
        ]);

    if (origin) return expectedOrigins.has(new URL(origin).origin);
    if (request.headers.get("sec-fetch-site") === "same-origin") return true;

    const referer = request.headers.get("referer");
    return referer ? expectedOrigins.has(new URL(referer).origin) : false;
  } catch {
    return false;
  }
}
