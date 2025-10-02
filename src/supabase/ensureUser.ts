import type { SupabaseAdminClient } from "./client";
import type { FirebaseIdTokenPayload } from "../core/types";

export async function ensureSupabaseUser(admin: SupabaseAdminClient, claims: FirebaseIdTokenPayload) {
  const uid = (claims.sub as string | undefined) ?? (claims.user_id as string | undefined);
  const phone = claims.phone_number as string | undefined;
  const email = claims.email as string | undefined;

  if (!uid) throw new Error('Missing subject in token');

  let user: any = null;

  if (phone) {
    const { data } = await (admin as any).auth.admin.listUsers();
    user = data.users.find((u: any) => u.phone === phone) ?? null;
  }

  if (!user && email) {
    const { data } = await (admin as any).auth.admin.listUsers({ page: 1, perPage: 200 });
    user = data.users.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase()) ?? null;
  }

  if (!user) {
    const { data, error } = await (admin as any).auth.admin.createUser({
      email: email || undefined,
      phone: phone || undefined,
      email_confirm: !!email,
      phone_confirm: !!phone,
      user_metadata: { firebase_uid: uid, provider: 'firebase-phone' },
      app_metadata: { roles: ['authenticated'] },
    });
    if (error) throw new Error('Failed to create user');
    user = data.user;
  } else {
    const { data, error } = await (admin as any).auth.admin.updateUserById(user.id, {
      user_metadata: { ...(user.user_metadata || {}), firebase_uid: uid, provider: 'firebase-phone' },
      app_metadata: {
        ...(user.app_metadata || {}),
        roles: Array.from(new Set([...(user.app_metadata?.roles || []), 'authenticated'])),
      },
    });
    if (error) throw new Error('Failed to update user');
    user = data.user;
  }

  return user;
}
