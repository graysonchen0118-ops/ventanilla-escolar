import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bandeja de secretaría" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
