import 'dotenv/config'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function resetUserPassword(): Promise<void> {
  const args = process.argv.slice(2)
  const email = args.find(arg => arg.startsWith('--email='))?.split('=')[1]
  const password = args.find(arg => arg.startsWith('--password='))?.split('=')[1]

  if (!email || !password) {
    console.error('Usage: tsx scripts/reset-user-password.ts --email=user@example.com --password=newpassword')
    process.exit(1)
  }

  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: email,
      },
    },
    overrideAccess: true,
  })

  if (docs.length === 0) {
    payload.logger.error(`User with email ${email} not found`)
    process.exit(1)
  }

  const user = docs[0]

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { password },
    overrideAccess: true,
  })

  payload.logger.info(`Password reset successfully for ${email}`)
  process.exit(0)
}

resetUserPassword().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
