import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/server";
import { getEnvironmentScope } from "@/lib/env-scope.server";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const auth = await getAuth();
  if (!auth.isLoggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const supabase = createAdminSupabase();
    const scope = getEnvironmentScope();

    let dbQuery = supabase
      .from("launches")
      .select("*, tokens!inner(*)")
      .eq("status", "live")
      .eq("app_phase", scope.appPhase);

    if (query) {
      // Filter by token name or symbol
      dbQuery = dbQuery.or(`name.ilike.%${query}%,symbol.ilike.%${query}%`, {
        foreignTable: "tokens",
      });
    }

    const { data: launches, error } = await dbQuery.order("launched_at", {
      ascending: false,
    });

    if (error) throw error;

    return Response.json({ launches: launches || [] });
  } catch (err) {
    console.error("[API] GET /api/launches/explore error:", err);
    return Response.json({ error: "Failed to fetch explore directory" }, { status: 500 });
  }
}
