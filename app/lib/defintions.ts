import type { JWTPayload } from "jose";

export interface SessionPayload extends JWTPayload {
  id: string;
  expiresAt: Date;
}
