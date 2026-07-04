/** Formatage FCFA (XOF), sans décimale — devise du projet. */
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "Gratuit" si 0, sinon montant FCFA. */
export function formatPrice(amount: number, isFree?: boolean): string {
  if (isFree || amount === 0) return "Gratuit";
  return formatFCFA(amount);
}

/** Durée en minutes → "12h30" / "45min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** Date ISO → "15 juin 2026". */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
