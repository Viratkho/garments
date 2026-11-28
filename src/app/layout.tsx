import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { GarmentFlowProvider } from "@/context/GarmentFlowContext";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GARMENTFLOW · DP ENTERPRISES",
  description:
    "Internal garment manufacturing, order management, inventory, workforce attendance, salary, and P&L operations platform for DP ENTERPRISES.",
};

const PRE_PAINT_SCRIPT = `
(function() {
  try {
    var t = localStorage.getItem('garmentflow.dp.v1.theme');
    var sRaw = localStorage.getItem('garmentflow.dp.v1.state');
    var bg = 'dark-radial';
    if (sRaw) {
      var parsed = JSON.parse(sRaw);
      if (parsed && parsed.settings) {
        if (!t && (parsed.settings.theme === 'dark' || parsed.settings.theme === 'light')) t = parsed.settings.theme;
        if (parsed.settings.backgroundStyle) bg = parsed.settings.backgroundStyle;
      }
    }
    var theme = (t === 'light' || t === 'dark') ? t : 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.bg = bg;
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.bg = 'dark-radial';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-bg="dark-radial"
      suppressHydrationWarning
      className={`${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0B0B0F" />
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      </head>
      <body>
        <GarmentFlowProvider>{children}</GarmentFlowProvider>
      </body>
    </html>
  );
}
