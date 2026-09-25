import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agua YA - Control de Entregas & Despacho',
  description: 'Sistema de gestión de pedidos y asignación a repartidores en tiempo real',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
