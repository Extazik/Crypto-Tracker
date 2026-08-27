import confetti from "canvas-confetti";
import type { Project } from "./types";
import { STATUS_META, DEADLINE_KINDS } from "./types";

let seq = 0;
export function uid(prefix = "id"): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Московское время и сброс 03:00 МСК ---------- */

export const MSK_OFFSET = 3 * 3600 * 1000;

/** Timestamp ближайшего сброса в 03:00 МСК (UTC+3) */
export function nextResetAt(from = Date.now()): number {
  const wall = new Date(from + MSK_OFFSET);
  const target = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate(), 3, 0, 0);
  let t = target - MSK_OFFSET;
  if (t <= from) t += 24 * 3600 * 1000;
  return t;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function mskClock(d = new Date()): string {
  return d.toLocaleTimeString("ru-RU", { timeZone: "Europe/Moscow", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function mskDate(d = new Date()): string {
  return d.toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow", weekday: "short", day: "numeric", month: "long" });
}

export function formatDateRu(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export function daysUntil(iso: string): number {
  const d = new Date(`${iso}T23:59:59`);
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "только что";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
  return new Date(ts).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}

/* ---------- Проектные метрики ---------- */

export function progressOf(p: Project): number {
  if (p.activities.length === 0) return 0;
  const done = p.activities.filter((a) => a.done).length;
  return Math.round((done / p.activities.length) * 100);
}

export function raisedUsd(p: Project): number {
  return p.investors.reduce((s, i) => s + (i.amountUsd ?? 0), 0);
}

export function nearestDeadline(p: Project) {
  const future = p.deadlines
    .map((d) => ({ ...d, days: daysUntil(d.date) }))
    .filter((d) => d.days >= 0)
    .sort((a, b) => a.days - b.days);
  return future[0] ?? null;
}

export function isHot(p: Project): boolean {
  if (p.status === "completed") return false;
  const nd = nearestDeadline(p);
  return !!nd && nd.days <= 7;
}

export function formatUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e8 ? 0 : 1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

/* ---------- Экспорт ---------- */

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportCsv(projects: Project[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const head = ["Название", "Тикер", "Статус", "Блокчейн", "Категории", "Теги", "Прогресс %", "Приоритет", "Сложность", "Инвесторы", "Привлечено USD", "Ближайший дедлайн", "Сайт"];
  const rows = projects.map((p) => {
    const nd = nearestDeadline(p);
    return [
      p.name,
      p.ticker,
      STATUS_META[p.status].label,
      p.blockchain,
      p.categories.join(", "),
      p.tags.join(", "),
      String(progressOf(p)),
      p.priority,
      p.difficulty,
      p.investors.map((i) => `${i.name} (T${i.tier})`).join("; "),
      String(raisedUsd(p)),
      nd ? `${nd.title} — ${formatDateRu(nd.date)}` : "—",
      p.website ?? "",
    ]
      .map(esc)
      .join(";");
  });
  const csv = "\uFEFF" + [head.map(esc).join(";"), ...rows].join("\r\n");
  downloadBlob(`droptrack-projects-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
}

function icsDate(iso: string): string {
  return iso.replace(/-/g, "");
}

export function exportIcs(projects: Project[]) {
  const events: string[] = [];
  for (const p of projects) {
    for (const d of p.deadlines) {
      const kind = DEADLINE_KINDS.find((k) => k.id === d.kind)?.label ?? "Дедлайн";
      events.push(
        [
          "BEGIN:VEVENT",
          `UID:${p.id}-${d.id}@droptrack`,
          `DTSTART;VALUE=DATE:${icsDate(d.date)}`,
          `SUMMARY:${p.ticker} · ${kind}: ${d.title}`,
          `DESCRIPTION:Проект: ${p.name}${p.claimUrl ? `\\nClaim: ${p.claimUrl}` : ""}`,
          p.website ? `URL:${p.website}` : "",
          "END:VEVENT",
        ]
          .filter(Boolean)
          .join("\r\n")
      );
    }
  }
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DropTrack//RU", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
  downloadBlob(`droptrack-deadlines-${new Date().toISOString().slice(0, 10)}.ics`, ics, "text/calendar;charset=utf-8");
}

/* ---------- Разное ---------- */

export function simpleHash(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h + pw.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(36)}_${pw.length}`;
}

export function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function fireConfetti() {
  const colors = ["#3FB950", "#58A6FF", "#D29922", "#DB6D28", "#A371F7"];
  confetti({ particleCount: 130, spread: 75, origin: { y: 0.7 }, colors, ticks: 240 });
  setTimeout(() => confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors, ticks: 220 }), 180);
  setTimeout(() => confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors, ticks: 220 }), 320);
}

export const AVATAR_GRADIENTS: [string, string][] = [
  ["#238636", "#0e4429"],
  ["#1f6feb", "#0c2d6b"],
  ["#9e6a03", "#4d2d00"],
  ["#a371f7", "#3c1e70"],
  ["#da3633", "#5d1412"],
  ["#1b7c83", "#093c40"],
  ["#db6d28", "#5b2b00"],
  ["#6e7681", "#2d333b"],
];
