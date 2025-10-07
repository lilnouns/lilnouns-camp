import metaConfig from "@/metadata-config";

const buildMiniappConfig = (canonicalPathname = "/") => {
  const baseUrl = metaConfig.canonicalAppBasename;
  const url = `${baseUrl}${canonicalPathname}`;

  return {
    version: "1",
    imageUrl: `${baseUrl}/opengraph-image`,
    button: {
      title: metaConfig.miniappButtonTitle,
      action: {
        type: "launch_miniapp",
        url,
        name: metaConfig.miniappName,
        splashImageUrl: `${baseUrl}/apple-icon.png`,
        splashBackgroundColor: metaConfig.miniappSplashBackgroundColor,
      },
    },
  };
};

export const build = ({ title, description, canonicalPathname }) => {
  const canonicalUrl =
    canonicalPathname == null
      ? undefined
      : `${metaConfig.canonicalAppBasename}${canonicalPathname}`;

  const miniappConfig = buildMiniappConfig(canonicalPathname);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    twitter: {
      title,
      description,
      url: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
    other: {
      "fc:miniapp": JSON.stringify(miniappConfig),
    },
  };
};
