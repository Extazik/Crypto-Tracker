import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AdminAccount, Project, ResetLogEntry } from "./types";
import { seedProjects } from "./seed";
import { fireConfetti, nextResetAt, progressOf, simpleHash, uid } from "./utils";

const LS = {
  projects: "droptrack_projects_v1",
  favs: "droptrack_favs_v1",
  session: "droptrack_session_v1",
  admin: "droptrack_admin_v1",
  log: "droptrack_reset_log_v1",
  theme: "droptrack_theme_v1",
};

export type Theme = "dark" | "light";
export interface Toast {
  id: string;
  msg: string;
  kind: "success" | "error" | "info";
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — ignore */
  }
}

function defaultAdmin(): AdminAccount {
  return { email: "admin@droptrack.ru", name: "Главный администратор", passwordHash: simpleHash("admin123") };
}

interface StoreValue {
  projects: Project[];
  favorites: string[];
  isAdmin: boolean;
  admin: AdminAccount;
  resetLog: ResetLogEntry[];
  nextReset: number;
  theme: Theme;
  toasts: Toast[];
  toast: (msg: string, kind?: Toast["kind"]) => void;
  toggleFav: (id: string) => void;
  toggleActivity: (projectId: string, activityId: string) => void;
  addProject: (p: Project) => void;
  updateProject: (p: Project) => void;
  deleteProject: (id: string) => void;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  changePassword: (current: string, next: string) => string | null;
  requestResetCode: (email: string) => string | null;
  resetPassword: (email: string, newPassword: string) => void;
  performManualReset: () => void;
  setTheme: (t: Theme) => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = load<Project[] | null>(LS.projects, null);
    return stored && stored.length > 0 ? stored : seedProjects();
  });
  const [favorites, setFavorites] = useState<string[]>(() => load(LS.favs, [] as string[]));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => load(LS.session, false));
  const [admin, setAdmin] = useState<AdminAccount>(() => load(LS.admin, defaultAdmin()));
  const [resetLog, setResetLog] = useState<ResetLogEntry[]>(() => load(LS.log, [] as ResetLogEntry[]));
  const [theme, setThemeState] = useState<Theme>(() => load(LS.theme, "dark" as Theme));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nextReset, setNextReset] = useState<number>(() => nextResetAt());
  const seededRef = useRef(false);

  /* persistence */
  useEffect(() => save(LS.projects, projects), [projects]);
  useEffect(() => save(LS.favs, favorites), [favorites]);
  useEffect(() => save(LS.session, isAdmin), [isAdmin]);
  useEffect(() => save(LS.admin, admin), [admin]);
  useEffect(() => save(LS.log, resetLog), [resetLog]);
  useEffect(() => {
    save(LS.theme, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toast = useCallback((msg: string, kind: Toast["kind"] = "success") => {
    const t: Toast = { id: uid("toast"), msg, kind };
    setToasts((prev) => [...prev.slice(-3), t]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4200);
  }, []);

  const runReset = useCallback(
    (kind: "auto" | "manual") => {
      let affected = 0;
      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          activities: p.activities.map((a) => {
            if (a.dailyReset && a.done) {
              affected += 1;
              return { ...a, done: false };
            }
            return a;
          }),
        }))
      );
      const entry: ResetLogEntry = { id: uid("log"), at: Date.now(), kind, affected };
      setResetLog((prev) => [entry, ...prev].slice(0, 60));
      setNextReset(nextResetAt());
      return affected;
    },
    []
  );

  /* Cron-проверка: если момент 03:00 МСК прошёл — автоматический сброс */
  useEffect(() => {
    const check = () => {
      if (Date.now() >= nextReset) {
        runReset("auto");
        toast("Автосброс 03:00 МСК: дейли-активности обнулены", "info");
      }
    };
    check();
    const iv = setInterval(check, 20000);
    return () => clearInterval(iv);
  }, [nextReset, runReset, toast]);

  /* приветствие при первом запуске с сид-данными */
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (!localStorage.getItem(LS.projects)) {
      save(LS.projects, projects);
    }
  }, [projects]);

  const toggleFav = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const toggleActivity = useCallback((projectId: string, activityId: string) => {
    setProjects((prev) => {
      let celebrated = false;
      const next = prev.map((p) => {
        if (p.id !== projectId) return p;
        const before = progressOf(p);
        const activities = p.activities.map((a) => (a.id === activityId ? { ...a, done: !a.done } : a));
        const updated = { ...p, activities };
        if (before < 100 && progressOf(updated) === 100) celebrated = true;
        return updated;
      });
      if (celebrated) setTimeout(fireConfetti, 60);
      return next;
    });
  }, []);

  const addProject = useCallback(
    (p: Project) => {
      setProjects((prev) => [p, ...prev]);
      toast(`Проект «${p.name}» добавлен`);
    },
    [toast]
  );

  const updateProject = useCallback(
    (p: Project) => {
      setProjects((prev) => prev.map((x) => (x.id === p.id ? p : x)));
      toast(`Проект «${p.name}» обновлён`);
    },
    [toast]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => {
        const target = prev.find((p) => p.id === id);
        if (target) toast(`Проект «${target.name}» удалён`, "info");
        return prev.filter((p) => p.id !== id);
      });
      setFavorites((prev) => prev.filter((f) => f !== id));
    },
    [toast]
  );

  const login = useCallback(
    (email: string, password: string): string | null => {
      if (email.trim().toLowerCase() !== admin.email.toLowerCase()) return "Аккаунт с таким Email не найден";
      if (simpleHash(password) !== admin.passwordHash) return "Неверный пароль";
      setIsAdmin(true);
      toast(`Добро пожаловать, ${admin.name}!`);
      return null;
    },
    [admin, toast]
  );

  const logout = useCallback(() => {
    setIsAdmin(false);
    toast("Вы вышли из аккаунта администратора", "info");
  }, [toast]);

  const changePassword = useCallback(
    (current: string, next: string): string | null => {
      if (simpleHash(current) !== admin.passwordHash) return "Текущий пароль указан неверно";
      if (next.length < 6) return "Новый пароль должен быть не короче 6 символов";
      setAdmin((a) => ({ ...a, passwordHash: simpleHash(next) }));
      toast("Пароль успешно изменён");
      return null;
    },
    [admin, toast]
  );

  const requestResetCode = useCallback(
    (email: string): string | null => {
      if (email.trim().toLowerCase() !== admin.email.toLowerCase()) return null;
      return String(Math.floor(100000 + Math.random() * 900000));
    },
    [admin]
  );

  const resetPassword = useCallback(
    (email: string, newPassword: string) => {
      setAdmin((a) => (a.email.toLowerCase() === email.trim().toLowerCase() ? { ...a, passwordHash: simpleHash(newPassword) } : a));
      toast("Новый пароль установлен. Войдите в аккаунт.");
    },
    [toast]
  );

  const performManualReset = useCallback(() => {
    const affected = runReset("manual");
    toast(`Принудительный сброс: обнулено активностей — ${affected}`, affected > 0 ? "success" : "info");
  }, [runReset, toast]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const value = useMemo<StoreValue>(
    () => ({
      projects,
      favorites,
      isAdmin,
      admin,
      resetLog,
      nextReset,
      theme,
      toasts,
      toast,
      toggleFav,
      toggleActivity,
      addProject,
      updateProject,
      deleteProject,
      login,
      logout,
      changePassword,
      requestResetCode,
      resetPassword,
      performManualReset,
      setTheme,
    }),
    [projects, favorites, isAdmin, admin, resetLog, nextReset, theme, toasts, toast, toggleFav, toggleActivity, addProject, updateProject, deleteProject, login, logout, changePassword, requestResetCode, resetPassword, performManualReset, setTheme]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
