import type { Metadata } from 'next';
import './globals.css';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'やすみナビ｜時間休かんたん計算',
  description: '勤務・休憩時間を設定して、出勤と早退から1時間単位の時間休をかんたん計算。',
  manifest: './manifest.webmanifest',
  icons: {
    icon: [{url: './favicon.svg', type: 'image/svg+xml'}],
    apple: [{url: './apple-touch-icon.png', sizes: '180x180'}],
  },
  appleWebApp: {capable: true, title: 'やすみナビ', statusBarStyle: 'default'},
};
export const viewport = {width: 'device-width', initialScale: 1, themeColor: '#b84f7a'};
export default function RootLayout({children}: {children: React.ReactNode}) { return <html lang="ja"><body>{children}</body></html>; }
