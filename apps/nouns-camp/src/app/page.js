import ClientAppProvider from "@/app/client-app-provider";
import LandingScreen from "@/components/landing-screen";

export const runtime = 'edge';

export default function Page() {
  return (
    <ClientAppProvider>
      <LandingScreen />
    </ClientAppProvider>
  );
}
