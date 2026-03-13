import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veo 3 Video Generator",
  description:
    "Generate AI videos using Claude for prompt enhancement and Google Veo 3 for video synthesis",
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
