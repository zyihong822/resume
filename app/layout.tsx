import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '雕马商家管理系统｜消息与待办中心原型',
  description: '商家端消息通知与待办中心交互原型',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
