import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ExternalLink, Flame, Globe2, Landmark, Pencil, Star } from "lucide-react";
import type { Project } from "../lib/types";
import { ACTIVITY_LABEL, DIFFICULTY_META, PRIORITY_META, REWARD_LABEL, STATUS_META } from "../lib/types";
import { cx, formatDateRu, isHot, nearestDeadline, progressOf, raisedUsd, formatUsd } from "../lib/utils";
import { useStore } from "../lib/store";
import { LogoAvatar, ProgressBar, StatusBadge } from "./ui";

export function ProjectCard({ project, onOpen, onEdit, index }: { project: Project; onOpen: () => void; onEdit: () => void; index: number }) {
  const { favorites, toggleFav, toggleActivity, isAdmin } = useStore();
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[project.status];
  const progress = progressOf(project);
  const done = project.activities.filter((a) => a.done).length;
  const fav = favorites.includes(project.id);
  const nd = nearestDeadline(project);
  const hot = isHot(project);
  const tier1 = project.investors.filter((i) => i.tier === 1).length;
  const raised = raisedUsd(project);
  const dailyCount = project.activities.filter((a) => a.dailyReset).length;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      className="panel group relative flex cursor-pointer flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl hover:shadow-black/40"
      style={{ borderTop: `2px solid ${meta.color}` }}
      onClick={onOpen}
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <LogoAvatar project={project} size={46} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-[15px] font-bold text-txt transition-colors group-hover:text-brand">{project.name}</h3>
            <span className="shrink-0 rounded bg-raised border border-line px-1.5 py-0.5 font-mono text-[10px] font-bold text-mut">${project.ticker}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={project.status} />
            <span className="chip text-mut" style={{ color: PRIORITY_META[project.priority].color }} title={`Приоритет: ${PRIORITY_META[project.priority].label}`}>
              ◆ {PRIORITY_META[project.priority].label}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); toggleFav(project.id); }}
            className={cx("icon-btn !h-8 !w-8 !border-0 !bg-transparent", fav ? "!text-amber" : "!text-mut hover:!text-amber")}
            title={fav ? "Убрать из избранного" : "В избранное"}
          >
            <Star size={17} fill={fav ? "#D29922" : "none"} />
          </button>
          {isAdmin && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="icon-btn !h-8 !w-8" title="Редактировать проект">
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>

      <p className="line-clamp-2 px-4 text-xs leading-relaxed text-mut">{project.description}</p>

      <div className="mt-3 flex flex-wrap gap-1 px-4">
        {project.categories.map((c) => (
          <span key={c} className="chip text-mut">{c}</span>
        ))}
        {project.rewardTypes.map((r) => (
          <span key={r} className="chip !border-sky/40 !bg-sky/10 !text-sky">{REWARD_LABEL[r]}</span>
        ))}
      </div>

      {/* прогресс */}
      <div className="mt-4 px-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mut">
            Задания · {done}/{project.activities.length}
            {dailyCount > 0 && <span className="ml-1.5 text-brand">↻ {dailyCount} дейли</span>}
          </span>
          <span className="font-mono text-xs font-extrabold tabular-nums" style={{ color: progress === 100 ? "#3FB950" : "var(--text)" }}>
            {progress}%
          </span>
        </div>
        <ProgressBar value={progress} color={progress === 100 ? "#3FB950" : meta.color} live />
      </div>

      {/* нижняя строка */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-linesoft px-4 py-2.5 text-[11px] font-semibold text-mut">
        <span className="inline-flex items-center gap-1"><Globe2 size={12} /> {project.blockchain}</span>
        <span className="inline-flex items-center gap-1" title="Инвесторы Tier 1 / привлечено">
          <Landmark size={12} />
          {project.investors.length > 0 ? `${tier1 > 0 ? `${tier1}×T1 · ` : ""}${raised > 0 ? formatUsd(raised) : "сумма скрыта"}` : "Без VC"}
        </span>
        <span className="inline-flex items-center gap-1" title="Сложность">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: DIFFICULTY_META[project.difficulty].color }} />
          {DIFFICULTY_META[project.difficulty].label}
        </span>
        {nd && project.status !== "completed" && (
          <span className={cx("ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5", hot ? "bg-flame/15 text-flame" : "bg-raised text-mut")}>
            <Flame size={11} className={hot ? "" : "opacity-0"} />
            {nd.days <= 0 ? "сегодня!" : `${nd.days} дн · ${formatDateRu(nd.date)}`}
          </span>
        )}
      </div>

      {/* раскрытие чек-листа */}
      <button
        className="flex w-full items-center justify-center gap-1.5 border-t border-linesoft bg-raised/60 py-2 text-[11px] font-bold uppercase tracking-wider text-mut transition-colors hover:text-brand"
        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
      >
        Чек-лист активностей
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
          <ChevronDown size={13} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-linesoft bg-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {project.activities.length === 0 && <li className="px-4 py-3 text-xs text-mut">Активности пока не добавлены.</li>}
            {project.activities.map((a) => (
              <li key={a.id} className="group/item flex items-center gap-2.5 border-b border-linesoft px-4 py-2 last:border-0 hover:bg-raised/70">
                <input type="checkbox" className="dt-check" checked={a.done} onChange={() => toggleActivity(project.id, a.id)} />
                <span className={cx("flex-1 text-xs font-semibold transition-all duration-200", a.done ? "text-mut line-through opacity-70" : "text-txt")}>
                  {a.title}
                </span>
                {a.dailyReset && <span className="rounded bg-brand/15 px-1 py-0.5 font-mono text-[9px] font-bold text-brand" title="Сброс каждые 24ч (03:00 МСК)">24ч</span>}
                <span className="hidden rounded bg-raised px-1.5 py-0.5 text-[9px] font-bold text-mut sm:block">{ACTIVITY_LABEL[a.type]}</span>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-mut transition-colors hover:text-sky" onClick={(e) => e.stopPropagation()} title="Открыть ссылку">
                    <ExternalLink size={12} />
                  </a>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
