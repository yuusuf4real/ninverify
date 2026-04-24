export function normalizeNin(input: string) {
  return input.replace(/\D/g, "").slice(0, 11);
}

export function maskNin(nin: string) {
  const clean = normalizeNin(nin);
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 6)}${clean.slice(-2)}`;
}

export function isValidNin(nin: string) {
  return /^\d{11}$/.test(normalizeNin(nin));
}
