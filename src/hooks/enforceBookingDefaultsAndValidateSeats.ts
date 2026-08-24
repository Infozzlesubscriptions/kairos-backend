import { APIError } from 'payload'
import type { CollectionBeforeChangeHook } from 'payload'

import {
  getSeatCapacity,
  isValidSeatRow,
  normalizeSeatLabel,
  parseSeatLabel,
} from '@/lib/seats'

const ACTIVE_PAYMENT_STATUSES = ['pending', 'paid', 'reserved_by_admin'] as const

type SeatRow = { seatLabel?: string }
type BookingDoc = {
  id: number | string
  event?: number | string | { id?: number | string }
  seats?: SeatRow[]
  paymentStatus?: string
  bookingSource?: string
}

function getSeatLabelSet(seats?: SeatRow[]): Set<string> {
  return new Set(
    (seats ?? [])
      .map((seat) => seat.seatLabel?.trim?.().toUpperCase())
      .filter((label): label is string => Boolean(label)),
  )
}

function normalizeSeats(seats?: SeatRow[]): SeatRow[] {
  if (!Array.isArray(seats)) return []
  return seats.map((seat) => ({
    ...seat,
    seatLabel: seat.seatLabel ? normalizeSeatLabel(seat.seatLabel) : seat.seatLabel,
  }))
}

export const enforceBookingDefaultsAndValidateSeats: CollectionBeforeChangeHook<BookingDoc> = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const userIsAdmin = Boolean(
    (req.user as { roles?: string[] } | undefined)?.roles?.includes('admin'),
  )

  // Public clients cannot set administrative booking or payment state.
  if (!userIsAdmin) {
    data.bookingSource = 'customer'
    data.paymentStatus = 'pending'
  } else {
    data.bookingSource = 'admin'
  }

  const event = data.event ?? originalDoc?.event
  const seats = data.seats ?? originalDoc?.seats

  if (!event || !Array.isArray(seats) || seats.length === 0) {
    return data
  }

  // Normalize seat labels so comparisons and stored values are consistent.
  data.seats = normalizeSeats(data.seats)
  const normalizedSeats = data.seats

  const incomingLabels = getSeatLabelSet(normalizedSeats)

  if (incomingLabels.size !== normalizedSeats.length) {
    throw new APIError('Each seat label must be unique within this booking.', 400)
  }

  // Validate every seat against the venue layout.
  for (const seat of normalizedSeats) {
    const label = seat.seatLabel?.trim()
    if (!label) {
      throw new APIError('Seat label is required.', 400)
    }
    const parsed = parseSeatLabel(label)
    if (!parsed || !isValidSeatRow(parsed.row)) {
      throw new APIError(`Invalid seat label: ${seat.seatLabel}. Expected format like A-1.`, 400)
    }
    const capacity = getSeatCapacity(parsed.row)
    if (capacity === undefined || parsed.seatNumber < 1 || parsed.seatNumber > capacity) {
      throw new APIError(
        `Seat ${seat.seatLabel} is outside the valid range for row ${parsed.row} (1-${capacity}).`,
        400,
      )
    }
  }

  const eventId = typeof event === 'object' ? event.id : event

  // Find existing bookings for the same event that still hold seats.
  // Passing `req` keeps the lookup inside the caller's transaction so concurrent
  // bookings share the same transactional view.
  const { docs: existingBookings } = await req.payload.find({
    collection: 'bookings',
    req,
    depth: 0,
    limit: 1000,
    pagination: false,
    where: {
      and: [
        { event: { equals: eventId } },
        { paymentStatus: { in: ACTIVE_PAYMENT_STATUSES as unknown as string[] } },
        ...(operation === 'update' && originalDoc?.id
          ? [{ id: { not_equals: originalDoc.id } }]
          : []),
      ],
    },
  })

  const takenLabels = new Set<string>()

  for (const booking of existingBookings as BookingDoc[]) {
    const bookedLabels = getSeatLabelSet(booking.seats)
    for (const label of bookedLabels) {
      if (incomingLabels.has(label)) {
        // Preserve the original casing from the stored label for the error message.
        const displayLabel =
          booking.seats?.find(
            (seat) => seat.seatLabel?.trim?.().toUpperCase() === label,
          )?.seatLabel ?? label
        takenLabels.add(displayLabel)
      }
    }
  }

  if (takenLabels.size > 0) {
    const list = Array.from(takenLabels).join(', ')
    throw new APIError(
      `Seat${takenLabels.size > 1 ? 's' : ''} already booked: ${list}`,
      409,
    )
  }

  return data
}
