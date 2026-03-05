import { NextRequest, NextResponse } from "next/server";

/**
 * In-memory rate limiter per IP.
 * NOTE: This works for single-instance deployments only.
 * For production with multiple instances/serverless, replace with
 * a distributed store like Redis (e.g. @upstash/ratelimit) or
 * Vercel KV to share state across instances.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  request: NextRequest,
  { limit = 60, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const now = Date.now();
  const key = `${ip}`;
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;
  if (entry.count > limit) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  return null;
}

/** Validate Origin header to prevent CSRF on mutating requests. */
export function validateOrigin(request: NextRequest): NextResponse | null {
  const method = request.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // Allow same-origin requests (origin matches host)
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return null;
    } catch {
      // malformed origin
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // No origin header — likely same-origin fetch or server-side; allow
  return null;
}

/** Validate that a string is a valid UUID v4 */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Validate URL fields (only http/https allowed) */
export function isValidURL(url: string): boolean {
  if (!url) return true; // empty is ok
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** File upload validation constants */
export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize = MAX_FILE_SIZE,
): string | null {
  if (file.size > maxSize) {
    return `File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`;
  }
  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type: ${file.type}`;
  }
  return null;
}
