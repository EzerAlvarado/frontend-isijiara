export interface LineaNotaVenta {
  descripcion: string
  precio?: number
}

export interface NotaVenta {
  numero: string
  fecha: string
  cliente: {
    nombre: string
    contacto: string
    domicilio: string
  }
  lineas: LineaNotaVenta[]
  recogera: string
  accesorio: string
  ajustes: string
  depositoReembolsable: string
  atendidaPor: string
  total: number
  anticipo: number
  pagado: boolean
  etiqueta?: string
  cantidadTrajes?: number
}
