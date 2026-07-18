import { Navigate } from 'react-router-dom'

export function HomePage() {
  return <Navigate to="/rentas" replace />
}

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">Próximamente — conectar con Django API</p>
      </div>
    </div>
  )
}
