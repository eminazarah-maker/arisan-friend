// Supabase Edge Function. Set secrets:
// supabase secrets set WHATSAPP_TOKEN=... WHATSAPP_PHONE_NUMBER_ID=...
// Invoke only from trusted staff workflow; never expose provider token in Flutter.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const auth = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = Deno.env.get("WHATSAPP_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const graphVersion = Deno.env.get("WHATSAPP_GRAPH_API_VERSION") ?? "v22.0";
  if (!token || !phoneId) return Response.json({ error: "WhatsApp secrets not configured" }, { status: 500 });

  // Validate caller's JWT and role via Supabase Auth; service key stays server-side.
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: auth ?? "" },
  });
  if (!userRes.ok) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await userRes.json();
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  const profiles = await profileRes.json();
  if (!profiles?.length || !["admin", "treasurer"].includes(profiles[0].role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const phone = String(body.phone ?? "").replace(/[^0-9]/g, "");
  const memberName = String(body.member_name ?? "Anggota");
  const amount = Number(body.amount ?? 0);
  const dueDate = String(body.due_date ?? "");
  if (!phone || !Number.isFinite(amount) || amount <= 0 || !dueDate)
    return Response.json({ error: "phone, amount, due_date required" }, { status: 400 });

  // Production: use an approved WhatsApp message template (e.g. payment_reminder).
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp", to: phone, type: "template",
      template: { name: "payment_reminder", language: { code: "id" },
        components: [{ type: "body", parameters: [
          { type: "text", text: memberName },
          { type: "text", text: `Rp ${amount.toLocaleString("id-ID")}` },
          { type: "text", text: dueDate },
        ] }] },
    }),
  });
  const result = await response.json();
  if (!response.ok) return Response.json({ error: "WhatsApp provider error", detail: result }, { status: 502 });
  return Response.json({ sent: true, provider: result });
});
