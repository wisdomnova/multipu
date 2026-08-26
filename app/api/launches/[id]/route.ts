import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/server";
import { getEnvironmentScope } from "@/lib/env-scope.server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const auth = await getAuth();
  if (!auth.isLoggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabase();
    const scope = getEnvironmentScope();

    const { data: launch, error } = await supabase
      .from("launches")
      .select("*, tokens(*)")
      .eq("id", id)
      .eq("app_phase", scope.appPhase)
      .single();

    if (error || !launch) {
      return Response.json({ error: "Launch not found" }, { status: 404 });
    }

    return Response.json({ launch });
  } catch (err) {
    console.error("[API] GET /api/launches/[id] error:", err);
    return Response.json({ error: "Failed to fetch launch details" }, { status: 500 });
  }
}
