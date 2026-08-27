import { useState, useEffect } from 'react';
import { 
  Coins, 
  Calendar, 
  BarChart3, 
  RotateCcw, 
  Plus, 
  Download, 
  Bell, 
  Clock, 
  Star, 
  CheckCircle2, 
  Flame,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Project } from '../types';
import { getProjectProgress, calculateCountdown, formatDate } from '../lib/utils';

interface NavbarProps {
  activeTab: 'projects' | 'calendar' | 'stats' | 'reset-logs';
  setActiveTab: (tab: 'projects' | 'calendar' | 'stats' | 'reset-logs') => void;
  projects: Project[];
  onOpenAddModal: () => void;
  onOpenResetModal: () => void;
  onExportCSV: () => void;
  onSelectProject: (project: Project) => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  projects,
  onOpenAddModal,
  onOpenResetModal,
  onExportCSV,
  onSelectProject,
}: NavbarProps) {
  const [mskTime, setMskTime] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Live MSK clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ru-RU', {
        timeZone: 'Europe/Moscow',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setMskTime(timeStr + ' МСК');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Stats calculation
  const totalProjects = projects.length;
  const favoriteCount = projects.filter((p) => p.isFavorite).length;
  const activeCount = projects.filter(
    (p) => p.reward.status === 'registration' || p.reward.status === 'claiming' || p.reward.status === 'confirmed'
  ).length;

  let totalTasks = 0;
  let completedTasks = 0;
  projects.forEach((p) => {
    const prog = getProjectProgress(p);
    totalTasks += prog.total;
    completedTasks += prog.completed;
  });
  const overallPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Find critical deadlines for notifications
  const deadlineAlerts = projects
    .map((p) => {
      const regCd = calculateCountdown(p.dates?.registrationEnd);
      const claimCd = calculateCountdown(p.dates?.claimEnd);

      const alerts: { project: Project; type: 'reg_end' | 'claim_end'; text: string; urgent: boolean }[] = [];

      if (regCd && !regCd.isExpired && regCd.days <= 7) {
        alerts.push({
          project: p,
          type: 'reg_end',
          text: `Конец регистрации через ${regCd.formatted}`,
          urgent: regCd.days <= 2,
        });
      }

      if (claimCd && !claimCd.isExpired && claimCd.days <= 3) {
        alerts.push({
          project: p,
          type: 'claim_end',
          text: `Завершение клейма через ${claimCd.formatted}!`,
          urgent: true,
        });
      }

      return alerts;
    })
    .flat();

  return (
    <header id="main-header" className="sticky top-0 z-40 border-b border-[#30363D] bg-[#0D1117]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1f6feb] to-[#58A6FF] flex items-center justify-center shadow-lg shadow-[#58A6FF]/20 border border-[#58A6FF]/30">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-[#F0F6FC] tracking-tight">
                  Airdrop<span className="text-[#58A6FF]">Tracker</span>
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#21262D] text-[#58A6FF] border border-[#30363D]">
                  PRO
                </span>
              </div>
              <div className="text-[11px] text-[#8B949E] hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse"></span>
                <span>Трекер крипто-активностей</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#161B22] p-1 rounded-xl border border-[#30363D]">
            <button
              id="tab-projects"
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'projects'
                  ? 'bg-[#21262D] text-[#58A6FF] shadow-sm'
                  : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D]/50'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Проекты ({totalProjects})</span>
            </button>

            <button
              id="tab-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-[#21262D] text-[#58A6FF] shadow-sm'
                  : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D]/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Календарь</span>
            </button>

            <button
              id="tab-stats"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'stats'
                  ? 'bg-[#21262D] text-[#58A6FF] shadow-sm'
                  : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D]/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Аналитика</span>
            </button>

            <button
              id="tab-reset-logs"
              onClick={() => setActiveTab('reset-logs')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'reset-logs'
                  ? 'bg-[#21262D] text-[#F0883E] shadow-sm'
                  : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D]/50'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-[#F0883E]" />
              <span>Сброс 03:00</span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Live MSK Clock pill */}
            <div 
              onClick={onOpenResetModal}
              title="Нажмите для управления сбросом заданий в 03:00 МСК"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161B22] border border-[#30363D] text-[11px] text-[#8B949E] hover:border-[#58A6FF]/40 cursor-pointer transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-[#58A6FF]" />
              <span className="font-mono text-[#F0F6FC]">{mskTime || '00:00:00 МСК'}</span>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                id="btn-notifications"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-[#161B22] border border-[#30363D] text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#484F58] transition-colors"
                aria-label="Уведомления о дедлайнах"
              >
                <Bell className="w-4 h-4" />
                {deadlineAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F0883E] text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {deadlineAlerts.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#30363D] bg-[#161B22] shadow-2xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-[#30363D] mb-2">
                    <span className="text-xs font-semibold text-[#F0F6FC] flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#F0883E]" />
                      Срочные дедлайны ({deadlineAlerts.length})
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] text-[#8B949E] hover:text-white"
                    >
                      Закрыть
                    </button>
                  </div>

                  {deadlineAlerts.length === 0 ? (
                    <div className="py-4 text-center text-xs text-[#8B949E]">
                      Нет горящих дедлайнов на ближайшие 7 дней
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {deadlineAlerts.map((alert, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setShowNotifications(false);
                            onSelectProject(alert.project);
                          }}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            alert.urgent
                              ? 'border-[#F85149]/40 bg-[#F85149]/10 hover:bg-[#F85149]/20'
                              : 'border-[#F0883E]/40 bg-[#F0883E]/10 hover:bg-[#F0883E]/20'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-medium text-[#F0F6FC]">
                            <span>{alert.project.name}</span>
                            <span className="text-[10px] text-[#8B949E]">{alert.project.tokenomics.blockchain}</span>
                          </div>
                          <div className="text-[11px] text-[#F0883E] mt-0.5 font-medium">
                            {alert.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export CSV Button */}
            <button
              id="btn-export-csv"
              onClick={onExportCSV}
              title="Экспорт проектов в CSV"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-[#161B22] border border-[#30363D] text-[#F0F6FC] hover:bg-[#21262D] hover:border-[#484F58] transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#8B949E]" />
              <span>Экспорт CSV</span>
            </button>

            {/* Add Project Admin Button */}
            <button
              id="btn-add-project"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить проект</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-[#30363D]/60 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 ${
              activeTab === 'projects' ? 'bg-[#21262D] text-[#58A6FF]' : 'text-[#8B949E]'
            }`}
          >
            Проекты ({totalProjects})
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 ${
              activeTab === 'calendar' ? 'bg-[#21262D] text-[#58A6FF]' : 'text-[#8B949E]'
            }`}
          >
            Календарь
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 ${
              activeTab === 'stats' ? 'bg-[#21262D] text-[#58A6FF]' : 'text-[#8B949E]'
            }`}
          >
            Аналитика
          </button>
          <button
            onClick={() => setActiveTab('reset-logs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 ${
              activeTab === 'reset-logs' ? 'bg-[#21262D] text-[#F0883E]' : 'text-[#8B949E]'
            }`}
          >
            Сброс 03:00
          </button>
        </div>

        {/* Quick summary stats bar */}
        <div className="hidden sm:flex items-center justify-between py-2 border-t border-[#30363D]/50 text-xs text-[#8B949E]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#58A6FF]"></span>
              Всего проектов: <strong className="text-[#F0F6FC]">{totalProjects}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3FB950]"></span>
              Активные: <strong className="text-[#F0F6FC]">{activeCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#D29922] fill-[#D29922]" />
              В избранном: <strong className="text-[#F0F6FC]">{favoriteCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3FB950]" />
              Выполнено заданий: <strong className="text-[#F0F6FC]">{completedTasks}/{totalTasks}</strong>
            </span>
            <div className="w-24 bg-[#21262D] h-2 rounded-full overflow-hidden border border-[#30363D]">
              <div
                className="bg-gradient-to-r from-[#2ea043] to-[#3FB950] h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPercent}%` }}
              ></div>
            </div>
            <span className="font-mono text-[#3FB950] font-semibold">{overallPercent}%</span>
          </div>
        </div>

      </div>
    </header>
  );
}
