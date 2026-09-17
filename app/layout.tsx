import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeachAI — Learn by Teaching",
  description: "Kiểm tra mức độ hiểu bài bằng phương pháp Teach-Back.",
  icons: {
    icon: "/favicon.svg?v=teachai-2",
    shortcut: "/favicon.svg?v=teachai-2",
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
