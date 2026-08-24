import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = ({ req }): boolean => {
  return Boolean((req.user as { roles?: string[] } | undefined)?.roles?.includes('admin'))
}

export const isAdminFieldLevel: FieldAccess = ({ req }): boolean => {
  return Boolean((req.user as { roles?: string[] } | undefined)?.roles?.includes('admin'))
}

export const isAdminOrPublished: Access = ({ req }) => {
  if ((req.user as { roles?: string[] } | undefined)?.roles?.includes('admin')) return true

  return {
    _status: {
      equals: 'published',
    },
  }
}
