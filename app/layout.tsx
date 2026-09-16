import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeachAI — Learn by Teaching",
  description: "Learn more deeply by explaining concepts to an AI student.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
