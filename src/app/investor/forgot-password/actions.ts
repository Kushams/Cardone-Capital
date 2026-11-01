"use server";
import { requestReset } from "@/lib/invites";
export interface ForgotState { done?: boolean }
export async function forgotAction(_: ForgotState, f: FormData): Promise<ForgotState> {
  await requestReset(String(f.get("email") ?? ""));
  return { done: true }; // identical outcome whether or not the email is on the allowlist
}
