import { useTintaImpresion } from '../../hooks/useTintaImpresion'

export function SelectorTintaImpresion() {
  const { tinta, setTinta } = useTintaImpresion()

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      <button
        type="button"
        className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
          tinta === 'negro' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
        }`}
        onClick={() => setTinta('negro')}
        title="Imprimir en negro"
      >
        Negro
      </button>
      <button
        type="button"
        className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
          tinta === 'azul' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
        }`}
        onClick={() => setTinta('azul')}
        title="Sin tinta negra: el texto sale azul marino"
      >
        Azul marino
      </button>
    </div>
  )
}
