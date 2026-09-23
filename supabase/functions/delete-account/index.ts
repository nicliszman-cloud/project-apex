import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function collectFiles(admin: any, bucket: string, folder: string): Promise<string[]> {
  const files: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    if (!data?.length) break;
    for (const item of data) {
      const path = folder ? `${folder}/${item.name}` : item.name;
      if (item.id) files.push(path);
      else files.push(...await collectFiles(admin, bucket, path));
    }
    if (data.length < 100) break;
    offset += data.length;
  }
  return files;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Sessão inválida." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return new Response(JSON.stringify({ error: "Não foi possível validar a conta." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userId = userData.user.id;
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const files = await collectFiles(admin, "media", userId);
    for (let i = 0; i < files.length; i += 100) {
      const { error: removeError } = await admin.storage.from("media").remove(files.slice(i, i + 100));
      if (removeError) throw removeError;
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("delete-account", error);
    return new Response(JSON.stringify({ error: "Não foi possível excluir a conta agora. Tente novamente." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});