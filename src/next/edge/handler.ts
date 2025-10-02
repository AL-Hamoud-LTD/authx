import { verifyFirebaseIdToken } from "../../core/verify";
import { makeAdminClient } from "../../supabase/client";
import { ensureSupabaseUser } from "../../supabase/ensureUser";

export interface VerifyRouteOptions {
  projectId: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

function json(status: number, data: unknown) {
  return new (globalThis as any).Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

export function buildVerifyRouteHandler(options: VerifyRouteOptions) {
  const { projectId, supabaseUrl, supabaseServiceRoleKey } = options;
  const admin = makeAdminClient({ url: supabaseUrl, serviceRoleKey: supabaseServiceRoleKey });

  return async function handler(req: any) {
    try {
      const contentType = req?.headers?.get?.("content-type") || "";
      if (!contentType.includes("application/json")) {
        return json(415, { ok: false, error: "Unsupported content type" });
      }

      const body = await req.json().catch(() => null) as { idToken?: string } | null;
      if (!body || typeof body.idToken !== "string" || body.idToken.length < 100) {
        return json(400, { ok: false, error: "Invalid payload" });
      }

      // 1) Verify Firebase ID token
      let payload: any;
      try {
        payload = await verifyFirebaseIdToken(body.idToken, projectId);
      } catch {
        return json(401, { ok: false, error: "Invalid or expired Firebase ID token" });
      }

      // 2) Ensure Supabase user with authenticated role
      const user = await ensureSupabaseUser(admin as any, payload);

      const uid = (payload.sub as string | undefined) ?? (payload.user_id as string | undefined);
      const phoneNumber = payload.phone_number as string | undefined;
      const email = payload.email as string | undefined;

      return json(200, {
        ok: true,
        uid: uid ?? null,
        phoneNumber: phoneNumber ?? null,
        email: email ?? null,
        supabaseUserId: user?.id ?? null,
        note: "Verified Firebase token and ensured Supabase user exists.",
      });
    } catch (err) {
      return json(500, { ok: false, error: "Internal error" });
    }
  };
}
