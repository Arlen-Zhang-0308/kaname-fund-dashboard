import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kaname · 私人持仓驾驶舱',
  description: 'A Vercel-backed fund and holdings dashboard with server-side portfolio APIs.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%2310110e'/%3E%3Cpath d='M8 21 L14 12 L19 17 L24 8' stroke='%23d8b45f' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='8' cy='21' r='2.2' fill='%237fc89a'/%3E%3Ccircle cx='24' cy='8' r='2.2' fill='%23d8b45f'/%3E%3C/svg%3E"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
