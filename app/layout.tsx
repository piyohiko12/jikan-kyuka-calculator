import type { Metadata } from 'next';
import './globals.css';
export const dynamic = 'force-static';
export const metadata: Metadata = { title: 'じかん休｜休暇入力計算', description: '勤務・休憩時間を設定して、出勤と早退から1時間単位の休暇入力を計算。' };
export default function RootLayout({children}: {children: React.ReactNode}) { return <html lang="ja"><body>{children}</body></html>; }
