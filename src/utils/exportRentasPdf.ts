import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { jsPDF } from 'jspdf'
import type { LineaNegocio } from '../types/auth'
import type { Renta } from '../types'
import { analizarRentasParaReporte, type TopItem } from './exportRentasAnalytics'
import { etiquetaExportTab } from './exportRentas'
import type { TabRentas } from './rentasConfig'

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
)

const COLORES_TIPO = ['#2563eb', '#16a34a', '#d97706']
const COLORES_BARRAS = ['#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

function slugTab(tab: TabRentas, linea: LineaNegocio): string {
  if (linea === 'trajes') return 'tuxedos'
  if (tab === 'quince') return 'xv'
  if (tab === 'boda') return 'novia'
  return 'noche'
}

export function nombreArchivoReportePdf(
  tab: TabRentas,
  linea: LineaNegocio,
  mesKey: string,
): string {
  return `reporte-rentas-${mesKey}-${slugTab(tab, linea)}.pdf`
}

function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(monto)
}

function esperarChart(chart: Chart): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chart.update()
        resolve()
      })
    })
  })
}

async function chartDoughnut(
  labels: string[],
  data: number[],
  colors: string[],
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 480
  canvas.height = 360
  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 1, borderColor: '#fff' }],
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
      },
    },
  })
  await esperarChart(chart)
  const url = canvas.toDataURL('image/png')
  chart.destroy()
  return url
}

async function chartBarrasHorizontales(
  titulo: string,
  items: TopItem[],
): Promise<string | null> {
  if (items.length === 0) return null

  const canvas = document.createElement('canvas')
  canvas.width = 520
  canvas.height = 280
  const labels = items.map((i) => i.valor)
  const data = items.map((i) => i.count)

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: titulo,
          data,
          backgroundColor: COLORES_BARRAS.slice(0, items.length),
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { size: 10 } },
          grid: { color: '#e5e7eb' },
        },
        y: {
          ticks: { font: { size: 10 } },
          grid: { display: false },
        },
      },
    },
  })
  await esperarChart(chart)
  const url = canvas.toDataURL('image/png')
  chart.destroy()
  return url
}

function agregarTopLista(
  doc: jsPDF,
  x: number,
  y: number,
  titulo: string,
  items: TopItem[],
): number {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, x, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  if (items.length === 0) {
    doc.setTextColor(100)
    doc.text('Sin datos', x, y + 6)
    doc.setTextColor(0)
    return y + 14
  }

  let cy = y + 6
  for (const item of items) {
    doc.text(`${item.valor} — ${item.count}`, x, cy)
    cy += 5
  }
  doc.setTextColor(0)
  return cy + 4
}

export interface OpcionesReportePdf {
  mesKey?: string
  mesLabel?: string
}

export async function exportarRentasReportePdf(
  rentas: Renta[],
  tab: TabRentas,
  linea: LineaNegocio,
  opts: OpcionesReportePdf = {},
): Promise<{ nombre: string; filas: number }> {
  const mesKey = opts.mesKey ?? new Date().toISOString().slice(0, 7)
  const mesLabel = opts.mesLabel ?? mesKey
  const nombre = nombreArchivoReportePdf(tab, linea, mesKey)
  const analytics = analizarRentasParaReporte(rentas, linea)
  const tabLabel = etiquetaExportTab(tab, linea)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margen = 14
  let y = margen

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Reporte mensual de rentas', margen, y)

  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(60)
  doc.text(`${mesLabel} · ${tabLabel}`, margen, y)

  y += 6
  doc.setFontSize(9)
  doc.text(
    `Generado: ${new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}`,
    margen,
    y,
  )
  doc.setTextColor(0)

  y += 10
  doc.setDrawColor(220)
  doc.line(margen, y, 210 - margen, y)
  y += 8

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen', margen, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const resumen = [
    `Total de operaciones: ${analytics.totalOperaciones}`,
    `Operaciones activas: ${analytics.totalActivas}`,
    ...(analytics.totalCanceladas > 0
      ? [`Canceladas: ${analytics.totalCanceladas}`]
      : []),
    `Rentas: ${analytics.porTipo.renta}  ·  Ventas: ${analytics.porTipo.venta}  ·  Premier: ${analytics.porTipo.premier}`,
    `Total ingresos: ${formatearMoneda(analytics.totalIngresos)}`,
  ]
  for (const linea of resumen) {
    doc.text(linea, margen, y)
    y += 5.5
  }

  y += 4
  const tiposLabels = ['Renta', 'Venta', 'Premier']
  const tiposData = [
    analytics.porTipo.renta,
    analytics.porTipo.venta,
    analytics.porTipo.premier,
  ]
  const pieImg = await chartDoughnut(tiposLabels, tiposData, COLORES_TIPO)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Operaciones por tipo', margen, y)
  y += 3
  doc.addImage(pieImg, 'PNG', margen, y, 85, 64)
  y += 70

  doc.setFontSize(12)
  doc.text('Más rentados', margen, y)
  y += 6

  const chartColor = await chartBarrasHorizontales(analytics.labels.color, analytics.topColor)
  if (chartColor) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(analytics.labels.color, margen, y)
    y += 2
    doc.addImage(chartColor, 'PNG', margen, y, 180, 48)
    y += 52
  }

  const chartSaco = await chartBarrasHorizontales(analytics.labels.saco, analytics.topSaco)
  if (chartSaco) {
    if (y > 240) {
      doc.addPage()
      y = margen
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(analytics.labels.saco, margen, y)
    y += 2
    doc.addImage(chartSaco, 'PNG', margen, y, 180, 48)
    y += 52
  }

  const chartChaleco = await chartBarrasHorizontales(
    analytics.labels.chaleco,
    analytics.topChaleco,
  )
  if (chartChaleco) {
    if (y > 240) {
      doc.addPage()
      y = margen
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(analytics.labels.chaleco, margen, y)
    y += 2
    doc.addImage(chartChaleco, 'PNG', margen, y, 180, 48)
    y += 54
  }

  if (y > 220) {
    doc.addPage()
    y = margen
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Detalle top 5', margen, y)
  y += 6

  y = agregarTopLista(doc, margen, y, analytics.labels.color, analytics.topColor)
  y = agregarTopLista(doc, margen, y, analytics.labels.saco, analytics.topSaco)
  agregarTopLista(doc, margen, y, analytics.labels.chaleco, analytics.topChaleco)

  doc.save(nombre)
  return { nombre, filas: rentas.length }
}
