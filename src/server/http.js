import { NextResponse } from "next/server";
import { HttpError } from "./auth";

export function ok(data, init) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created(data) {
  return NextResponse.json(data, { status: 201 });
}

export function fail(status, error, extra) {
  return NextResponse.json({ error, ...(extra || {}) }, { status });
}

/** Wrap a handler with consistent error handling — never leak stack traces. */
export function handler(fn) {
  return async (request, ctx) => {
    try {
      return await fn(request, ctx);
    } catch (err) {
      if (err instanceof HttpError) return fail(err.status, err.message);
      if (err?.name === "ZodError") {
        const issues = (err.issues || []).map((i) => ({
          path: i.path?.join("."),
          message: i.message,
        }));
        return fail(422, "Validation failed", { issues });
      }
      // Duplicate key on a unique index (MongoDB)
      if (err?.code === 11000 || err?.code === 11001) {
        return fail(409, "Duplicate value");
      }
      // Mongoose document validation
      if (err?.name === "ValidationError") {
        const issues = Object.values(err.errors || {}).map((e) => ({
          path: e.path,
          message: e.message,
        }));
        return fail(422, "Validation failed", { issues });
      }
      if (err?.name === "CastError") return fail(422, "Invalid identifier");
      // Server unreachable / not yet connected
      if (
        err?.name === "MongooseServerSelectionError" ||
        err?.name === "MongoNetworkError"
      ) {
        return fail(503, "Database is unavailable. Is MongoDB running?");
      }
      console.error("[api]", err?.message || err);
      return fail(500, "Internal server error");
    }
  };
}

export async function body(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function query(request) {
  const url = new URL(request.url);
  const out = {};
  url.searchParams.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

export function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function bool(value, fallback = false) {
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return fallback;
}
