export function normalizeNin(input: string) {
  return input.replace(/\D/g, "").slice(0, 11);
}

export function normalizeVNin(input: string) {
  // Remove spaces and convert to uppercase
  return input.replace(/\s/g, "").toUpperCase().slice(0, 16);
}

export function maskNin(nin: string) {
  const clean = normalizeNin(nin);
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 6)}${clean.slice(-2)}`;
}

export function maskVNin(vnin: string) {
  const clean = normalizeVNin(vnin);
  if (clean.length < 8) return clean;
  // Mask middle characters: YV1234****1234FY
  return `${clean.slice(0, 6)}${"*".repeat(Math.max(0, clean.length - 10))}${clean.slice(-4)}`;
}

export function isValidNin(nin: string) {
  return /^\d{11}$/.test(normalizeNin(nin));
}

export function isValidVNin(vnin: string) {
  // vNIN format: YV followed by 14 alphanumeric characters (total 16 chars)
  const clean = normalizeVNin(vnin);
  return /^YV[A-Z0-9]{14}$/i.test(clean);
}

export function isValidNinOrVNin(input: string) {
  const clean = input.replace(/\s/g, "");
  return isValidNin(clean) || isValidVNin(clean);
}

export function getInputType(input: string): "nin" | "vnin" | "invalid" {
  const clean = input.replace(/\s/g, "");
  if (isValidVNin(clean)) return "vnin";
  if (isValidNin(clean)) return "nin";
  return "invalid";
}
