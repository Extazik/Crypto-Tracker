import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, Flame, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { Project, ProjectStatus, RewardType } from "../lib/types";
import { BLOCKCHAINS, CATEGORIES, REWARD_LIST, STATUS_LIST } from "../lib/types";
import { cx, progressOf } from "../lib/utils";

export type SortKey = "priority" | "date" | "status" | "progress" | "difficulty" | "alpha";

export interface FilterState {
  q: string;
  statuses: ProjectStatus[];
  rewards: RewardType[];
  blockchain: string;
  tier: string;
  category: string;
  progress: string;
  hotOnly: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: FilterState = {
  q: "",
  statuses: [],
  rewards: [],
  blockchain: "",
  tier: "",
  category: "",
  progress: "",
  hotOnly: false,
  sort: "status",
};

const STATUS_ORDER: Record<ProjectStatus, number> = { claiming: 0, registration: 1, confirmed: 2, potential: 3, completed: 4 };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 } as const;

function inBucket(p: number, bucket: string): boolean {
  switch (bucket) {
    case "0-25": return p > 0 && p < 25;
    case "25-50": return p >= 25 && p < 50;
    case "50-75": return p >= 50 && p < 75;
    case "75-100": return p >= 75 && p < 100;
    case "100": return p === 100;
    case "0": return p === 0;
    default: return true;
  }
}

