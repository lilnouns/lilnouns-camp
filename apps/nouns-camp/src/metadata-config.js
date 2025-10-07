import { APP_HOST } from "@/constants/env";

export default {
  viewportLightThemeColor: "#ffffff",
  viewportDarkThemeColor: "hsl(0 0% 10%)",
  appTitle: "Lil Nouns Camp",
  appDescription: "A Lil Nouns governance client",
  titleTemplate: "%s - Lil Nouns Camp",
  canonicalAppBasename: `https://${APP_HOST}`,
  openGraphType: "website",
  openGraphSiteName: APP_HOST,
  twitterCard: "summary",
  appleWebAppStatusBarStyle: "default",
  // Farcaster miniapp configuration
  miniappName: "Lil Nouns Camp",
  miniappButtonTitle: "🏛️ Open",
  miniappSplashBackgroundColor: "#ffffff", // matches light theme backgroundPrimary
};
