import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { ActiveTimerWidget } from '@/components/layout/ActiveTimerWidget';
import { GalaxyBackground } from '@/components/ui/GalaxyBackground';

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

        {/* Floating Top Glass Navigation */}
        <div className="relative z-20 w-full">
          <Navbar />
        </div>

        {/* Centered Constrained Container for Clean Bento Layout (nemusí byť full width) */}
        <main className="relative z-10 flex-1 w-full max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Floating Active Step Timer Widget */}
        <div className="relative z-30">
          <ActiveTimerWidget />
        </div>
      </body>
    </html>
  );
}
