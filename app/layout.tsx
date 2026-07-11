import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-тренажер продаж — Nexaire Tech demo",
  description: "Демо AI-тренажера продаж под скрипты и возражения компании"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" data-theme="dark">
      <body>
        <header className="site-header">
          <a className="brand" href="/" aria-label="Nexaire Tech demo">
            <Image
              className="brand-logo brand-logo-light"
              src="/nexaire-tech-horizontal.png"
              width={252}
              height={64}
              alt="Nexaire Tech"
              priority
            />
            <Image
              className="brand-logo brand-logo-dark"
              src="/nexaire-tech-horizontal-white.png"
              width={252}
              height={64}
              alt="Nexaire Tech"
              priority
            />
          </a>
          <nav className="top-nav" aria-label="Основная навигация">
            <a href="/scenarios">Сценарии</a>
            <a href="/#how">Как работает</a>
            <a href="/#lead">Внедрение</a>
            <ThemeToggle />
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div>
            <Image
              className="footer-logo footer-logo-light"
              src="/nexaire-tech-horizontal.png"
              width={220}
              height={56}
              alt="Nexaire Tech"
            />
            <Image
              className="footer-logo footer-logo-dark"
              src="/nexaire-tech-horizontal-white.png"
              width={220}
              height={56}
              alt="Nexaire Tech"
            />
            <p>AI-инструменты для обучения, продаж и внутренних процессов.</p>
          </div>
          <div className="footer-links">
            <a href="/scenarios">Попробовать демо</a>
            <a href="/#lead">Обсудить внедрение</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
