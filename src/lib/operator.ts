/** The operator recovery passphrase comes ONLY from the OPERATOR_KEY secret.
 * Fail closed (audit follow-up item 4): when the secret is missing, or is
 * still set to the old public dev value, there is NO passphrase — the console
 * refuses to run and says so, instead of silently accepting a known default. */
const PUBLIC_DEV_KEY = "operator-dev-key";

export const operatorKey = (): string | null => {
  const k = process.env.OPERATOR_KEY;
  return k && k !== PUBLIC_DEV_KEY ? k : null;
};

/** True when the console is misconfigured and must refuse to run. */
export const operatorKeyIsDefault = () => operatorKey() === null;
