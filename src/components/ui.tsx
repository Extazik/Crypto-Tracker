import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import type { Project, ProjectStatus } from "../lib/types";
import { STATUS_META } from "../lib/types";
import { AVATAR_GRADIENTS, cx, hashCode } from "../lib/utils";

/* ---------- Модальное окно ---------- */

export function Modal({
  open,
  onClose,
  children,
  width = "max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className={cx("panel relative my-4 w-full shadow-2xl shadow-black/50", width)}
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ModalHeader({ title, subtitle, onClose }: { title: ReactNode; subtitle?: ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
      <div>
        <h3 className="font-display text-base font-bold text-txt sm:text-lg">{title}</h3>
        {subtitle && <div className="mt-0.5 text-xs text-mut">{subtitle}</div>}
      </div>
      <button className="icon-btn -mr-1 shrink-0" onClick={onClose} aria-label="Закрыть">
        <X size={16} />
      </button>
    </div>
  );
}

/* ---------- Логотип проекта ---------- */

export function LogoAvatar({ project, size = 44, className }: { project: Pick<Project, "id" | "name" | "ticker" | "logoUrl">; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const showImg = project.logoUrl && !failed;
  const grad = AVATAR_GRADIENTS[hashCode(project.id) % AVATAR_GRADIENTS.length];
  const initials = (project.ticker || project.name).slice(0, 2).toUpperCase();

  return (
    <div
      className={cx("relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line shadow-inner", className)}
      style={{ width: size, height: size, background: showImg ? "var(--raised)" : `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
    >
      {showImg ? (
        <img src={project.logoUrl} alt={project.name} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="font-display font-bold text-white" style={{ fontSize: size * 0.34, letterSpacing: "0.02em" }}>
          {initials}
        </span>
      )}
    </div>
  );
}

/* ---------- Прогресс ---------- */

export function ProgressBar({ value, color = "#3FB950", live = false, height = 8 }: { value: number; color?: string; live?: boolean; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-raised border border-linesoft" style={{ height }}>
      <motion.div
        className={cx("h-full rounded-full", live && value > 0 && value < 100 && "bar-live")}
        style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 90, damping: 24 }}
      />
    </div>
  );
}

/* ---------- Бейджи ---------- */

export function StatusBadge({ status, size = "sm" }: { status: ProjectStatus; size?: "sm" | "md" }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cx("inline-flex items-center gap-1.5 rounded-md font-bold uppercase tracking-wide", size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs")}
      style={{ color: meta.color, background: `${meta.color}1f`, border: `1px solid ${meta.color}55` }}
    >
      <span className={cx("rounded-full", status === "claiming" ? "pulse-dot" : "")} style={{ width: 6, height: 6, background: meta.color }} />
      {meta.label}
    </span>
  );
}

/* ---------- Форма ---------- */

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between text-xs font-bold uppercase tracking-wider text-mut">
        {label}
        {hint && <span className="font-mono text-[10px] font-medium normal-case tracking-normal">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-danger">{error}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="group inline-flex items-center gap-2.5 text-left">
      <span
        className={cx("relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200", checked ? "border-brand bg-branddark" : "border-line bg-raised")}
      >
        <motion.span
          className="absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow"
          initial={false}
          animate={{ left: checked ? 18 : 3 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </span>
      <span className="text-xs font-semibold text-mut transition-colors group-hover:text-txt">{label}</span>
    </button>
  );
}

/* ---------- Пустое состояние ---------- */

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="panel col-span-full flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-raised text-mut">{icon}</div>
      <div>
        <div className="font-display text-base font-bold text-txt">{title}</div>
        <div className="mx-auto mt-1 max-w-sm text-sm text-mut">{text}</div>
      </div>
      {action}
    </motion.div>
  );
}

/* ---------- Scroll Reveal ---------- */

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
