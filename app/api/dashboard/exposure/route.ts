import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const supabase = createAdminSupabase();
    const { data: rows, error } = await supabase
      .from("exposure_timeline")
      .select("id, value, label, recorded_at")
      .order("recorded_at", { ascending: true });

    if (error) {
      console.error("[API] GET /dashboard/exposure error:", error);
      return Response.json({ error: "Database error" }, { status: 500 });
    }

    const points = ((rows as any[]) ?? []).map((r) => ({
      date: r.label,
      value: Number(r.value),
      recordedAt: r.recorded_at,
    }));

    return Response.json({
      total: 9284,
      formattedTotal: "9,284",
      changePct: 21.6,
      changeFormatted: "↑ 21.6%",
      period: "last month",
      points,
    });
  } catch (err) {
    console.error("[API] GET /dashboard/exposure error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
