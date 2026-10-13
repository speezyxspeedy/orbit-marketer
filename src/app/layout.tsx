import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrbitMarketer | Autonomous Enterprise AI Campaign Engine",
  description: "Brand-consistent, multi-channel campaign generation engine built for OrbitApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080c14] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
