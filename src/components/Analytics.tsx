import { useMemo } from "react";
import { motion } from "motion/react";
import { Coins, Flame, Heart, Landmark, ListChecks } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "../lib/store";
import { CATEGORIES, REWARD_LIST, STATUS_LIST } from "../lib/types";
import { formatUsd, isHot, progressOf, raisedUsd, cx } from "../lib/utils";
import { Reveal } from "./ui";

const tooltipStyle = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--text)",
} as const;

function Metric({ icon, label, value, sub, color, delay }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -4 }}
      className="panel relative overflow-hidden p-4"
    >
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-mut">
        <span style={{ color }}>{icon}</span> {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-txt">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] font-semibold text-mut">{sub}</div>}
    </motion.div>
  );
}

export function Analytics() {
  const { projects, favorites } = useStore();

  const stats = useMemo(() => {
    const total = projects.length;
    const allActs = projects.reduce((s, p) => s + p.activities.length, 0);
    const doneActs = projects.reduce((s, p) => s + p.activities.filter((a) => a.done).length, 0);
    const taskPct = allActs === 0 ? 0 : Math.round((doneActs / allActs) * 100);
    const raised = projects.reduce((s, p) => s + raisedUsd(p), 0);
    const hot = projects.filter(isHot).length;
    const avgProgress = total === 0 ? 0 : Math.round(projects.reduce((s, p) => s + progressOf(p), 0) / total);
    return { total, allActs, doneActs, taskPct, raised, hot, avgProgress };
  }, [projects]);

  const statusData = useMemo(
    () => STATUS_LIST.map((s) => ({ name: s.label, value: projects.filter((p) => p.status === s.id).length, color: s.color })).filter((x) => x.value > 0),
    [projects]
  );

  const chainData = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) => map.set(p.blockchain, (map.get(p.blockchain) ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [projects]);

  const catData = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) => p.categories.forEach((c) => map.set(c, (map.get(c) ?? 0) + 1)));
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [projects]);

  const rewardData = useMemo(
    () => REWARD_LIST.map((r) => ({ ...r, count: projects.filter((p) => p.rewardTypes.includes(r.id)).length })).filter((x) => x.count > 0),
    [projects]
  );

  const topFunds = useMemo(() => {
    const map = new Map<string, { name: string; count: number; sum: number; bestTier: number }>();
    projects.forEach((p) =>
      p.investors.forEach((i) => {
        const e = map.get(i.name) ?? { name: i.name, count: 0, sum: 0, bestTier: 2 };
        e.count += 1;
        e.sum += i.amountUsd ?? 0;
        e.bestTier = Math.min(e.bestTier, i.tier);
        map.set(i.name, e);
      })
    );
    return [...map.values()].sort((a, b) => b.count - a.count || b.sum - a.sum).slice(0, 8);
  }, [projects]);

  const maxReward = Math.max(1, ...rewardData.map((r) => r.count));

  return (
    <div className="space-y-5">
      {/* метрики */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Metric icon={<ListChecks size={13} />} label="Проектов в работе" value={String(stats.total)} sub={`${stats.allActs} активностей на трекинге`} color="#3FB950" delay={0} />
        <Metric icon={<Coins size={13} />} label="Выполнено задач" value={`${stats.taskPct}%`} sub={`${stats.doneActs} из ${stats.allActs} заданий`} color="#58A6FF" delay={0.05} />
        <Metric icon={<Landmark size={13} />} label="Привлечено фондами" value={formatUsd(stats.raised)} sub="по открытым раундам портфеля" color="#D29922" delay={0.1} />
        <Metric icon={<Heart size={13} />} label="В избранном" value={String(favorites.length)} sub="личные закладки трекера" color="#A371F7" delay={0.15} />
        <Metric icon={<Flame size={13} />} label="Горящие дедлайны" value={String(stats.hot)} sub="клеймы и регистрации ≤ 7 дней" color="#DB6D28" delay={0.2} />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* статусы */}
        <Reveal className="panel p-5 lg:col-span-2">
          <h3 className="font-display text-sm font-bold text-txt">Распределение по статусам</h3>
          <p className="text-xs text-mut">Воронка аирдроп-цикла портфеля</p>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3} strokeWidth={0}>
                  {statusData.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded" style={{ background: s.color }} />
                <span className="flex-1 font-semibold text-mut">{s.name}</span>
                <span className="font-mono font-extrabold text-txt">{s.value}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* фонды */}
        <Reveal delay={0.08} className="panel p-5 lg:col-span-3">
          <h3 className="font-display text-sm font-bold text-txt">Топ фондов портфеля</h3>
          <p className="text-xs text-mut">Рейтинг по количеству проинвестированных проектов</p>
          <div className="mt-4 space-y-2">
            {topFunds.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-lg border border-linesoft bg-raised/50 px-3 py-2 transition-colors hover:border-line"
              >
                <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-extrabold", i === 0 ? "bg-amber/20 text-amber" : "bg-panel text-mut border border-line")}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-bold text-txt">{f.name}</span>
                    <span className={cx("rounded px-1 py-px font-mono text-[9px] font-extrabold", f.bestTier === 1 ? "bg-amber/15 text-amber" : "bg-raised text-mut border border-line")}>T{f.bestTier}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-panel">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-branddark to-brand"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(f.count / (topFunds[0]?.count ?? 1)) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: 0.2 + i * 0.05 }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-extrabold text-txt">{f.count} <span className="text-[10px] font-bold text-mut">пр.</span></div>
                  {f.sum > 0 && <div className="font-mono text-[10px] font-semibold text-brand">{formatUsd(f.sum)}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* блокчейны */}
        <Reveal className="panel p-5">
          <h3 className="font-display text-sm font-bold text-txt">По блокчейнам</h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chainData} layout="vertical" margin={{ left: 8, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={76} tick={{ fill: "var(--text)", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--raised)" }} />
                <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={18}>
                  {chainData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "#3FB950" : "#58A6FF"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Reveal>

        {/* категории + награды */}
        <div className="space-y-5">
          <Reveal delay={0.06} className="panel p-5">
            <h3 className="font-display text-sm font-bold text-txt">По категориям</h3>
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catData} margin={{ top: 4, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={44} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={26} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--raised)" }} />
                  <Bar dataKey="value" fill="#D29922" radius={[5, 5, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="panel p-5">
            <h3 className="font-display text-sm font-bold text-txt">Типы вознаграждений</h3>
            <div className="mt-3 space-y-2.5">
              {rewardData.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs font-bold text-mut">{r.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                    <motion.div className="h-full rounded-full bg-sky" initial={{ width: 0 }} whileInView={{ width: `${(r.count / maxReward) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.6 }} />
                  </div>
                  <span className="w-6 text-right font-mono text-xs font-extrabold text-txt">{r.count}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
