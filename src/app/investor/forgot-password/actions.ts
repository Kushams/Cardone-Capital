"use server";
import { requestReset } from "@/lib/invites";
import { checkLock, recordFailure } from "@/lib/ratelimit";
export interface ForgotState { done?: boolean }
export async function forgotAction(_: ForgotState, f: FormData): Promise<ForgotState> {
  const email = String(f.get("email") ?? "");
  // Throttle reset emails per address (audit follow-up item 5): the same
  // 5-per-15-minutes limiter as login, keyed separately (`reset:<email>`) so
  // reset abuse can neither mail-bomb an investor nor lock their sign-in.
  // The response stays identical whether or not a reset was actually sent.
  const rlKey = `reset:${email.trim().toLowerCase()}`;
  const lock = await checkLock(rlKey);
  if (!lock.locked) {
    await recordFailure(rlKey);
    await requestReset(email);
  }
  return { done: true }; // identical outcome whether or not the email is on the allowlist
}
