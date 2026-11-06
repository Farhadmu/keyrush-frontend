import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'KEYRUSH — Global Multiplayer Typing Esports & Competition Platform',
  description: 'Type Fast. Race Smart. Compete Worldwide. Race 2.5D hypercars driven by keystroke velocity, enter live 2-7 player rooms, or compete in 20-300 participant championships.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col justify-between cyber-grid">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
