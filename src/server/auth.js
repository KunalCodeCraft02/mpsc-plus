import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDb, User, ser } from "@/db";

const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET server configuration is required");
  return secret;
}

export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), 10);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(String(plain), hash);
}

export function signToken(payload) {
  return jwt.sign(payload, jwtSecret(), { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret());
  } catch {
    return null;
  }
}

/** Never leak the password hash to clients. */
export function publicUser(row) {
  if (!row) return null;
  const { passwordHash: _passwordHash, ...safe } = ser(row);
  return safe;
}

function bearer(request) {
  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return null;
}

/** Resolve the authenticated user from the request (DB verified). */
export async function currentUser(request) {
  const token = bearer(request);
  if (!token) return null;
  const claims = verifyToken(token);
  if (!claims?.sub) return null;
  await connectDb();
  const row = await User.findById(Number(claims.sub)).lean();
  if (!row || row.status !== "ACTIVE") return null;
  return ser(row);
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function requireAuth(request) {
  const user = await currentUser(request);
  if (!user) throw new HttpError(401, "Authentication required");
  return user;
}

/** Role guard — the role is always re-read from the database, never trusted from the client. */
export async function requireRole(request, roles = ["ADMIN"]) {
  const user = await requireAuth(request);
  if (!roles.includes(user.role)) throw new HttpError(403, "Insufficient permissions");
  return user;
}

export const requireAdmin = (request) => requireRole(request, ["ADMIN"]);
