import type { DocumentoRenta } from '../types/documentoRenta'

export { calcularResta } from '../utils/documentoRenta'

/** Ejemplo combinando nota de venta tux + recibo formal + pagaré */
export const documentoRentaMock: DocumentoRenta = {
  folio: '5369',
  fechaRenta: '05/03/2026 12:00 p.m.',
  cliente: {
    nombre: 'Carolina Prieto',
    telefono: '9289196513',
    direccion: 'Yuma',
  },
  fechas: {
    evento: '28/03/2026',
    entrega: '25/03/2026',
    regreso: '29/03/2026',
    cita: '28 Marzo',
  },
  pagos: [
    { fecha: '2026-03-05', monto: 341, formaPago: 'Efectivo' },
  ],
  articulos: [
    {
      cantidad: 2,
      tipo: 'Renta',
      descripcion:
        'TUX Blanco SS — Saco/Chaleco 38R-40R — Camisas M — Pantalón 32R — Moño Negro',
      importe: 488,
    },
  ],
  lineasDetalle: [
    { descripcion: 'TUX Blanco SS' },
    { descripcion: 'Saco y chaleco 38R/40R' },
    { descripcion: '2 Camisas Blancas M' },
    { descripcion: '2 Pantalones Negros 32R' },
    { descripcion: '2 Moños Negros' },
  ],
  recogera: '28 Marzo',
  accesorio: '',
  ajustes: 'SUBIR MANGAS',
  depositoReembolsable: 'Venta',
  atendidaPor: 'Claudio',
  garantia: 0,
  total: 488,
  anticipo: 341,
  pagaré: {
    estado: 'SONORA',
    fechaEmision: '5 de 3 de 2026',
    ordenDe: 'ISIJARA BOUTIQUE',
    lugarPago: 'San Luis Río Colorado, Son.',
    fechaPago: '29 de 3 de 2026',
    cantidadLetra: 'CIENTO CUARENTA Y SIETE PESOS 00/100 M.N.',
    buenoPor: 147,
  },
}

/** @deprecated usar documentoRentaMock */
export const notaVentaMock = documentoRentaMock