export function applyFilters(projects: Project[], f: FilterState): Project[] {
  const q = f.q.trim().toLowerCase().replace(/^\$/, "");
  let list = projects.filter((p) => {
    if (q) {
      const hay = `${p.name} ${p.ticker} ${p.description} ${p.tags.join(" ")} ${p.blockchain}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.statuses.length > 0 && !f.statuses.includes(p.status)) return false;
    if (f.rewards.length > 0 && !f.rewards.some((r) => p.rewardTypes.includes(r))) return false;
    if (f.blockchain && p.blockchain !== f.blockchain) return false;
    if (f.tier && !p.investors.some((i) => String(i.tier) === f.tier)) return false;
    if (f.category && !p.categories.includes(f.category)) return false;
    if (f.progress && !inBucket(progressOf(p), f.progress)) return false;
    if (f.hotOnly) {
      const hasHot = p.status !== "completed" && p.deadlines.some((d) => {
        const days = Math.ceil((new Date(`${d.date}T23:59:59`).getTime() - Date.now()) / 86400000);
        return days >= 0 && days <= 7;
      });
      if (!hasHot) return false;
    }
    return true;
  });

  list = [...list].sort((a, b) => {
    switch (f.sort) {
      case "priority": return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.createdAt - a.createdAt;
      case "date": return b.createdAt - a.createdAt;
      case "status": return STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      case "progress": return progressOf(b) - progressOf(a);
      case "difficulty": return DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty];
      case "alpha": return a.name.localeCompare(b.name, "ru");
    }
  });
  return list;
}

export function countActive(f: FilterState): number {
  return (
    f.statuses.length +
    f.rewards.length +
    (f.blockchain ? 1 : 0) +
    (f.tier ? 1 : 0) +
    (f.category ? 1 : 0) +
    (f.progress ? 1 : 0) +
    (f.hotOnly ? 1 : 0)
  );
}

const selectCls = "input !w-auto !py-1.5 !text-xs cursor-pointer font-semibold";

export function FiltersPanel({
  filters,
  onChange,
  onExportCsv,
  total,
  shown,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onExportCsv: () => void;
  total: number;
  shown: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const active = useMemo(() => countActive(filters), [filters]);
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="panel overflow-hidden">
      {/* строка поиска */}
      <div className="flex flex-col gap-2.5 border-b border-line p-3.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
          <input
            className="input !pl-9"
            placeholder="Поиск: название, $тикер, описание, теги…"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
          />
          {filters.q && (
            <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mut transition-colors hover:text-txt" onClick={() => set({ q: "" })} aria-label="Очистить">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className={cx("btn-ghost !px-3 !py-2 !text-xs", filters.hotOnly && "!border-flame !bg-flame/15 !text-flame")}
            onClick={() => set({ hotOnly: !filters.hotOnly })}
            title="Проекты с дедлайнами в ближайшие 7 дней"
          >
            <Flame size={14} />
            Горящие
          </button>
          <button className={cx("btn-ghost !px-3 !py-2 !text-xs", expanded && "!border-brand/60 !text-brand")} onClick={() => setExpanded((v) => !v)}>
            <SlidersHorizontal size={14} />
            Фильтры
            {active > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] font-extrabold text-ink">{active}</span>}
          </button>
          <button className="btn-ghost !px-3 !py-2 !text-xs" onClick={onExportCsv} title="Экспорт отфильтрованных проектов в CSV">
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3.5 p-3.5">
              {/* статусы */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 w-24 shrink-0 text-[10px] font-bold uppercase tracking-wider text-mut">Статус</span>
                {STATUS_LIST.map((s) => {
                  const on = filters.statuses.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => set({ statuses: on ? filters.statuses.filter((x) => x !== s.id) : [...filters.statuses, s.id] })}
                      className={cx("chip !py-1 transition-all duration-150 hover:-translate-y-px")}
                      style={on ? { borderColor: s.color, color: s.color, background: `${s.color}1c` } : { color: "var(--muted)" }}
                      title={s.hint}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* типы наград */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 w-24 shrink-0 text-[10px] font-bold uppercase tracking-wider text-mut">Награды</span>
                {REWARD_LIST.map((r) => {
                  const on = filters.rewards.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => set({ rewards: on ? filters.rewards.filter((x) => x !== r.id) : [...filters.rewards, r.id] })}
                      className={cx(
                        "chip !py-1 transition-all duration-150 hover:-translate-y-px",
                        on ? "!border-sky !bg-sky/15 !text-sky" : "text-mut"
                      )}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>

              {/* селекты */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 w-24 shrink-0 text-[10px] font-bold uppercase tracking-wider text-mut">Параметры</span>
                <select className={selectCls} value={filters.blockchain} onChange={(e) => set({ blockchain: e.target.value })}>
                  <option value="">Блокчейн: все</option>
                  {BLOCKCHAINS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <select className={selectCls} value={filters.tier} onChange={(e) => set({ tier: e.target.value })}>
                  <option value="">Тир фонда: все</option>
                  <option value="1">Только Tier 1</option>
                  <option value="2">Только Tier 2</option>
                </select>
                <select className={selectCls} value={filters.category} onChange={(e) => set({ category: e.target.value })}>
                  <option value="">Категория: все</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className={selectCls} value={filters.progress} onChange={(e) => set({ progress: e.target.value })}>
                  <option value="">Прогресс: любой</option>
                  <option value="0">0% (не начат)</option>
                  <option value="0-25">0–25%</option>
                  <option value="25-50">25–50%</option>
                  <option value="50-75">50–75%</option>
                  <option value="75-100">75–100%</option>
                  <option value="100">100% ✔ выполнен</option>
                </select>
                <select className={selectCls} value={filters.sort} onChange={(e) => set({ sort: e.target.value as SortKey })}>
                  <option value="status">Сортировка: приоритет статуса</option>
                  <option value="priority">По приоритету</option>
                  <option value="date">По дате добавления</option>
                  <option value="progress">По прогрессу задач</option>
                  <option value="difficulty">По сложности</option>
                  <option value="alpha">По алфавиту</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-linesoft pt-3">
                <span className="font-mono text-[11px] font-semibold text-mut">
                  Показано <span className="text-brand">{shown}</span> из {total} проектов
                </span>
                {(active > 0 || filters.q) && (
                  <button className="inline-flex items-center gap-1.5 text-xs font-bold text-mut transition-colors hover:text-danger" onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}>
                    <RotateCcw size={12} />
                    Сбросить фильтры
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
