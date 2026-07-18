# Vestimenta Elite — Frontend

Sistema de renta de trajes. Frontend en React + TypeScript, preparado para conectar con backend Django.

## Requisitos

- Node.js 18+ (recomendado)
- npm

## Instalación

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

## Pantallas incluidas

| Ruta | Descripción |
|------|-------------|
| `/rentas` | Registro de rentas por fecha |
| `/devoluciones` | Devolución de trajes + modal de multa tardía |
| `/inventario` | Catálogo con filtros (color, textura, tipo, talla) |
| `/corte` | Corte del día / resumen financiero |

## Stack

- **React 18** + **TypeScript**
- **Vite** — bundler y dev server
- **Tailwind CSS** — estilos
- **React Router** — navegación
- **Lucide React** — iconos

## Conexión con Django (próximo paso)

El proxy en `vite.config.ts` redirige `/api/*` a `http://localhost:8000`. Cuando tengas el backend:

1. Crea servicios en `src/services/api.ts` para llamar a los endpoints.
2. Reemplaza los datos en `src/data/mockData.ts` por llamadas fetch.
3. Configura CORS en Django para `http://localhost:5173`.

## Estructura

```
src/
├── components/
│   ├── layout/     # Sidebar, Header, AppLayout
│   └── ui/         # StatusBadge, Modal, SearchInput
├── data/           # Mock data (temporal)
├── pages/          # Pantallas principales
└── types/          # TypeScript interfaces
```
