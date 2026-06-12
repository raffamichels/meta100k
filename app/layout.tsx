import type { Metadata, Viewport } from "next";
import { Poppins, DM_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { DesktopWarning } from "@/components/ui/DesktopWarning";
import { Providers } from "@/components/Providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Meta 100K",
  description: "Planejador financeiro para sua meta de R$ 100.000",
  manifest: "/manifest.json",
  // Ícone do app para navegadores e dispositivos Apple
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meta 100K",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#22c55e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-body), sans-serif" }}>
        <Providers>
          <DesktopWarning />
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
