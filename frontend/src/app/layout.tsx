import type { Metadata, Viewport } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Driver Scorecard",
    template: "%s · Driver Scorecard",
  },
  description:
    "Record a drive on your phone and get a safety score for braking, cornering, speed and idling.",
  appleWebApp: {
    capable: true,
    title: "Scorecard",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#121110",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("dark", instrumentSans.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
