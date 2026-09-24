export function resolveOrigin(env = process.env, port = 3000) {
  const configured = env.APP_ORIGIN?.trim();
  const railwayDomain = env.RAILWAY_PUBLIC_DOMAIN?.trim();
  let url = new URL(configured || (railwayDomain ? `https://${railwayDomain}` : `http://localhost:${port}`));
  // A copied local .env must not override Railway's verified public domain.
  if (railwayDomain && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    url = new URL(`https://${railwayDomain}`);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
    throw new Error("APP_ORIGIN must be an HTTP(S) URL without credentials");
  return url.origin;
}
