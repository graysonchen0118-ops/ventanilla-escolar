import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Shell from "@/components/Shell";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: { default: "Ventanilla | Colegio Monteverde", template: "%s | Ventanilla" },
  description: "Atención por WhatsApp del Colegio Monteverde: respuestas desde las circulares, consultas de cada estudiante a la secretaría y avisos a orientación.",
};

export const viewport: Viewport = {
  themeColor: "#1d6b5f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={nunito.className}>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
