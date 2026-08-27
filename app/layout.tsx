import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-тренажёр продаж для обучения менеджеров — Nexaire Tech",
  description:
    "AI-тренажёр продаж для практики менеджеров: реалистичные диалоги, разбор ошибок и настройка под продукт, воронку и сценарии вашей компании.",
  alternates: {
    canonical: "https://trainer.nexaire.ru"
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://trainer.nexaire.ru",
    siteName: "Nexaire Tech",
    title: "AI-тренажёр продаж для обучения менеджеров — Nexaire Tech",
    description:
      "AI-тренажёр продаж для практики менеджеров: реалистичные диалоги, разбор ошибок и настройка под продукт, воронку и сценарии вашей компании."
  },
  twitter: {
    card: "summary",
    title: "AI-тренажёр продаж для обучения менеджеров — Nexaire Tech",
    description:
      "AI-тренажёр продаж для практики менеджеров: реалистичные диалоги, разбор ошибок и настройка под продукт, воронку и сценарии вашей компании."
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" data-theme="dark">
      <body>
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {
                if (document.scripts[j].src === r) { return; }
              }
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=110755555', 'ym');

            ym(110755555, 'init', {
              ssr: true,
              webvisor: true,
              clickmap: true,
              ecommerce: 'dataLayer',
              referrer: document.referrer,
              url: location.href,
              accurateTrackBounce: true,
              trackLinks: true
            });
          `}
        </Script>
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/110755555"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
        <header className="site-header">
          <a className="brand" href="/" aria-label="Nexaire Tech">
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
            <div className="top-nav-links">
              <a href="/#how">Как работает</a>
              <a href="/#features">Возможности</a>
              <a href="/#launch">Запуск</a>
              <a href="/#developer">О разработчике</a>
              <a href="/#faq">Вопросы</a>
            </div>
            <a className="button button-primary header-demo-button" href="/scenarios">
              Попробовать демо
            </a>
            <ThemeToggle />
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p className="footer-line">
            <span>ООО «Нексэйр»</span>
            <span aria-hidden="true">·</span>
            <span>ИНН 5027341751</span>
            <span aria-hidden="true">·</span>
            <span>ОГРН 1255000094414</span>
            <span aria-hidden="true">·</span>
            <a href="mailto:info@nexaire.ru">info@nexaire.ru</a>
            <span aria-hidden="true">·</span>
            <a href="https://nexaire.ru/privacy/" target="_blank" rel="noopener noreferrer">
              Политика конфиденциальности
            </a>
            <span aria-hidden="true">·</span>
            <a href="https://tech.nexaire.ru" target="_blank" rel="noopener noreferrer">
              Nexaire Tech
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
