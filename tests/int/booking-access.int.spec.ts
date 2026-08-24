import { describe, expect, it } from 'vitest'

import { isAdminOrPublished } from '@/access/roleHelpers'
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
})
