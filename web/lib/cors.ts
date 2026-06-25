import { DEV_SITE_URL } from "@/lib/config";
import { NextRequest } from "next/server";

function parseAllowedOrigins(): string[] {
  const raw = process.env.LF_CORS_ORIGIN?.trim();
  if (!raw || raw === "*") return [];

  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Resolve o header Access-Control-Allow-Origin.
 * Dev: site estático fixo em http://localhost:3000
 * Produção: LF_CORS_ORIGIN (URL única ou lista separada por vírgula)
 */
export function resolveCorsOrigin(request: NextRequest): string {
  const requestOrigin = request.headers.get("origin");
  const configured = parseAllowedOrigins();

  if (process.env.NODE_ENV === "development") {
    const devAllowed = configured.length > 0 ? configured : [DEV_SITE_URL];
    if (requestOrigin && devAllowed.includes(requestOrigin)) {
      return requestOrigin;
    }
    return devAllowed[0];
  }

  if (configured.length === 0) {
    return "*";
  }

  if (requestOrigin && configured.includes(requestOrigin)) {
    return requestOrigin;
  }

  return configured[0];
}

export function corsHeaders(request: NextRequest) {
  return {
    "Access-Control-Allow-Origin": resolveCorsOrigin(request),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
