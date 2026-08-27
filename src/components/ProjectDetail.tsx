import { useState } from "react";
import { CalendarClock, Coins, ExternalLink, Gift, Landmark, Pencil, PieChart as PieIcon, Trash2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Project } from "../lib/types";
import { ACTIVITY_LABEL, DEADLINE_KINDS, DIFFICULTY_META, PRIORITY_META, REWARD_LABEL, STATUS_META } from "../lib/types";
import { cx, daysUntil, formatDateRu, formatUsd, progressOf, raisedUsd } from "../lib/utils";
import { useStore } from "../lib/store";
import { LogoAvatar, Modal, ModalHeader, ProgressBar, StatusBadge } from "./ui";

export function ProjectDetail({ project, onClose, onEdit }: { project: Project; onClose: () => void; onEdit: () => void }) {
  const { isAdmin, deleteProject, toggleActivity, favorites, toggleFav } = useStore();
  const [confirmDel, setConfirmDel] = useState(false);
  const meta = STATUS_META[project.status];
  const progress = progressOf(project);
  const done = project.activities.filter((a) => a.done).length;
  const fav = favorites.includes(project.id);
  const totalRaised = raisedUsd(project);

  return (
    <Modal open onClose={onClose} width="max-w-4xl">
      <div className="relative overflow-hidden rounded-t-xl" style={{ height: 6, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}33)` }} />
      <ModalHeader
        onClose={onClose}
        title={
          <span className="flex items-center gap-2.5">
            <LogoAvatar project={project} size={34} />
            {project.name}
            <span className="rounded bg-raised border border-line px-1.5 py-0.5 font-mono text-[11px] font-bold text-mut">${project.ticker}</span>
          </span>
        }
        subtitle={`${project.blockchain} · добавлен ${new Date(project.createdAt).toLocaleDateString("ru-RU")}`}
      />

      <div className="max-h-[72vh] overflow-y-auto px-5 py-5 sm:px-6">
        {/* верхний ряд */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} size="md" />
          {project.rewardTypes.map((r) => (
            <span key={r} className="chip !border-sky/40 !bg-sky/10 !text-sky"><Gift size={10} /> {REWARD_LABEL[r]}</span>
          ))}
          <span className="chip" style={{ color: PRIORITY_META[project.priority].color }}>Приоритет: {PRIORITY_META[project.priority].label}</span>
          <span className="chip" style={{ color: DIFFICULTY_META[project.difficulty].color }}>Сложность: {DIFFICULTY_META[project.difficulty].label}</span>
          <span className="chip text-mut">{project.categories.join(" · ")}</span>
        </div>

        {/* кнопки действий */}
        <div className="mt-4 flex flex-wrap gap-2">
          {project.status === "claiming" && project.claimUrl && (
            <a href={project.claimUrl} target="_blank" rel="noreferrer" className="btn-primary">
              <Gift size={15} /> Перейти к клейму <ExternalLink size={13} />
            </a>
          )}
          {project.website && (
            <a href={project.website} target="_blank" rel="noreferrer" className="btn-ghost">
              <ExternalLink size={14} /> Официальный сайт
            </a>
          )}
          <button className={cx("btn-ghost", fav && "!border-amber !text-amber")} onClick={() => toggleFav(project.id)}>
            ★ {fav ? "В избранном" : "В избранное"}
          </button>
          {isAdmin && (
            <div className="ml-auto flex gap-2">
              <button className="btn-ghost" onClick={onEdit}><Pencil size={14} /> Редактировать</button>
              <button className="btn-danger" onClick={() => (confirmDel ? (deleteProject(project.id), onClose()) : setConfirmDel(true))}>
                <Trash2 size={14} /> {confirmDel ? "Подтвердить удаление?" : "Удалить"}
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 rounded-xl border border-line bg-raised/60 p-4 text-sm leading-relaxed text-txt">{project.description}</p>

        {project.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tags.map((t) => (
              <span key={t} className="font-mono text-[11px] font-semibold text-brand">#{t}</span>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {/* чек-лист */}
          <section className="panel overflow-hidden">
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <h4 className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-txt">
                <span className="text-brand">▤</span> Чек-лист активностей
              </h4>
              <span className="font-mono text-xs font-extrabold tabular-nums" style={{ color: progress === 100 ? "#3FB950" : "var(--text)" }}>
                {done}/{project.activities.length} · {progress}%
              </span>
            </header>
            <div className="p-2">
              <ProgressBar value={progress} color={meta.color} live />
            </div>
            <ul>
              {project.activities.map((a) => (
                <li key={a.id} className="flex items-center gap-2.5 border-t border-linesoft px-4 py-2.5 transition-colors hover:bg-raised/70">
                  <input type="checkbox" className="dt-check" checked={a.done} onChange={() => toggleActivity(project.id, a.id)} />
                  <div className="min-w-0 flex-1">
                    <div className={cx("text-xs font-bold transition-all", a.done ? "text-mut line-through" : "text-txt")}>{a.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] font-semibold text-mut">
                      <span>{ACTIVITY_LABEL[a.type]}</span>
                      {a.dailyReset && <span className="rounded bg-brand/15 px-1 py-px font-mono font-bold text-brand">сброс 24ч</span>}
                    </div>
                  </div>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noreferrer" className="icon-btn !h-7 !w-7" title="Открыть"><ExternalLink size={12} /></a>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-5">
            {/* дедлайны */}
            <section className="panel">
              <header className="flex items-center gap-2 border-b border-line px-4 py-3">
                <CalendarClock size={14} className="text-flame" />
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-txt">Дедлайны</h4>
              </header>
              {project.deadlines.length === 0 ? (
                <p className="px-4 py-4 text-xs text-mut">Дедлайны не назначены.</p>
              ) : (
                <ul>
                  {[...project.deadlines]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((d) => {
                      const kind = DEADLINE_KINDS.find((k) => k.id === d.kind) ?? DEADLINE_KINDS[3];
                      const days = daysUntil(d.date);
                      return (
                        <li key={d.id} className="flex items-center gap-3 border-t border-linesoft px-4 py-2.5 first:border-0">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: kind.color }} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-bold text-txt">{d.title}</div>
                            <div className="text-[10px] font-semibold text-mut">{kind.label} · {formatDateRu(d.date)}</div>
                          </div>
                          <span
                            className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                            style={{ color: days < 0 ? "var(--muted)" : days <= 7 ? "#DB6D28" : kind.color, background: days < 0 ? "var(--raised)" : `${days <= 7 ? "#DB6D28" : kind.color}1a` }}
                          >
                            {days < 0 ? "прошёл" : days === 0 ? "сегодня" : `${days} дн`}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              )}
            </section>

            {/* инвесторы */}
            <section className="panel">
              <header className="flex items-center justify-between border-b border-line px-4 py-3">
                <h4 className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-txt">
                  <Landmark size={14} className="text-sky" /> Инвесторы и раунды
                </h4>
                {totalRaised > 0 && <span className="font-mono text-xs font-extrabold text-brand">{formatUsd(totalRaised)}</span>}
              </header>
              {project.investors.length === 0 ? (
                <p className="px-4 py-4 text-xs text-mut">Без венчурных инвесторов — полностью комьюнити-проект.</p>
              ) : (
                <ul>
                  {project.investors.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 border-t border-linesoft px-4 py-2.5 first:border-0">
                      <span
                        className={cx("flex h-7 w-9 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-extrabold", i.tier === 1 ? "bg-amber/15 text-amber border border-amber/40" : "bg-raised text-mut border border-line")}
                      >
                        T{i.tier}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-txt">{i.name}</div>
                        {i.roundDate && <div className="text-[10px] font-semibold text-mut">Раунд: {formatDateRu(i.roundDate)}</div>}
                      </div>
                      {i.amountUsd ? <span className="font-mono text-xs font-bold text-txt">{formatUsd(i.amountUsd)}</span> : <span className="text-[10px] font-semibold text-mut">сумма скрыта</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        {/* токеномика */}
        <section className="panel mt-5">
          <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3">
            <h4 className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-txt">
              <PieIcon size={14} className="text-amber" /> Токеномика
            </h4>
            {project.tokenStandard && (
              <span className="chip text-mut"><Coins size={10} /> {project.tokenStandard}</span>
            )}
            {project.totalSupply && <span className="chip text-mut">Supply: {project.totalSupply}</span>}
          </header>
          {project.tokenomics.length === 0 ? (
            <p className="px-4 py-5 text-xs text-mut">Распределение токенов пока не объявлено.</p>
          ) : (
            <div className="grid items-center gap-4 p-4 sm:grid-cols-[220px_1fr]">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={project.tokenomics}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                      strokeWidth={0}
                      isAnimationActive
                    >
                      {project.tokenomics.map((s) => (
                        <Cell key={s.id} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12, color: "var(--text)" }}
                      formatter={(v) => [`${v}%`, "Доля"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2">
                {project.tokenomics.map((s) => (
                  <li key={s.id} className="flex items-center gap-2.5">
                    <span className="h-3 w-3 shrink-0 rounded" style={{ background: s.color }} />
                    <span className="flex-1 text-xs font-semibold text-txt">{s.label}</span>
                    <span className="font-mono text-xs font-extrabold tabular-nums text-txt">{s.value}%</span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-raised">
                      <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.color }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
