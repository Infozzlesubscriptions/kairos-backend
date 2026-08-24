import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access/roleHelpers'

export const Venue: GlobalConfig = {
  slug: 'venue',
  label: 'Venue',
  admin: {
    group: 'Settings',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'address',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}
