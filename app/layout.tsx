import type { Metadata } from "next";
import { Gasoek_One, Inter } from "next/font/google";
import "./globals.css";

const gasoek = Gasoek_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Puntos de Voluntariado",
  description:
    "Dashboard en vivo de los puntos que necesitan voluntarios y donaciones.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${gasoek.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
