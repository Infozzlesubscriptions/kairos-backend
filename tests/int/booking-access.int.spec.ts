import { describe, expect, it, vi } from 'vitest'

import { isAdminOrPublished } from '@/access/roleHelpers'
import { getSeatAvailability } from '@/endpoints/getSeatAvailability'
import { enforceBookingDefaultsAndValidateSeats } from '@/hooks/enforceBookingDefaultsAndValidateSeats'

describe('public booking access', () => {
  it('restricts public event reads to published events', async () => {
    const result = await isAdminOrPublished({ req: { user: null } } as never)

    expect(result).toEqual({ _status: { equals: 'published' } })
  })

  it('allows admins to read all events', async () => {
    const result = await isAdminOrPublished({
      req: { user: { roles: ['admin'] } },
    } as never)

    expect(result).toBe(true)
  })

  it('forces public bookings to customer source and pending payment', async () => {
    const result = await enforceBookingDefaultsAndValidateSeats({
      data: {
        bookingSource: 'admin',
        paymentStatus: 'paid',
      },
      operation: 'create',
      req: { user: null },
    } as never)

    expect(result).toMatchObject({
      bookingSource: 'customer',
      paymentStatus: 'pending',
    })
  })

  it('returns only occupied seat labels for an event', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [
        { seats: [{ seatLabel: 'b-10' }, { seatLabel: 'A-2' }] },
        { seats: [{ seatLabel: 'A-2' }, { seatLabel: 'A-1' }] },
      ],
    })
    const response = await getSeatAvailability.handler({
      headers: new Headers({ Origin: 'https://kairos-schoolof-music.vercel.app' }),
      payload: {
        config: { cors: ['https://kairos-schoolof-music.vercel.app'] },
        find,
      },
      url: 'https://api.example.com/api/seat-availability?event=7',
    } as never)

    expect(await response.json()).toEqual({
      event: 7,
      bookedSeats: ['A-1', 'A-2', 'B-10'],
    })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'bookings',
        overrideAccess: true,
        where: {
          and: [
            { event: { equals: 7 } },
            {
              paymentStatus: {
                in: ['pending', 'paid', 'reserved_by_admin'],
              },
            },
          ],
        },
      }),
    )
  })

  it('requires a valid event ID for availability', async () => {
    await expect(
      getSeatAvailability.handler({
        url: 'https://api.example.com/api/seat-availability?event=invalid',
      } as never),
    ).rejects.toThrow('A valid event ID is required.')
  })
})
