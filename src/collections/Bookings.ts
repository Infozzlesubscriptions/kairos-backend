import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/roleHelpers'
import { enforceBookingDefaultsAndValidateSeats } from '@/hooks/enforceBookingDefaultsAndValidateSeats'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['event', 'seats', 'fullName', 'email', 'phone', 'paymentStatus'],
    listSearchableFields: ['fullName', 'email', 'phone'],
  },
  access: {
    // Public users can create a booking but cannot read/update/delete anything.
    create: () => true,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [enforceBookingDefaultsAndValidateSeats],
  },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'seats',
      type: 'array',
      required: true,
      minRows: 1,
      labels: {
        singular: 'Seat',
        plural: 'Seats',
      },
      fields: [
        {
          name: 'seatLabel',
          type: 'text',
          required: true,
          admin: {
            components: {
              Field: '@/components/SeatSelector#SeatSelector',
            },
          },
        },
      ],
    },
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Refunded', value: 'refunded' },
        { label: 'Failed', value: 'failed' },
        { label: 'Reserved by Admin', value: 'reserved_by_admin' },
      ],
    },
    {
      name: 'bookingSource',
      type: 'select',
      defaultValue: 'admin',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Admin', value: 'admin' },
      ],
    },
  ],
}
