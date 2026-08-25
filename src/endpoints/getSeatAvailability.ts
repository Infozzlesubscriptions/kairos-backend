import type { Endpoint } from 'payload'
import { APIError, headersWithCors } from 'payload'

import { normalizeSeatLabel } from '@/lib/seats'

const ACTIVE_PAYMENT_STATUSES = ['pending', 'paid', 'reserved_by_admin']

export const getSeatAvailability: Endpoint = {
  path: '/seat-availability',
  method: 'get',
  handler: async (req) => {
    const eventParam = req.url ? new URL(req.url).searchParams.get('event') : null
    const event = Number(eventParam)

    if (!eventParam || !Number.isSafeInteger(event) || event < 1) {
      throw new APIError('A valid event ID is required.', 400)
    }

    // Booking reads remain private; this endpoint exposes only occupied seat labels.
    const { docs } = await req.payload.find({
      collection: 'bookings',
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: true,
      select: {
        seats: true,
      },
      where: {
        and: [
          { event: { equals: event } },
          { paymentStatus: { in: ACTIVE_PAYMENT_STATUSES } },
        ],
      },
    })

    const bookedSeats = Array.from(
      new Set(
        docs.flatMap((booking) =>
          (booking.seats ?? []).map((seat) => normalizeSeatLabel(seat.seatLabel)),
        ),
      ),
    ).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))

    const headers = headersWithCors({ headers: new Headers(), req })
    headers.set('Cache-Control', 'no-store')

    return Response.json(
      {
        event,
        bookedSeats,
      },
      { headers },
    )
  },
}
