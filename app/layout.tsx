import type { Metadata } from "next";
import { Fraunces, Literata, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const editor = Literata({
  subsets: ["latin"],
  variable: "--font-editor",
  display: "swap",
});

const ui = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deep Work",
  description:
    "A quiet writing surface over ambient video — for flow, reflection, and focus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${editor.variable} ${ui.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
