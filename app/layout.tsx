import type { Metadata } from "next";
import { Gasoek_One, Google_Sans_Flex } from "next/font/google";
import "./globals.css";

// Gasoek One es display: se usa únicamente en el título de la página.
const gasoek = Gasoek_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const googleSans = Google_Sans_Flex({
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
    <html lang="es" className={`${gasoek.variable} ${googleSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
