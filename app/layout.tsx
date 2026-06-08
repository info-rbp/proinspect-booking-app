import './styles.css';

export const metadata = {
  title: 'ProInspect Booking App',
  description: 'Inspection booking and scheduling platform for ProInspect'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
