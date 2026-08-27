import React, { useState } from 'react';
import { 
  X, 
  Shield, 
  Mail, 
  User, 
  Key, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export function AdminProfileModal() {
  const { user, logout, isProfileModalOpen, setIsProfileModalOpen, changePassword } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isProfileModalOpen || !user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword.trim() || !newPassword.trim()) {
      setErrorMsg('Заполните все обязательные поля');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Пароли не совпадают');
      return;
    }

    setIsSubmitting(true);
    const res = await changePassword(currentPassword.trim(), newPassword.trim());
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Пароль успешно обновлен!');
      showToast('success', 'Пароль изменен', 'Новый пароль сохранен');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } else {
      setErrorMsg(res.error || 'Ошибка при изменении пароля');
    }
  };

  const handleLogout = () => {
    logout();
    showToast('info', 'Вы вышли из системы', 'Панель администратора отключена');
  };

  return (
    <div 
      id="profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={() => setIsProfileModalOpen(false)}
    >
      <div 
        id="profile-modal-container"
        className="relative w-full max-w-md rounded-2xl bg-[#161B22] border border-[#30363D] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363D] bg-[#0D1117]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#238636] to-[#3FB950] flex items-center justify-center text-white shadow-md">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F0F6FC]">
                Профиль Администратора
              </h2>
              <p className="text-[11px] text-[#8B949E]">
                Управление доступом и безопасностью
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Admin Info Card */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1f6feb]/20 border border-[#58A6FF]/40 flex items-center justify-center text-sm font-bold text-[#58A6FF]">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[#F0F6FC]">{user.username}</span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-[#238636]/20 text-[#3FB950] border border-[#238636]/40">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-xs text-[#8B949E] flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-[#8B949E]" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#30363D]/70 text-[11px] text-[#8B949E] flex items-center justify-between">
              <span>Права доступа:</span>
              <span className="text-[#3FB950] font-medium">Создание, ред. и удаление проектов</span>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F0F6FC]">
              <Key className="w-3.5 h-3.5 text-[#58A6FF]" />
              <span>Сменить пароль администратора</span>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-[#F85149]/10 border border-[#F85149]/30 text-xs text-[#F85149] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-lg bg-[#3FB950]/10 border border-[#3FB950]/30 text-xs text-[#3FB950] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#8B949E] mb-1">
                  Текущий пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Текущий пароль"
                    className="w-full px-3 pr-10 py-1.5 bg-[#0D1117] border border-[#30363D] rounded-lg text-xs text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B949E] hover:text-[#F0F6FC]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#8B949E] mb-1">
                  Новый пароль
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 знаков"
                  className="w-full px-3 py-1.5 bg-[#0D1117] border border-[#30363D] rounded-lg text-xs text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#8B949E] mb-1">
                  Повторите новый пароль
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повтор нового пароля"
                  className="w-full px-3 py-1.5 bg-[#0D1117] border border-[#30363D] rounded-lg text-xs text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-xs font-semibold text-[#58A6FF] border border-[#30363D] hover:border-[#58A6FF]/40 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Сохранить новый пароль</span>
                )}
              </button>
            </form>
          </div>

          {/* Logout Button */}
          <div className="pt-2 border-t border-[#30363D]">
            <button
              onClick={handleLogout}
              className="w-full py-2 rounded-xl bg-[#F85149]/10 hover:bg-[#F85149]/20 text-[#F85149] border border-[#F85149]/30 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти из учетной записи Extazik</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
