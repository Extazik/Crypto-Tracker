import { useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Sparkles,
  Zap
} from 'lucide-react';
import { Project, ResetLog } from '../types';
import { formatDate } from '../lib/utils';
import { useToast } from './Toast';

interface DailyResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onTriggerResetSuccess: (updatedProjects: Project[]) => void;
}

export function DailyResetModal({
  isOpen,
  onClose,
  projects,
  onTriggerResetSuccess,
}: DailyResetModalProps) {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ResetLog[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [nextResetCountdown, setNextResetCountdown] = useState('');

  // Fetch reset logs
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/reset-logs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLogs(data.data || []);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Calculate remaining time until next 03:00 MSK (UTC+3)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Current UTC time
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      // MSK is UTC+3
      const mskNow = new Date(utc + 3600000 * 3);

      const target = new Date(mskNow);
      target.setHours(3, 0, 0, 0);

      // If already past 03:00 MSK today, next reset is tomorrow 03:00 MSK
      if (mskNow.getTime() >= target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - mskNow.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setNextResetCountdown(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  // Trigger manual reset
  const handleManualReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset-daily-progress', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Сброс выполнен успешно!', `Сброшено заданий: ${data.resetCount}`);
        // Fetch updated projects
        const projRes = await fetch('/api/projects');
        const projData = await projRes.json();
        if (projData.success) {
          onTriggerResetSuccess(projData.data);
        }

        // Refresh logs
        const logRes = await fetch('/api/reset-logs');
        const logData = await logRes.json();
        if (logData.success) {
          setLogs(logData.data);
        }
      }
    } catch (err) {
      showToast('error', 'Ошибка при сбросе заданий');
    } finally {
      setIsResetting(false);
    }
  };

  // Find all daily-reset activities
  const dailyActivities: { project: Project; activity: any }[] = [];
  projects.forEach((p) => {
    p.activities?.forEach((a) => {
      if (a.isDailyReset) {
        dailyActivities.push({ project: p, activity: a });
      }
    });
  });

  return (
    <div id="daily-reset-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        id="daily-reset-modal"
        className="relative w-full max-w-2xl bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden text-[#F0F6FC] my-auto flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363D] bg-[#0D1117] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F0883E]/20 border border-[#F0883E]/40 flex items-center justify-center text-[#F0883E]">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F0F6FC]">
                Ежедневный сброс заданий (03:00 МСК)
              </h2>
              <p className="text-xs text-[#8B949E]">
                Автоматическое обнуление чекбоксов регулярных активностей
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          
          {/* Next reset banner */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-[#8B949E] text-xs">До следующего сброса по расписанию:</div>
              <div className="text-2xl font-mono font-bold text-[#F0883E] mt-0.5">
                {nextResetCountdown || '00:00:00'}
              </div>
              <div className="text-[11px] text-[#8B949E] mt-1">
                Таймзона: <strong>MSK (UTC+3)</strong> • Каждые сутки в 03:00
              </div>
            </div>

            <button
              onClick={handleManualReset}
              disabled={isResetting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold transition-all disabled:opacity-50 shadow-md shadow-[#1f6feb]/20"
            >
              <Zap className="w-4 h-4" />
              <span>{isResetting ? 'Сброс...' : 'Сбросить сейчас'}</span>
            </button>
          </div>

          {/* Daily Tasks List */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider block">
              Ежедневные активности с автосбросом ({dailyActivities.length})
            </span>

            {dailyActivities.length === 0 ? (
              <div className="text-center py-4 text-[#8B949E]">
                Нет активностей с включенным флагом "Сброс в 03:00". Включите этот пункт в настройках активности проекта.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {dailyActivities.map(({ project, activity }) => (
                  <div
                    key={`${project.id}-${activity.id}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#161B22] border border-[#30363D]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#F0F6FC]">{project.name}:</span>
                      <span className="text-[#8B949E]">{activity.name}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        activity.isCompleted
                          ? 'bg-[#3FB950]/20 text-[#3FB950] border border-[#3FB950]/40'
                          : 'bg-[#21262D] text-[#8B949E]'
                      }`}
                    >
                      {activity.isCompleted ? 'Выполнено сегодня' : 'Ожидает выполнения'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset History Logs */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Журнал последних сбросов ({logs.length})
            </span>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#161B22] border border-[#30363D] text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3FB950]"></span>
                    <span className="font-mono text-[#F0F6FC]">
                      {new Date(log.timestamp).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} (MSK)
                    </span>
                    <span className="text-[#8B949E]">
                      • {log.triggeredBy === 'cron' ? 'Автоматически (cron)' : 'Вручную'}
                    </span>
                  </div>
                  <span className="text-[#3FB950] font-semibold">
                    +{log.resetActivitiesCount} сброшено
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-2 text-[#8B949E]">
                  Журнал сбросов пуст
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#30363D] bg-[#0D1117] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#21262D] text-[#F0F6FC] hover:bg-[#30363D] transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
}
