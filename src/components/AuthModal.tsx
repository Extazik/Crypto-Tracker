import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export function AuthModal() {
  const { 
    isLoginModalOpen, 
    loginModalMessage, 
    closeLoginModal, 
    login, 
    requestPasswordReset, 
    confirmPasswordReset 
  } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  
  // Login Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset inputs whenever the modal is opened
  React.useEffect(() => {
    if (isLoginModalOpen) {
      setIdentifier('');
      setPassword('');
      setLoginError('');
      setShowPassword(false);
      setRecoveryEmail('');
      setRecoveryCode('');
      setNewPassword('');
      setConfirmPassword('');
      setRecoveryError('');
      setRecoverySuccess('');
      setMode('login');
      setRecoveryStep(1);
    }
  }, [isLoginModalOpen]);

  // Recovery Form State (3 steps)
  // step 1: enter email/username
  // step 2: enter 6-digit code
  // step 3: enter new password
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [generatedCodeHint, setGeneratedCodeHint] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  if (!isLoginModalOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!identifier.trim() || !password.trim()) {
      setLoginError('Пожалуйста, заполните логин и пароль');
      return;
    }

    setIsSubmitting(true);
    const res = await login(identifier.trim(), password.trim());
    setIsSubmitting(false);

    if (res.success) {
      showToast('success', 'Добро пожаловать!', 'Вы вошли как администратор Extazik');
    } else {
      setLoginError(res.error || 'Неверный логин или пароль');
    }
  };

  // Step 1: Send Reset Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (!recoveryEmail.trim()) {
      setRecoveryError('Введите ваш Email или логин администратора');
      return;
    }

    setIsSubmitting(true);
    const res = await requestPasswordReset(recoveryEmail.trim());
    setIsSubmitting(false);

    if (res.success) {
      if (res.email) setRecoveryEmail(res.email);
      if (res.code) {
        setGeneratedCodeHint(res.code);
        setRecoveryCode('');
      }
      setRecoveryStep(2);
      showToast('info', 'Код сброса отправлен', `Проверьте почту ${res.email || recoveryEmail}`);
    } else {
      setRecoveryError(res.error || 'Не удалось найти администратора с такими данными');
    }
  };

  // Step 2: Verify Code
  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (!recoveryCode.trim() || recoveryCode.trim().length !== 6) {
      setRecoveryError('Введите 6-значный цифровой код');
      return;
    }
    setRecoveryStep(3);
  };

  // Step 3: Set New Password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!newPassword.trim() || newPassword.length < 6) {
      setRecoveryError('Новый пароль должен быть не менее 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryError('Пароли не совпадают');
      return;
    }

    setIsSubmitting(true);
    const res = await confirmPasswordReset(recoveryEmail.trim(), recoveryCode.trim(), newPassword.trim());
    setIsSubmitting(false);

    if (res.success) {
      setRecoverySuccess('Пароль успешно обновлен! Вы авторизованы.');
      showToast('success', 'Пароль успешно изменен', 'Вход выполнен автоматически');
      setTimeout(() => {
        closeLoginModal();
        setMode('login');
        setRecoveryStep(1);
        setRecoverySuccess('');
      }, 1800);
    } else {
      setRecoveryError(res.error || 'Ошибка сброса пароля');
    }
  };

  const handleResetModalState = () => {
    setMode('login');
    setRecoveryStep(1);
    setLoginError('');
    setRecoveryError('');
    setRecoverySuccess('');
    closeLoginModal();
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={handleResetModalState}
    >
      <div 
        id="auth-modal-container"
        className="relative w-full max-w-md rounded-2xl bg-[#161B22] border border-[#30363D] shadow-2xl overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363D] bg-[#0D1117]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1f6feb] to-[#58A6FF] flex items-center justify-center text-white shadow-md shadow-[#58A6FF]/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F0F6FC]">
                {mode === 'login' ? 'Вход администратора' : 'Восстановление пароля'}
              </h2>
              <p className="text-[11px] text-[#8B949E]">
                {mode === 'login' ? 'Управление крипто-проектами' : 'Сброс доступа к аккаунту'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-auth-modal"
            onClick={handleResetModalState}
            className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational notification banner if opened via protected action */}
        {loginModalMessage && mode === 'login' && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-[#58A6FF]/10 border border-[#58A6FF]/30 flex items-start gap-2.5 text-xs text-[#58A6FF]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{loginModalMessage}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center border-b border-[#30363D] px-6 pt-2 bg-[#161B22]">
          <button
            id="tab-auth-login"
            onClick={() => {
              setMode('login');
              setLoginError('');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              mode === 'login'
                ? 'border-[#58A6FF] text-[#58A6FF]'
                : 'border-transparent text-[#8B949E] hover:text-[#F0F6FC]'
            }`}
          >
            Вход в систему
          </button>
          <button
            id="tab-auth-forgot"
            onClick={() => {
              setMode('forgot');
              setRecoveryError('');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              mode === 'forgot'
                ? 'border-[#58A6FF] text-[#58A6FF]'
                : 'border-transparent text-[#8B949E] hover:text-[#F0F6FC]'
            }`}
          >
            Восстановление пароля
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          
          {/* ================= MODE: LOGIN ================= */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              
              {loginError && (
                <div className="p-3 rounded-xl bg-[#F85149]/10 border border-[#F85149]/30 text-xs text-[#F85149] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Identifier input (Login or Email) */}
              <div>
                <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                  Логин или Email администратора
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B949E]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-login"
                    type="text"
                    required
                    autoComplete="off"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Логин или Email"
                    className="w-full pl-9 pr-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]"
                  />
                </div>
              </div>

              {/* Password input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#8B949E]">
                    Пароль
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setRecoveryStep(1);
                    }}
                    className="text-[11px] text-[#58A6FF] hover:underline"
                  >
                    Забыли пароль?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B949E]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    className="w-full pl-9 pr-10 py-2 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B949E] hover:text-[#F0F6FC]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1f6feb] to-[#58A6FF] text-white text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1f6feb]/25 disabled:opacity-50 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Войти как Администратор</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= MODE: FORGOT / RESET ================= */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              
              {/* Progress Steps Indicators */}
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${recoveryStep >= 1 ? 'bg-[#58A6FF] text-white' : 'bg-[#21262D] text-[#8B949E]'}`}>
                    1
                  </span>
                  <span className="text-xs text-[#8B949E]">Почта</span>
                </div>
                <div className="h-[1px] w-8 bg-[#30363D]" />
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${recoveryStep >= 2 ? 'bg-[#58A6FF] text-white' : 'bg-[#21262D] text-[#8B949E]'}`}>
                    2
                  </span>
                  <span className="text-xs text-[#8B949E]">Код</span>
                </div>
                <div className="h-[1px] w-8 bg-[#30363D]" />
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${recoveryStep >= 3 ? 'bg-[#58A6FF] text-white' : 'bg-[#21262D] text-[#8B949E]'}`}>
                    3
                  </span>
                  <span className="text-xs text-[#8B949E]">Новый пароль</span>
                </div>
              </div>

              {recoveryError && (
                <div className="p-3 rounded-xl bg-[#F85149]/10 border border-[#F85149]/30 text-xs text-[#F85149] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoverySuccess && (
                <div className="p-3 rounded-xl bg-[#3FB950]/10 border border-[#3FB950]/30 text-xs text-[#3FB950] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{recoverySuccess}</span>
                </div>
              )}

              {/* STEP 1: Enter email/login */}
              {recoveryStep === 1 && (
                <form onSubmit={handleRequestCode} className="space-y-4" autoComplete="off">
                  <p className="text-xs text-[#8B949E]">
                    Укажите ваш email или логин администратора для получения 6-значного кода восстановления.
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                      Электронная почта или логин
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B949E]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="input-recovery-email"
                        type="text"
                        required
                        autoComplete="off"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="email@example.com или логин"
                        className="w-full pl-9 pr-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-request-reset-code"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Отправить код восстановления</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter 6-digit code */}
              {recoveryStep === 2 && (
                <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
                  <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] text-xs text-[#8B949E] space-y-2">
                    <div>
                      Код подтверждения отправлен на <span className="text-[#58A6FF] font-mono">{recoveryEmail}</span>
                    </div>
                    {generatedCodeHint && (
                      <div className="flex items-center justify-between pt-1 border-t border-[#30363D]/80">
                        <span className="text-[11px] text-[#3FB950]">Тестовый код из письма:</span>
                        <span className="px-2 py-0.5 rounded bg-[#0D1117] font-mono font-bold text-xs text-[#3FB950] border border-[#3FB950]/30">
                          {generatedCodeHint}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                      6-значный код подтверждения
                    </label>
                    <input
                      id="input-recovery-code"
                      type="text"
                      maxLength={6}
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full py-2 px-3 text-center tracking-[0.5em] font-mono text-base font-bold bg-[#0D1117] border border-[#30363D] rounded-xl text-[#58A6FF] focus:outline-none focus:border-[#58A6FF]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep(1)}
                      className="w-1/3 py-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-xs text-[#8B949E] transition-colors"
                    >
                      Назад
                    </button>
                    <button
                      id="btn-verify-recovery-code"
                      type="submit"
                      className="w-2/3 py-2 rounded-xl bg-[#58A6FF] hover:bg-[#1f6feb] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Подтвердить код</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Enter new password */}
              {recoveryStep === 3 && (
                <form onSubmit={handleSetNewPassword} className="space-y-4">
                  <p className="text-xs text-[#8B949E]">
                    Придумайте новый пароль для учетной записи <strong className="text-[#F0F6FC]">Extazik</strong> (минимум 6 символов).
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                      Новый пароль
                    </label>
                    <div className="relative">
                      <input
                        id="input-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Минимум 6 символов"
                        className="w-full px-3 pr-10 py-2 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B949E] hover:text-[#F0F6FC]"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                      Подтверждение нового пароля
                    </label>
                    <input
                      id="input-confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите новый пароль"
                      className="w-full px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                    />
                  </div>

                  <button
                    id="btn-save-new-password"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Сохранить новый пароль и войти</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Back to Login link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setRecoveryStep(1);
                    setRecoveryError('');
                  }}
                  className="text-xs text-[#8B949E] hover:text-[#58A6FF] transition-colors"
                >
                  Вернуться ко входу
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
