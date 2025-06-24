import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 1. Importa a fonte
import "./globals.css";

// 2. Configura a fonte
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Autoavaliação",
  description: "Sistema para avaliação de desempenho em grupos de trabalho.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {/* 3. Aplica a classe da fonte ao body */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}