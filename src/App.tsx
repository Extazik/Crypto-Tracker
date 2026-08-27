import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Flame, Heart, Info, Landmark, ListChecks, Plus, SearchX, TimerReset } from "lucide-react";
import { StoreProvider, useStore } from "./lib/store";
import type { Project } from "./lib/types";
import { applyFilters, DEFAULT_FILTERS, FiltersPanel } from "./components/Filters";
import type { FilterState } from "./components/Filters";
import { Header, Ticker } from "./components/Header";
import type { Tab } from "./components/Header";
import { ProjectCard } from "./components/ProjectCard";
import { ProjectDetail } from "./components/ProjectDetail";
import { ProjectForm } from "./components/ProjectForm";
import { AuthModal } from "./components/AuthModal";
import { ResetModal } from "./components/ResetModal";
import { Analytics } from "./components/Analytics";
import { CalendarView } from "./components/CalendarView";
import { EmptyState, Reveal } from "./components/ui";
import { exportCsv, formatCountdown, formatUsd, isHot, progressOf, raisedUsd } from "./lib/utils";
import { useEffect } from "react";

/* ---------- Сводная операционная панель ---------- */

function OpsPanel({ onOpenReset }: { onOpenReset: () => void }) {
  const { projects, favorites, nextReset, isAdmin } = useStore();
  const [left, setLeft] = useState(nextReset - Date.now());
  useEffect(() => {
    const iv = setInterval(() => setLeft(nextReset - Date.now()), 1000);
    return () => clearInterval(iv);
  }, [nextReset]);

  const s = useMemo(() => {
    const all = projects.reduce((x, p) => x + p.activities.length, 0);
    const done = projects.reduce((x, p) => x + p.activities.filter((a) => a.done).length, 0);
    const avg = projects.length ? Math.round(projects.reduce((x, p) => x + progressOf(p), 0) / projects.length) : 0;
    const raised = projects.reduce((x, p) => x + raisedUsd(p), 0);
    const hot = projects.filter(isHot).length;
    return { all, done, avg, raised, hot };
  }, [projects]);

  const cells = [
    { icon: <ListChecks size={14} />, label: "Проектов на трекинге", value: String(projects.length), sub: `${s.done}/${s.all} заданий закрыто`, color: "#3FB950" },
    { icon: <TimerReset size={14} />, label: "Средний прогресс", value: `${s.avg}%`, sub: "по всем чек-листам", color: "#58A6FF", bar: s.avg },
    { icon: <Landmark size={14} />, label: "Привлечено фондами", value: formatUsd(s.raised), sub: "открытые раунды портфеля", color: "#D29922" },
    { icon: <Flame size={14} />, label: "Горящие дедлайны", value: String(s.hot), sub: "требуют внимания ≤ 7 дней", color: "#DB6D28" },
  ];

  return (
    <Reveal>
      <section className="panel overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-5">
          {cells.map((c, i) => (
            <div key={c.label} className={`relative border-linesoft p-4 ${i < 4 ? "border-b lg:border-b-0 lg:border-r" : ""} ${i % 2 === 0 ? "border-r lg:border-r" : ""}`}>
              <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-mut">
                <span style={{ color: c.color }}>{c.icon}</span>
                {c.label}
              </div>
              <div className="mt-1.5 font-mono text-[22px] font-extrabold leading-none tabular-nums text-txt">{c.value}</div>
              {c.bar !== undefined ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
                  <motion.div className="h-full rounded-full" style={{ background: c.color }} initial={{ width: 0 }} animate={{ width: `${c.bar}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
                </div>
              ) : (
                <div className="mt-1.5 text-[10px] font-semibold text-mut">{c.sub}</div>
              )}
              {c.bar !== undefined && <div className="mt-1 text-[10px] font-semibold text-mut">{c.sub}</div>}
            </div>
          ))}

          {/* ячейка сброса */}
          <button onClick={onOpenReset} className="group relative col-span-2 flex items-center justify-between gap-3 bg-gradient-to-r from-brand/15 to-transparent p-4 text-left transition-colors hover:from-brand/25 lg:col-span-1">
            <div>
              <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-mut">
                <TimerReset size={14} className="text-brand" /> Сброс 03:00 МСК
              </div>
              <div className="mt-1.5 font-mono text-[22px] font-extrabold leading-none tabular-nums text-brand">{formatCountdown(left)}</div>
              <div className="mt-1.5 text-[10px] font-semibold text-mut">дейли-активности · cron</div>
            </div>
            <span className="pulse-dot h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
          </button>
        </div>
        {isAdmin && (
          <div className="border-t border-line bg-raised/40 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-mut">
            <span className="text-brand">●</span> Режим администратора: управление проектами активно · <Heart size={9} className="inline text-amber" /> {favorites.length} в избранном
          </div>
        )}
      </section>
    </Reveal>
  );
}

/* ---------- Тосты ---------- */

function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="panel pointer-events-auto flex items-start gap-2.5 border-l-2 p-3 shadow-xl shadow-black/40"
            style={{ borderLeftColor: t.kind === "success" ? "#3FB950" : t.kind === "error" ? "#F85149" : "#58A6FF" }}
          >
            <span className="mt-0.5 shrink-0">
              {t.kind === "success" ? <CheckCircle2 size={15} className="text-brand" /> : t.kind === "error" ? <AlertTriangle size={15} className="text-danger" /> : <Info size={15} className="text-sky" />}
            </span>
            <p className="text-xs font-semibold leading-snug text-txt">{t.msg}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Страница трекера ---------- */

function TrackerPage({ onOpenReset }: { onOpenReset: () => void }) {
  const { projects, isAdmin } = useStore();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; project?: Project }>({ open: false });

  const filtered = useMemo(() => applyFilters(projects, filters), [projects, filters]);
  const detail = detailId ? projects.find((p) => p.id === detailId) ?? null : null;

  return (
    <div className="space-y-4">
      <OpsPanel onOpenReset={onOpenReset} />

      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-txt sm:text-2xl">
            Радар аирдропов
          </h1>
          <p className="mt-1 text-xs font-semibold text-mut sm:text-sm">
            Отслеживай ретродропы, закрывай дейлики и не пропускай клеймы — всё в одной панели.
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary shrink-0" onClick={() => setForm({ open: true })}>
            <Plus size={16} /> <span className="hidden sm:inline">Новый проект</span>
          </button>
        )}
      </div>

      <FiltersPanel filters={filters} onChange={setFilters} onExportCsv={() => exportCsv(filtered)} total={projects.length} shown={filtered.length} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p, i) => (
          <ProjectCard
            key={p.id}
            project={p}
            index={i}
            onOpen={() => setDetailId(p.id)}
            onEdit={() => setForm({ open: true, project: p })}
          />
        ))}
        {filtered.length === 0 && (
          <EmptyState
            icon={<SearchX size={28} />}
            title="Ничего не найдено"
            text="Попробуйте изменить поисковый запрос или сбросить активные фильтры — радар чист."
            action={
              <button className="btn-ghost mt-1" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Сбросить фильтры
              </button>
            }
          />
        )}
      </div>

      {detail && <ProjectDetail project={detail} onClose={() => setDetailId(null)} onEdit={() => { setForm({ open: true, project: detail }); setDetailId(null); }} />}
      {form.open && <ProjectForm initial={form.project} onClose={() => setForm({ open: false })} />}
    </div>
  );
}

/* ---------- Корневой компонент ---------- */

function Shell() {
  const [tab, setTab] = useState<Tab>("tracker");
  const [authMode, setAuthMode] = useState<"login" | "profile" | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const { isAdmin } = useStore();

  return (
    <div className="relative min-h-screen">
      <div className="bg-fx" />
      <div className="bg-grid" />

      <div className="relative z-10">
        <Header
          tab={tab}
          setTab={setTab}
          onOpenAuth={() => setAuthMode("login")}
          onOpenProfile={() => setAuthMode("profile")}
          onOpenReset={() => setResetOpen(true)}
        />
        {tab === "tracker" && <Ticker />}

        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
          {tab === "tracker" && <TrackerPage onOpenReset={() => setResetOpen(true)} />}
          {tab === "analytics" && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="mb-4">
                <h1 className="font-display text-xl font-extrabold tracking-tight text-txt sm:text-2xl">Аналитика портфеля</h1>
                <p className="mt-1 text-xs font-semibold text-mut sm:text-sm">Статусы, блокчейны, категории и венчурные фонды — срез по всем проектам радара.</p>
              </div>
              <Analytics />
            </motion.div>
          )}
          {tab === "calendar" && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="mb-4">
                <h1 className="font-display text-xl font-extrabold tracking-tight text-txt sm:text-2xl">Календарь дедлайнов</h1>
                <p className="mt-1 text-xs font-semibold text-mut sm:text-sm">Регистрации, снапшоты и клеймы по месяцам. Экспортируйте в Google Calendar или Apple Calendar.</p>
              </div>
              <CalendarView />
            </motion.div>
          )}
        </main>

        <footer className="border-t border-line bg-panel/60">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 font-mono text-[11px] font-semibold text-mut sm:flex-row sm:px-6">
            <span>
              <span className="text-brand">▲</span> DROPTRACK · airdrop & crypto tracker
            </span>
            <span>данные — локальная JSON-база · автосброс 03:00 МСК · {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>

      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />}
      {resetOpen && <ResetModal onClose={() => setResetOpen(false)} />}
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
