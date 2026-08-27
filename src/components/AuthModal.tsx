import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, KeyRound, Lock, LogIn, LogOut, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { useStore } from "../lib/store";
import { Field, Modal, ModalHeader } from "./ui";
import { cx } from "../lib/utils";

type ResetStep = 0 | 1 | 2;

export function AuthModal({ mode, onClose }: { mode: "login" | "profile"; onClose: () => void }) {
  const { admin, login, logout, changePassword, requestResetCode, resetPassword } = useStore();
  const [view, setView] = useState<"login" | "reset">(mode === "profile" ? "login" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /* сброс пароля */
  const [step, setStep] = useState<ResetStep>(0);
  const [sentCode, setSentCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [cooldown, setCooldown] = useState(0);

  /* профиль */
  const [curPw, setCurPw] = useState("");
  const [profNew, setProfNew] = useState("");
  const [profConfirm, setProfConfirm] = useState("");
  const [profErr, setProfErr] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const doLogin = () => {
    const err = login(email, password);
    if (err) setError(err);
    else onClose();
  };

  const sendCode = () => {
    const code = requestResetCode(email);
    if (!code) {
      setError("Аккаунт с таким Email не найден в системе");
      return;
    }
    setError("");
    setSentCode(code);
    setStep(1);
    setCooldown(30);
  };

  const verifyCode = () => {
    if (codeInput !== sentCode) {
      setError("Код не совпадает. Проверьте письмо и попробуйте ещё раз.");
      return;
    }
    setError("");
    setStep(2);
  };

  const finishReset = () => {
    if (newPw.length < 6) return setError("Пароль должен быть не короче 6 символов");
    if (newPw !== confirmPw) return setError("Пароли не совпадают");
    resetPassword(email, newPw);
    onClose();
  };

  const doChangePassword = () => {
    if (profNew !== profConfirm) return setProfErr("Новые пароли не совпадают");
    const err = changePassword(curPw, profNew);
    if (err) return setProfErr(err);
    setProfErr("");
    setCurPw("");
    setProfNew("");
    setProfConfirm("");
  };

  const steps = ["Запрос кода", "Ввод кода", "Новый пароль"];

  return (
    <Modal open onClose={onClose} width="max-w-md">
      <ModalHeader
        onClose={onClose}
        title={mode === "profile" ? "Профиль администратора" : view === "login" ? "Вход для администратора" : "Восстановление пароля"}
        subtitle={mode === "profile" ? "Управление учётной записью" : view === "login" ? "Доступ к управлению проектами" : "Трёхшаговая проверка личности"}
      />

      <div className="px-5 py-5 sm:px-6">
        {mode === "profile" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand/10 p-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-branddark font-display text-base font-extrabold text-white">
                {admin.name.slice(0, 1)}
              </span>
              <div>
                <div className="text-sm font-bold text-txt">{admin.name}</div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-mut">
                  <ShieldCheck size={11} className="text-brand" /> {admin.email}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-raised/50 p-4">
              <h4 className="mb-3 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-wider text-txt">
                <KeyRound size={13} className="text-amber" /> Смена пароля
              </h4>
              <div className="space-y-3">
                <Field label="Текущий пароль">
                  <input type="password" className="input" value={curPw} onChange={(e) => setCurPw(e.target.value)} />
                </Field>
                <Field label="Новый пароль" hint="минимум 6 символов">
                  <input type="password" className="input" value={profNew} onChange={(e) => setProfNew(e.target.value)} />
                </Field>
                <Field label="Повторите новый пароль">
                  <input type="password" className="input" value={profConfirm} onChange={(e) => setProfConfirm(e.target.value)} />
                </Field>
                {profErr && <p className="text-xs font-semibold text-danger">{profErr}</p>}
                <button className="btn-primary w-full justify-center" onClick={doChangePassword} disabled={!curPw || !profNew || !profConfirm}>
                  <Lock size={14} /> Обновить пароль
                </button>
              </div>
            </div>

            <button className="btn-danger w-full justify-center" onClick={() => { logout(); onClose(); }}>
              <LogOut size={14} /> Выйти из аккаунта
            </button>
          </div>
        ) : view === "login" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-raised/50 p-3 text-[11px] leading-relaxed text-mut">
              <span className="font-bold text-amber">Демо-доступ:</span> <span className="font-mono text-txt">admin@droptrack.ru</span> · пароль <span className="font-mono text-txt">admin123</span>
            </div>
            <Field label="Email">
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@droptrack.ru" />
            </Field>
            <Field label="Пароль">
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doLogin()}
                placeholder="••••••••"
              />
            </Field>
            {error && <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">{error}</p>}
            <button className="btn-primary w-full justify-center" onClick={doLogin} disabled={!email || !password}>
              <LogIn size={15} /> Войти в панель
            </button>
            <button className="w-full text-center text-xs font-bold text-sky transition-colors hover:underline" onClick={() => { setView("reset"); setStep(0); setError(""); }}>
              Забыли пароль? Восстановить доступ →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* шаги */}
            <div className="flex items-center gap-1.5">
              {steps.map((s, i) => (
                <div key={s} className="flex-1">
                  <div className={cx("h-1.5 rounded-full transition-colors duration-300", i <= step ? "bg-brand" : "bg-raised border border-line")} />
                  <div className={cx("mt-1.5 text-center text-[9px] font-bold uppercase tracking-wide", i <= step ? "text-brand" : "text-mut")}>{s}</div>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-3.5">
                  <Field label="Email аккаунта">
                    <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@droptrack.ru" />
                  </Field>
                  <p className="text-xs leading-relaxed text-mut">
                    На указанный адрес будет отправлен одноразовый 6-значный код подтверждения.
                  </p>
                  {error && <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">{error}</p>}
                  <button className="btn-primary w-full justify-center" onClick={sendCode} disabled={!email}>
                    <Mail size={14} /> Запросить код
                  </button>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-3.5">
                  {/* симуляция письма */}
                  <div className="rounded-xl border border-amber/40 bg-amber/10 p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                      <Mail size={11} /> Симуляция входящего письма (демо-режим)
                    </div>
                    <div className="text-xs text-mut">От: DropTrack Security &lt;no-reply@droptrack.ru&gt;</div>
                    <div className="mt-2 text-center font-mono text-2xl font-extrabold tracking-[0.4em] text-txt">{sentCode}</div>
                    <div className="mt-1.5 text-center text-[10px] text-mut">Код действителен 10 минут. Никому его не сообщайте.</div>
                  </div>
                  <Field label="Код из письма">
                    <input
                      className="input text-center font-mono text-lg font-extrabold tracking-[0.5em]"
                      maxLength={6}
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                    />
                  </Field>
                  {error && <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">{error}</p>}
                  <div className="flex gap-2">
                    <button className="btn-ghost flex-1 justify-center" onClick={sendCode} disabled={cooldown > 0}>
                      <RefreshCw size={13} className={cooldown > 0 ? "animate-spin" : ""} /> {cooldown > 0 ? `Повторно (${cooldown}с)` : "Отправить снова"}
                    </button>
                    <button className="btn-primary flex-1 justify-center" onClick={verifyCode} disabled={codeInput.length !== 6}>
                      Подтвердить
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-3.5">
                  <div className="flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-bold text-brand">
                    <CheckCircle2 size={14} /> Личность подтверждена — задайте новый пароль
                  </div>
                  <Field label="Новый пароль" hint="минимум 6 символов">
                    <input type="password" className="input" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                  </Field>
                  <Field label="Повторите пароль">
                    <input type="password" className="input" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                  </Field>
                  {error && <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">{error}</p>}
                  <button className="btn-primary w-full justify-center" onClick={finishReset} disabled={!newPw || !confirmPw}>
                    <Lock size={14} /> Установить пароль
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button className="w-full text-center text-xs font-bold text-mut transition-colors hover:text-txt" onClick={() => setView("login")}>
              ← Вернуться ко входу
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
