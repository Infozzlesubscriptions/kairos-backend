import { describe, expect, it } from 'vitest'

import {
  SEAT_CAPACITY_BY_ROW,
  SEAT_ROWS,
  buildSeatLabel,
  getSeatCapacity,
  isValidSeatLabel,
  isValidSeatRow,
  normalizeSeatLabel,
  parseSeatLabel,
} from '@/lib/seats'

describe('seat helpers', () => {
  it('defines the expected rows', () => {
    expect(SEAT_ROWS).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'])
  })

  it('defines the expected capacities', () => {
    expect(SEAT_CAPACITY_BY_ROW).toEqual({
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
    })
  })

  it('validates rows', () => {
    expect(isValidSeatRow('A')).toBe(true)
    expect(isValidSeatRow('J')).toBe(true)
    expect(isValidSeatRow('K')).toBe(false)
    expect(isValidSeatRow('')).toBe(false)
  })

  it('returns capacity for valid rows', () => {
    expect(getSeatCapacity('A')).toBe(24)
    expect(getSeatCapacity('B')).toBe(26)
    expect(getSeatCapacity('J')).toBe(18)
    expect(getSeatCapacity('K')).toBeUndefined()
  })

  it('parses valid seat labels', () => {
    expect(parseSeatLabel('A-1')).toEqual({ row: 'A', seatNumber: 1 })
    expect(parseSeatLabel('b-12')).toEqual({ row: 'B', seatNumber: 12 })
    expect(parseSeatLabel(' J-18 ')).toEqual({ row: 'J', seatNumber: 18 })
  })

  it('rejects invalid seat labels', () => {
    expect(parseSeatLabel('A1')).toBeNull()
    expect(parseSeatLabel('A-')).toBeNull()
    expect(parseSeatLabel('-1')).toBeNull()
    expect(parseSeatLabel('')).toBeNull()
    expect(parseSeatLabel('K-1')).toBeNull()
  })

  it('validates seat labels against the venue layout', () => {
    expect(isValidSeatLabel('A-1')).toBe(true)
    expect(isValidSeatLabel('A-24')).toBe(true)
    expect(isValidSeatLabel('A-25')).toBe(false)
    expect(isValidSeatLabel('B-26')).toBe(true)
    expect(isValidSeatLabel('B-27')).toBe(false)
    expect(isValidSeatLabel('K-1')).toBe(false)
  })

  it('builds seat labels', () => {
    expect(buildSeatLabel('A', 1)).toBe('A-1')
    expect(buildSeatLabel('B', 12)).toBe('B-12')
  })

  it('normalizes seat labels', () => {
    expect(normalizeSeatLabel('a-1')).toBe('A-1')
    expect(normalizeSeatLabel(' B-12 ')).toBe('B-12')
    expect(normalizeSeatLabel('invalid')).toBe('INVALID')
  })
})
