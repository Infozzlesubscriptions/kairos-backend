'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDocumentInfo, useField, useForm, useFormFields } from '@payloadcms/ui'

import {
  SEAT_CAPACITY_BY_ROW,
  SEAT_ROWS,
  type SeatRow,
} from '@/lib/seats'

type BookingDoc = {
  id: number | string
  seats?: { seatLabel?: string }[]
}

const ACTIVE_PAYMENT_STATUSES = ['pending', 'paid', 'reserved_by_admin']

function parseSeatLabel(value: unknown): { row: SeatRow | ''; seatNumber: number | '' } {
  if (typeof value !== 'string') return { row: '', seatNumber: '' }
  const trimmed = value.trim()
  const match = trimmed.match(/^([A-Ja-j])-(\d+)$/)
  if (!match) return { row: '', seatNumber: '' }
  return {
    row: match[1].toUpperCase() as SeatRow,
    seatNumber: parseInt(match[2], 10),
  }
}

export const SeatSelector: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue, showError } = useField<string>({ path })
  const { getDataByPath } = useForm()
  const { id: documentId } = useDocumentInfo()

  const isInternalChange = useRef(false)

  const [row, setRow] = useState<SeatRow | ''>('')
  const [seatNumber, setSeatNumber] = useState<number | ''>('')
  const [bookedSeatLabels, setBookedSeatLabels] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const eventId = getDataByPath<number | string | { id: number | string }>('event')
  const eventIdValue =
    typeof eventId === 'object' && eventId !== null ? eventId.id : eventId

  // Sync internal state when the field value changes externally (e.g. initial load).
  // Skip syncing when the change originated from this component's own handlers.
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }
    const parsed = parseSeatLabel(value)
    setRow(parsed.row)
    setSeatNumber(parsed.seatNumber)
  }, [value])

  // Load seats that are already booked for the selected event.
  useEffect(() => {
    if (!eventIdValue) {
      setBookedSeatLabels(new Set())
      return
    }

    setIsLoading(true)

    const params = new URLSearchParams({
      'where[event][equals]': String(eventIdValue),
      'where[paymentStatus][in]': ACTIVE_PAYMENT_STATUSES.join(','),
      limit: '1000',
      depth: '0',
    })

    fetch(`/api/bookings?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const taken = new Set<string>()
        for (const booking of (data.docs ?? []) as BookingDoc[]) {
          // When editing, ignore the current document's own seats so they remain selectable.
          if (documentId !== undefined && String(booking.id) === String(documentId)) {
            continue
          }
          for (const seat of booking.seats ?? []) {
            const label = seat.seatLabel?.trim().toUpperCase()
            if (label) taken.add(label)
          }
        }
        setBookedSeatLabels(taken)
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load booked seats', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [eventIdValue, documentId])

  const siblingLabelsKey = useFormFields<string>(([fields]) => {
    const labels: string[] = []
    for (const [fieldPath, field] of Object.entries(fields)) {
      if (fieldPath === path) continue
      if (/^seats\.\d+\.seatLabel$/.test(fieldPath)) {
        const value = (field as { value?: unknown }).value
        if (typeof value === 'string' && value) {
          labels.push(value.trim().toUpperCase())
        }
      }
    }
    return labels.sort().join(',')
  })

  const unavailableSeatLabels = useMemo(() => {
    const taken = new Set(bookedSeatLabels)
    if (siblingLabelsKey) {
      for (const label of siblingLabelsKey.split(',')) {
        if (label) taken.add(label)
      }
    }
    return taken
  }, [bookedSeatLabels, siblingLabelsKey])

  const availableSeatNumbers = useMemo(() => {
    if (!row) return []
    const capacity = SEAT_CAPACITY_BY_ROW[row] ?? 0
    return Array.from({ length: capacity }, (_, index) => index + 1).filter(
      (number) => !unavailableSeatLabels.has(`${row}-${number}`),
    )
  }, [row, unavailableSeatLabels])

  const handleRowChange = (nextRow: SeatRow | '') => {
    isInternalChange.current = true
    setRow(nextRow)
    setSeatNumber('')
    setValue('')
  }

  const handleSeatNumberChange = (nextSeatNumber: number | '') => {
    isInternalChange.current = true
    setSeatNumber(nextSeatNumber)
    if (row && nextSeatNumber) {
      setValue(`${row}-${nextSeatNumber}`)
    } else {
      setValue('')
    }
  }

  return (
    <div className="field-type seat-selector">
      <div className="field-label" style={{ marginBottom: '0.5rem' }}>
        Seat
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <select
          disabled={!eventIdValue || isLoading}
          onChange={(event) => handleRowChange(event.target.value as SeatRow | '')}
          style={{
            border: `1px solid ${showError ? 'var(--theme-error-500)' : 'var(--theme-elevation-150)'}`,
            borderRadius: 'var(--style-radius-s)',
            padding: '0.5rem',
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-text)',
            minWidth: '8rem',
          }}
          value={row}
        >
          <option value="">Select row</option>
          {SEAT_ROWS.map((seatRow) => (
            <option key={seatRow} value={seatRow}>
              {seatRow}
            </option>
          ))}
        </select>

        <select
          disabled={!row || !eventIdValue || isLoading}
          onChange={(event) => handleSeatNumberChange(event.target.value ? parseInt(event.target.value, 10) : '')}
          style={{
            border: `1px solid ${showError ? 'var(--theme-error-500)' : 'var(--theme-elevation-150)'}`,
            borderRadius: 'var(--style-radius-s)',
            padding: '0.5rem',
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-text)',
            minWidth: '10rem',
          }}
          value={seatNumber}
        >
          <option value="">{row ? 'Select seat' : 'Select row first'}</option>
          {availableSeatNumbers.map((number) => (
            <option key={number} value={number}>
              {number}
            </option>
          ))}
        </select>

        {isLoading && (
          <span style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem' }}>
            Loading availability…
          </span>
        )}
      </div>

      {!eventIdValue && (
        <div style={{ color: 'var(--theme-warning-500)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Select an event to choose a seat.
        </div>
      )}
    </div>
  )
}
