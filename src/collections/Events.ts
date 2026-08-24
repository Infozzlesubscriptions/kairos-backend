import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrPublished } from '@/access/roleHelpers'

export const Events: CollectionConfig = {
  slug: 'events',
  access: {
    create: isAdmin,
    read: isAdminOrPublished,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', '_status'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'timeSlots',
      type: 'array',
      required: true,
      minRows: 1,
      labels: {
        singular: 'Time Slot',
        plural: 'Time Slots',
      },
      fields: [
        {
          name: 'startTime',
          type: 'text',
          required: true,
          admin: {
            description: 'e.g. 19:00 or 7:00 PM',
          },
        },
        {
          name: 'endTime',
          type: 'text',
          admin: {
            description: 'e.g. 22:00 or 10:00 PM',
          },
        },
        {
          name: 'label',
          type: 'text',
          admin: {
            description: 'Display label for this slot, e.g. "Doors 7PM / Show 8PM"',
          },
        },
      ],
    },
  ],
}
