import type { Metadata, Viewport } from "next";
import { Fredoka, Rubik } from "next/font/google";
import "./globals.css";

const display = Fredoka({
  subsets: ["hebrew", "latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-display",
});

const ui = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "מחולל בדיחות",
  description: "בדיחה על כל נושא שתרצו",
  // Short name under the icon on the iPhone home screen.
  appleWebApp: { capable: true, title: "בדיחות", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFD400",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${display.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
