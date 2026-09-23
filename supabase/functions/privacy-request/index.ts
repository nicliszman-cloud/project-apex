import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const requestType = String(body?.request_type ?? "privacy_question");
    const message = String(body?.message ?? "").trim();
    const website = String(body?.website ?? "").trim();
    if (website) return Response.json({ ok: true }, { headers: cors });

    const allowed = new Set(["privacy_question", "data_request", "account_deletion_help", "other"]);
    if (!/^\S+@\S+\.\S+$/.test(email) || !allowed.has(requestType) || message.length < 3 || message.length > 4000) {
      return Response.json({ error: "Dados inválidos." }, { status: 400, headers: cors });
    }

    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, secretKey!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.from("privacy_requests").insert({ email, request_type: requestType, message });
    if (error) throw error;
    return Response.json({ ok: true }, { headers: cors });
  } catch (error) {
    console.error("privacy-request", error);
    return Response.json({ error: "Não foi possível enviar a solicitação agora." }, { status: 500, headers: cors });
  }
});