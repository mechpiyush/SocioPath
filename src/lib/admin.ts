export function isAdmin(session: any): boolean {
  if (!session) return false;
  if (session.role === 'ADMIN') return true;
  if (session.email === 'iiit.piyush@gmail.com') return true;
  if (process.env.ADMIN_EMAIL && session.email === process.env.ADMIN_EMAIL) return true;
  return false;
}
