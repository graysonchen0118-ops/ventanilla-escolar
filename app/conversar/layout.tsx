import type { Metadata } from "next";

export const metadata: Metadata = { title: "Probar el asistente" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
