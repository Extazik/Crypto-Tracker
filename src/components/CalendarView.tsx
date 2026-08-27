import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react";
import { useStore } from "../lib/store";
import { DEADLINE_KINDS } from "../lib/types";
import type { DeadlineKind, Project } from "../lib/types";
import { cx, exportIcs, formatDateRu } from "../lib/utils";
import { Reveal } from "./ui";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarView() {
  const { projects } = useStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const events = useMemo(() => {
    const map = new Map<string, { project: Project; date: string; kind: DeadlineKind; title: string }[]>();
    for (const p of projects) {
      for (const d of p.deadlines) {
        const list = map.get(d.date) ?? [];
        list.push({ project: p, date: d.date, kind: d.kind, title: d.title });
        map.set(d.date, list);
      }
    }
    return map;
  }, [projects]);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Пн = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (string | null)[] = [];
    for (let i = 0; i < offset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(iso(year, month, d));
    return arr;
  }, [year, month]);

  const monthEventsCount = useMemo(() => {
    let n = 0;
    events.forEach((list, date) => {
      const d = new Date(`${date}T00:00:00`);
      if (d.getFullYear() === year && d.getMonth() === month) n += list.length;
    });
    return n;
  }, [events, year, month]);

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelected(null);
  };

  const exportMonth = () => {
    const filtered = projects
      .map((p) => ({
        ...p,
        deadlines: p.deadlines.filter((d) => {
          const dt = new Date(`${d.date}T00:00:00`);
          return dt.getFullYear() === year && dt.getMonth() === month;
        }),
      }))
      .filter((p) => p.deadlines.length > 0);
    exportIcs(filtered);
  };

  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedEvents = selected ? events.get(selected) ?? [] : [];
  const monthLabel = new Date(year, month, 1).toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  return (
    <Reveal>
      <div className="panel overflow-hidden">
        <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <h2 className="flex items-center gap-2 font-display text-base font-bold capitalize text-txt">
            <CalendarDays size={17} className="text-flame" /> {monthLabel}
          </h2>
          <span className="chip text-mut">{monthEventsCount} событий</span>
          <div className="ml-auto flex items-center gap-2">
            <button className="icon-btn" onClick={() => shift(-1)} aria-label="Предыдущий месяц"><ChevronLeft size={16} /></button>
            <button className="btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(null); }}>
              Сегодня
            </button>
            <button className="icon-btn" onClick={() => shift(1)} aria-label="Следующий месяц"><ChevronRight size={16} /></button>
            <button className="btn-primary !px-3 !py-1.5 !text-xs" onClick={exportMonth} title="Скачать события месяца в формате .ics">
              <Download size={13} /> .ics
            </button>
          </div>
        </header>

        {/* легенда */}
        <div className="flex flex-wrap items-center gap-3 border-b border-linesoft bg-raised/40 px-4 py-2 sm:px-5">
          {DEADLINE_KINDS.map((k) => (
            <span key={k.id} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-mut">
              <span className="h-2 w-2 rounded-full" style={{ background: k.color }} /> {k.label}
            </span>
          ))}
          <span className="ml-auto text-[10px] font-semibold text-mut">Клик по дню — детали</span>
        </div>

        <div className="grid grid-cols-7 border-b border-linesoft">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={cx("px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-wider", i >= 5 ? "text-flame/70" : "text-mut")}>
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) return <div key={`e-${i}`} className="min-h-[76px] border-b border-r border-linesoft bg-raised/20 sm:min-h-[92px]" />;
            const list = events.get(date) ?? [];
            const isToday = date === todayIso;
            const isSel = date === selected;
            const dayNum = Number(date.slice(8));
            return (
              <motion.button
                key={date}
                onClick={() => setSelected(isSel ? null : date)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={cx(
                  "relative flex min-h-[76px] flex-col items-start gap-1 border-b border-r border-linesoft p-1.5 text-left transition-colors sm:min-h-[92px] sm:p-2",
                  isSel ? "bg-brand/10" : "hover:bg-raised/60"
                )}
              >
                <span
                  className={cx(
                    "flex h-6 w-6 items-center justify-center rounded-lg font-mono text-xs font-bold",
                    isToday ? "bg-brand text-ink" : "text-mut"
                  )}
                >
                  {dayNum}
                </span>
                <div className="flex flex-wrap gap-1">
                  {list.slice(0, 3).map((e, j) => (
                    <span key={j} className="h-1.5 w-1.5 rounded-full" style={{ background: DEADLINE_KINDS.find((k) => k.id === e.kind)?.color }} />
                  ))}
                  {list.length > 3 && <span className="font-mono text-[9px] font-bold text-mut">+{list.length - 3}</span>}
                </div>
                <div className="hidden w-full space-y-0.5 sm:block">
                  {list.slice(0, 2).map((e, j) => (
                    <div key={j} className="truncate rounded px-1 py-0.5 text-[9px] font-bold" style={{ color: DEADLINE_KINDS.find((k) => k.id === e.kind)?.color, background: `${DEADLINE_KINDS.find((k) => k.id === e.kind)?.color}18` }}>
                      ${e.project.ticker}
                    </div>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* детали выбранного дня */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-line bg-raised/40"
            >
              <div className="px-4 py-4 sm:px-5">
                <h4 className="mb-2.5 font-display text-xs font-bold uppercase tracking-wider text-txt">
                  {formatDateRu(selected)} · {selectedEvents.length} событ.
                </h4>
                {selectedEvents.length === 0 ? (
                  <p className="text-xs text-mut">На эту дату дедлайнов нет — можно выдохнуть.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedEvents.map((e, i) => {
                      const kind = DEADLINE_KINDS.find((k) => k.id === e.kind)!;
                      return (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2.5">
                          <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: kind.color }} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-bold text-txt">{e.title}</div>
                            <div className="text-[10px] font-semibold text-mut">
                              <span className="font-mono font-bold" style={{ color: kind.color }}>${e.project.ticker}</span> · {e.project.name} · {kind.label}
                            </div>
                          </div>
                          {e.project.website && (
                            <a href={e.project.website} target="_blank" rel="noreferrer" className="icon-btn !h-7 !w-7" title="Сайт проекта">
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}
