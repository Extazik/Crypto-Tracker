import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  KeyRound, 
  AlertCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
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
    login 
  } = useAuth();
  const { showToast } = useToast();
  
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
    }
  }, [isLoginModalOpen]);

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
      showToast('success', 'Добро пожаловать!', 'Вы вошли как администратор');
      closeLoginModal();
    } else {
      setLoginError(res.error || 'Неверный логин или пароль');
    }
  };

  const handleClose = () => {
    setLoginError('');
    closeLoginModal();
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={handleClose}
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
                Вход администратора
              </h2>
              <p className="text-[11px] text-[#8B949E]">
                Управление крипто-проектами и активностями
              </p>
            </div>
          </div>

          <button
            id="btn-close-auth-modal"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational notification banner if opened via protected action */}
        {loginModalMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-[#58A6FF]/10 border border-[#58A6FF]/30 flex items-start gap-2.5 text-xs text-[#58A6FF]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{loginModalMessage}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 space-y-4">
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
              <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                Пароль
              </label>
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
        </div>

      </div>
    </div>
  );
}
