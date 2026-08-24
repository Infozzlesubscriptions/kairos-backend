import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function makeUserOneAdmin(): Promise<void> {
  const payload = await getPayload({ config: configPromise })

  const existing = await payload.findByID({
    collection: 'users',
    id: 1,
    overrideAccess: true,
  })

  if (!existing) {
    payload.logger.error('User with id 1 not found')
    process.exit(1)
  }

  const currentRoles = new Set(existing.roles ?? [])
  currentRoles.add('admin')

  await payload.update({
    collection: 'users',
    id: 1,
    data: { roles: Array.from(currentRoles) },
    overrideAccess: true,
  })

  payload.logger.info('User 1 is now an admin. Log out and log back in for changes to take effect.')
}

makeUserOneAdmin().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
