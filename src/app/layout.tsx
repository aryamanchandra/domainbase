import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Domainbase',
  description: 'Manage subdomains, DNS records, and domain configurations with real-time analytics and verification tools',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

