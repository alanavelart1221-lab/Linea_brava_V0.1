const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// Formateo determinista desde un ISO ingenuo (sin cálculos de zona horaria),
// para que servidor y cliente rendericen idéntico — sin desajuste de hidratación.
function parts(iso: string) {
  const [date, time] = iso.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh = "0", mm = "0"] = (time ?? "").split(":");
  // Constructor UTC solo para derivar el día de la semana de forma determinista.
  const weekday = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { y, m, d, hh: Number(hh), mm: Number(mm), weekday };
}

export function formatEventDate(iso: string) {
  const { m, d, weekday } = parts(iso);
  return { day: String(d).padStart(2, "0"), month: MONTHS[m - 1], weekday };
}

export function formatEventTime(iso: string) {
  const { hh, mm } = parts(iso);
  // Formato 24 h, convencional en México.
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")} h`;
}
