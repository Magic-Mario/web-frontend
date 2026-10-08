import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

// Tipografía del juego: Fredoka para títulos y display, Nunito para el
// cuerpo. Las variables —`--font-fredoka` y `--font-nunito`— son las que
// consumen `--font-display` y `--font-body` en `app/globals.css`.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simulador de vida",
  description:
    "Juego de simulación de vida: nace, crece y decide sobre los sucesos de la época",
  applicationName: "Simulador de vida",
  keywords: ["simulador", "vida", "juego", "bitlife"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
