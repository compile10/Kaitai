import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const releaseBuild =
    process.env.EAS_BUILD_PROFILE === "preview" ||
    process.env.EAS_BUILD_PROFILE === "production" ||
    process.env.NODE_ENV === "production";

  if (releaseBuild && !apiUrl) {
    throw new Error(
      "Set EXPO_PUBLIC_API_URL to https://kaitai.app in the EAS production environment before building a release.",
    );
  }

  let origin: string | undefined;
  if (apiUrl) {
    const message =
      "EXPO_PUBLIC_API_URL must be an HTTPS origin without credentials, a path, query, or fragment (https://kaitai.app).";
    let url: URL;
    try {
      url = new URL(apiUrl);
    } catch {
      throw new Error(message);
    }
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      /(^|\.)(test\.com|example\.(com|net|org)|localhost)$/.test(url.hostname)
    ) {
      throw new Error(message);
    }
    origin = url.origin;
  }

  return {
    ...config,
    name: config.name ?? "Kaitai",
    slug: config.slug ?? "kaitai",
    extra: {
      ...config.extra,
      apiUrl: origin,
    },
  };
};
