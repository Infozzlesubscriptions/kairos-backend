import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = ({ req }): boolean => {
  return Boolean((req.user as { roles?: string[] } | undefined)?.roles?.includes('admin'))
}

export const isAdminFieldLevel: FieldAccess = ({ req }): boolean => {
  return Boolean((req.user as { roles?: string[] } | undefined)?.roles?.includes('admin'))
}
