import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { History, Info, RotateCcw, TimerReset, Zap } from "lucide-react";
import { useStore } from "../lib/store";
import { Modal, ModalHeader } from "./ui";
import { cx, formatCountdown, nextResetAt, relativeTime } from "../lib/utils";

export function ResetModal({ onClose }: { onClose: () => void }) {
  const { nextReset, resetLog, performManualReset, isAdmin, projects } = useStore();
  const [left, setLeft] = useState(nextReset - Date.now());

  useEffect(() => {
    const iv = setInterval(() => setLeft(nextReset - Date.now()), 250);
    return () => clearInterval(iv);
  }, [nextReset]);

  const dailyTotal = useMemo(() => projects.reduce((s, p) => s + p.activities.filter((a) => a.dailyReset).length, 0), [projects]);
  const dailyDone = useMemo(() => projects.reduce((s, p) => s + p.activities.filter((a) => a.dailyReset && a.done).length, 0), [projects]);

  const resetDate = new Date(nextReset);
  const progressPct = Math.min(100, Math.max(0, ((24 * 3600 * 1000 - left) / (24 * 3600 * 1000)) * 100));

  return (
    <Modal open onClose={onClose} width="max-w-lg">
      <ModalHeader onClose={onClose} title="Автосброс активностей" subtitle="Встроенный Cron-планировщик · 03:00 МСК (UTC+3)" />
      <div className="px-5 py-5 sm:px-6">
        {/* таймер */}
        <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 to-transparent p-6 text-center">
          <div className="pointer-events-none absolute -right-6 -top-6 opacity-15">
            <TimerReset size={130} className="text-brand" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-mut">До следующего сброса</div>
          <div className="mt-2 font-mono text-5xl font-extrabold tabular-nums tracking-tight text-brand">
            {formatCountdown(left)}
          </div>
          <div className="mt-2 font-mono text-[11px] font-semibold text-mut">
            {resetDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} · 03:00 МСК
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-raised">
            <motion.div className="h-full rounded-full bg-brand" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        {/* статистика дейли */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="panel p-3.5 text-center">
            <div className="font-mono text-xl font-extrabold text-txt">{dailyTotal}</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-mut">активностей с флагом 24ч</div>
          </div>
          <div className="panel p-3.5 text-center">
            <div className="font-mono text-xl font-extrabold text-amber">{dailyDone}</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-mut">будет обнулено в 03:00</div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-raised/60 p-3.5 text-xs leading-relaxed text-mut">
          <Info size={15} className="mt-0.5 shrink-0 text-sky" />
          <p>
            Каждые сутки в <span className="font-mono font-bold text-txt">03:00 МСК</span> планировщик автоматически снимает отметки
            выполнения у заданий с флагом <span className="rounded bg-brand/15 px-1 font-mono font-bold text-brand">24ч</span> —
            так ежедневные активности (краны, чек-ины, квесты) снова готовы к выполнению.
          </p>
        </div>

        {isAdmin ? (
          <button className="btn-danger mt-4 w-full justify-center" onClick={performManualReset}>
            <Zap size={15} /> Принудительный сброс сейчас
          </button>
        ) : (
          <p className="mt-4 rounded-lg border border-line bg-raised px-3 py-2.5 text-center text-[11px] font-semibold text-mut">
            Принудительный сброс доступен только администратору
          </p>
        )}

        {/* журнал */}
        <div className="mt-5">
          <h4 className="mb-2 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-wider text-txt">
            <History size={13} className="text-mut" /> Журнал сбросов
          </h4>
          <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
            {resetLog.length === 0 && <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-mut">Сбросов пока не было — журнал заполнится автоматически.</p>}
            {resetLog.map((e) => (
              <div key={e.id} className="flex items-center gap-2.5 rounded-lg border border-linesoft bg-panel px-3 py-2">
                <span className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", e.kind === "auto" ? "bg-sky/15 text-sky" : "bg-flame/15 text-flame")}>
                  {e.kind === "auto" ? <TimerReset size={12} /> : <RotateCcw size={12} />}
                </span>
                <div className="flex-1">
                  <div className="text-xs font-bold text-txt">
                    {e.kind === "auto" ? "Автосброс 03:00 МСК" : "Принудительный сброс"}
                  </div>
                  <div className="text-[10px] font-semibold text-mut">{relativeTime(e.at)}</div>
                </div>
                <span className="font-mono text-[11px] font-extrabold text-brand">−{e.affected}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
