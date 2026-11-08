import { must, supabase } from "./supabase";
import { decryptSecret } from "./crypto";

export interface BankAccountView {
  id: number;
  entityId: number;
  entityName: string;
  nickname: string;
  bankName: string;
  accountType: string;
  routingLast4: string;
  accountLast4: string;
}

function last4(blob: string | null): string {
  if (!blob) return "••••";
  try {
    const plain = decryptSecret(blob);
    return plain.slice(-4);
  } catch {
    return "••••";
  }
}

function toView(r: any): BankAccountView {
  return {
    id: r.id, entityId: r.entity_id, entityName: r.investing_entities?.name ?? "",
    nickname: r.nickname ?? "", bankName: r.bank_name ?? "", accountType: r.account_type ?? "",
    routingLast4: last4(r.routing_encrypted), accountLast4: last4(r.account_encrypted),
  };
}

/** All bank accounts across the client's entities — masked; full numbers never leave the server. */
export async function listBankAccounts(clientId: number): Promise<BankAccountView[]> {
  const rows = must(await supabase().from("bank_accounts")
    .select("id, entity_id, nickname, bank_name, account_type, routing_encrypted, account_encrypted, investing_entities!inner ( name, client_id )")
    .eq("investing_entities.client_id", clientId).order("id")) as any[];
  return rows.map(toView);
}

export async function bankAccountsForEntity(entityId: number): Promise<BankAccountView[]> {
  const rows = must(await supabase().from("bank_accounts")
    .select("id, entity_id, nickname, bank_name, account_type, routing_encrypted, account_encrypted, investing_entities!inner ( name )")
    .eq("entity_id", entityId).order("id")) as any[];
  return rows.map(toView);
}

/** US ABA routing-number checksum (weights 3-7-1 repeating). */
export function abaValid(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false;
  const d = routing.split("").map(Number);
  const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
  return sum % 10 === 0;
}
