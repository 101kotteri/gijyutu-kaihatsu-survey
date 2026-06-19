import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'アンケート結果審査シート',
  description: '技術開発部 - 社員アンケート結果審査ツール',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${geist.className} bg-gray-950 text-white antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
