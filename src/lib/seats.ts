export const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const

export type SeatRow = (typeof SEAT_ROWS)[number]

export const SEAT_CAPACITY_BY_ROW: Record<SeatRow, number> = {
  A: 24,
  B: 26,
  C: 26,
  D: 25,
  E: 20,
  F: 18,
  G: 24,
  H: 24,
  I: 19,
  J: 18,
}

export function isValidSeatRow(row: string): row is SeatRow {
  return SEAT_ROWS.includes(row as SeatRow)
}

export function getSeatCapacity(row: string): number | undefined {
  if (!isValidSeatRow(row)) return undefined
  return SEAT_CAPACITY_BY_ROW[row]
}

export function buildSeatLabel(row: string, seatNumber: number | string): string {
  return `${row}-${seatNumber}`
}

export function parseSeatLabel(seatLabel: string): { row: string; seatNumber: number } | null {
  if (typeof seatLabel !== 'string') return null
  const trimmed = seatLabel.trim()
  const match = trimmed.match(/^([A-Ja-j])-(\d+)$/)
  if (!match) return null
  const row = match[1].toUpperCase()
  const seatNumber = parseInt(match[2], 10)
  return { row, seatNumber }
}

export function isValidSeatLabel(seatLabel: string): boolean {
  const parsed = parseSeatLabel(seatLabel)
  if (!parsed) return false
  const capacity = getSeatCapacity(parsed.row)
  if (capacity === undefined) return false
  return parsed.seatNumber >= 1 && parsed.seatNumber <= capacity
}

export function normalizeSeatLabel(seatLabel: string): string {
  const parsed = parseSeatLabel(seatLabel)
  if (!parsed) return seatLabel.trim().toUpperCase()
  return buildSeatLabel(parsed.row, parsed.seatNumber)
}
