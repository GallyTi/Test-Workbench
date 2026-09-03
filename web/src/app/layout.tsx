import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { ActiveTimerWidget } from '@/components/layout/ActiveTimerWidget';
import { GalaxyBackground } from '@/components/ui/GalaxyBackground';
import { AuthGuard } from '@/components/layout/AuthGuard';

export const metadata: Metadata = {
  title: 'RITS QA Workbench | Enterprise Test & Architecture Platform',
  description: 'Enterprise test management, real-time multi-user execution and knowledge graph platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" className="dark h-full">
      <body className="min-h-full bg-black text-slate-100 font-sans antialiased selection:bg-white/20 selection:text-white flex flex-col relative">
        {/* Simple reactive galaxy starry background */}
        <GalaxyBackground />

        {/* Protected App Content with Login Barrier */}
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
