import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { BarChart3, CalendarDays, ChevronDown, LayoutGrid, LogIn, LogOut, Moon, ShieldCheck, Sun, TimerReset, UserCircle2 } from "lucide-react";
import { useStore } from "../lib/store";
import type { Theme } from "../lib/store";
import { cx, formatCountdown, mskClock, mskDate, nearestDeadline } from "../lib/utils";

export type Tab = "tracker" | "analytics" | "calendar";

const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "tracker", label: "Трекер", icon: LayoutGrid },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
  { id: "calendar", label: "Календарь", icon: CalendarDays },
];

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
      <rect x="1" y="1" width="32" height="32" rx="9" stroke="var(--line)" strokeWidth="1.5" fill="var(--raised)" />
      <circle cx="17" cy="17" r="10" stroke="#3FB950" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="17" cy="17" r="5" stroke="#3FB950" strokeOpacity="0.6" strokeWidth="1.5" />
      <g className="animate-radar">
        <path d="M17 17 L17 6" stroke="#3FB950" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="6" r="2.2" fill="#3FB950" />
      </g>
      <circle cx="22.5" cy="21" r="1.8" fill="#58A6FF" />
    </svg>
  );
}

function CountdownChip({ onClick }: { onClick: () => void }) {
  const { nextReset } = useStore();
  const [left, setLeft] = useState(nextReset - Date.now());
  useEffect(() => {
    const iv = setInterval(() => setLeft(nextReset - Date.now()), 1000);
    return () => clearInterval(iv);
  }, [nextReset]);

  return (
    <button
      onClick={onClick}
      className="group hidden items-center gap-2 rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 transition-all duration-200 hover:border-brand/70 hover:bg-brand/15 md:inline-flex"
      title="До автоматического сброса дейли-активностей (03:00 МСК)"
    >
      <TimerReset size={14} className="text-brand transition-transform duration-500 group-hover:-rotate-180" />
      <span className="font-mono text-xs font-bold text-brand tabular-nums">{formatCountdown(left)}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-mut">до сброса</span>
    </button>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="hidden text-right leading-tight lg:block">
      <div className="font-mono text-sm font-bold text-txt tabular-nums">{mskClock(now)}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-mut">
        МСК · {mskDate(now)}
      </div>
    </div>
  );
}

export function Header({
  tab,
  setTab,
  onOpenAuth,
  onOpenProfile,
  onOpenReset,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenReset: () => void;
}) {
  const { isAdmin, admin, theme, setTheme, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-panel/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button className="flex items-center gap-2.5" onClick={() => setTab("tracker")}>
          <LogoMark />
          <div className="leading-none">
            <div className="font-display text-[15px] font-extrabold tracking-tight text-txt">
              DROP<span className="text-brand">TRACK</span>
            </div>
            <div className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.22em] text-mut sm:block">airdrop hunter crm</div>
          </div>
        </button>

        <nav className="ml-4 hidden items-center gap-1 rounded-xl border border-line bg-raised p-1 sm:flex">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx("relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-200", active ? "text-ink" : "text-mut hover:text-txt")}
              >
                {active && (
                  <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-lg bg-brand" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon size={14} />
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <CountdownChip onClick={onOpenReset} />
          <Clock />
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark" as Theme)} title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isAdmin ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 py-1 pl-1 pr-2 transition-all hover:border-brand"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-branddark font-display text-[11px] font-extrabold text-white">
                  {admin.name.slice(0, 1)}
                </span>
                <ShieldCheck size={14} className="hidden text-brand sm:block" />
                <ChevronDown size={13} className="text-mut" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="panel absolute right-0 z-20 mt-2 w-52 overflow-hidden shadow-xl shadow-black/40"
                  >
                    <div className="border-b border-line px-3 py-2.5">
                      <div className="text-xs font-bold text-txt">{admin.name}</div>
                      <div className="font-mono text-[10px] text-mut">{admin.email}</div>
                    </div>
                    <button className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-txt transition-colors hover:bg-raised" onClick={() => { setMenuOpen(false); onOpenProfile(); }}>
                      <UserCircle2 size={14} className="text-mut" /> Профиль и пароль
                    </button>
                    <button className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-left text-xs font-semibold text-danger transition-colors hover:bg-raised" onClick={() => { setMenuOpen(false); logout(); }}>
                      <LogOut size={14} /> Выйти из аккаунта
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          ) : (
            <button className="btn-primary !px-3 !py-1.5" onClick={onOpenAuth}>
              <LogIn size={14} />
              <span className="hidden sm:inline">Админ</span>
            </button>
          )}
        </div>
      </div>

      {/* мобильная навигация */}
      <div className="flex gap-1 border-t border-line bg-panel px-4 py-2 sm:hidden">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx("flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors", active ? "bg-brand text-ink" : "bg-raised text-mut")}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}

/* Бегущая строка ближайших дедлайнов */
export function Ticker() {
  const { projects } = useStore();
  const items = useMemo(() => {
    const list: { ticker: string; title: string; days: number; color: string }[] = [];
    for (const p of projects) {
      const nd = nearestDeadline(p);
      if (nd) list.push({ ticker: p.ticker, title: nd.title, days: nd.days, color: nd.kind === "claim" ? "#3FB950" : nd.kind === "registration" ? "#DB6D28" : nd.kind === "snapshot" ? "#58A6FF" : "#D29922" });
    }
    return list.sort((a, b) => a.days - b.days).slice(0, 12);
  }, [projects]);

  if (items.length === 0) return null;
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={`${key}-${i}`} className="flex items-center gap-2 px-5 font-mono text-[11px] font-semibold text-mut">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: it.color }} />
          <span className="font-bold text-txt">${it.ticker}</span>
          {it.title}
          <span className="rounded bg-raised px-1.5 py-0.5 text-[10px] font-bold" style={{ color: it.color }}>
            {it.days === 0 ? "сегодня" : `через ${it.days} дн`}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden border-b border-line bg-panel/70">
      <div className="flex w-max animate-marquee py-1.5">{[row("a"), row("b")]}</div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
