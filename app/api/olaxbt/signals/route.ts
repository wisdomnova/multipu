import { fetchOlaXbtSignals } from "@/lib/olaxbt/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "GPU";

  const signal = await fetchOlaXbtSignals(symbol);

  return Response.json({
    success: true,
    protocol: "OlaXBT Nexus MCP",
    signal,
  });
}
