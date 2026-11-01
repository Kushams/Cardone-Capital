export const operatorKey = () => process.env.OPERATOR_KEY ?? "operator-dev-key"; // dev fallback only; set OPERATOR_KEY in any shared deployment
export const operatorKeyIsDefault = () => !process.env.OPERATOR_KEY;
