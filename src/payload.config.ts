import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Bookings } from './collections/Bookings'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { Venue } from './globals/Venue'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL
const allowedOrigins = [
  serverURL,
  'https://kairos-schoolof-music.vercel.app',
  ...(process.env.FRONTEND_URLS?.split(',') ?? []),
]
  .map((origin) => origin?.trim())
  .filter((origin): origin is string => Boolean(origin))

export default buildConfig({
  serverURL,
  cors: allowedOrigins,
  csrf: allowedOrigins,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Events, Bookings],
  globals: [Venue],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
