import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  ExternalLink, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Share2, 
  Plus, 
  Edit3, 
  Trash2, 
  Globe, 
  Flame, 
  Award, 
  Coins, 
  Layers, 
  Check, 
  RotateCcw,
  Sparkles,
  PieChart as PieIcon,
  TrendingUp,
  Download,
  AlertTriangle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import confetti from 'canvas-confetti';
import { 
  Project, 
  Activity, 
  REWARD_STATUS_LABELS, 
  REWARD_TYPE_LABELS, 
  ACTIVITY_TYPE_LABELS 
} from '../types';
import { 
  formatCurrency, 
  formatDate, 
  formatNumber, 
  getProjectProgress, 
  calculateCountdown, 
  calculatePotentialScore,
  exportToICS
} from '../lib/utils';
import { useToast } from './Toast';

interface ProjectDetailsModalProps {
  project: Project | null;
  onClose: () => void;
  onUpdateProject: (updated: Project) => void;
  onDeleteProject: (id: string) => void;
  onOpenEditModal: (project: Project) => void;
}

const PIE_COLORS = ['#58A6FF', '#3FB950', '#F0883E', '#A371F7', '#8B949E'];

export function ProjectDetailsModal({
  project,
  onClose,
  onUpdateProject,
  onDeleteProject,
  onOpenEditModal,
}: ProjectDetailsModalProps) {
  const { showToast } = useToast();
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityType, setNewActivityType] = useState<any>('testnet');
  const [newActivityLink, setNewActivityLink] = useState('');
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const [isDailyReset, setIsDailyReset] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Live countdown state that updates every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!project) return null;

  const progress = getProjectProgress(project);
  const statusInfo = REWARD_STATUS_LABELS[project.reward.status] || REWARD_STATUS_LABELS.potential;
  const potential = calculatePotentialScore(project.potentialFactors, project.investors);

  const regCountdown = calculateCountdown(project.dates.registrationEnd);
  const claimCountdown = calculateCountdown(project.dates.claimEnd);

  // Toggle activity completion
  const handleToggleActivity = async (activityId: string) => {
    try {
      const res = await fetch(`/api/activities/${activityId}/toggle`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        const updatedActivities = project.activities.map((a) =>
          a.id === activityId ? data.data : a
        );
        const updatedProject = { ...project, activities: updatedActivities };
        onUpdateProject(updatedProject);

        if (data.data.isCompleted) {
          showToast('success', 'Задание выполнено!', data.data.name);
          // Check if all completed -> fire confetti!
          const allDone = updatedActivities.every((a) => a.isCompleted);
          if (allDone) {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
            });
            showToast('success', '🎉 Все задания проекта выполнены на 100%!');
          }
        } else {
          showToast('info', 'Статус задания сброшен', data.data.name);
        }
      }
    } catch (err) {
      // Fallback optimistic update
      const updatedActivities = project.activities.map((a) => {
        if (a.id === activityId) {
          const nextCompleted = !a.isCompleted;
          return {
            ...a,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : null,
          };
        }
        return a;
      });
      onUpdateProject({ ...project, activities: updatedActivities });
    }
  };

  // Add new activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName.trim()) return;

    try {
      const res = await fetch(`/api/projects/${project.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newActivityName.trim(),
          type: newActivityType,
          link: newActivityLink.trim(),
          isDailyReset,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateProject({
          ...project,
          activities: [...(project.activities || []), data.data],
        });
        setNewActivityName('');
        setNewActivityLink('');
        setIsDailyReset(false);
        setShowAddActivityForm(false);
        showToast('success', 'Активность добавлена');
      }
    } catch (err) {
      showToast('error', 'Ошибка добавления активности');
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async () => {
    const nextFav = !project.isFavorite;
    try {
      if (nextFav) {
        await fetch(`/api/favorites/${project.id}`, { method: 'POST' });
      } else {
        await fetch(`/api/favorites/${project.id}`, { method: 'DELETE' });
      }
    } catch (e) {}

    onUpdateProject({ ...project, isFavorite: nextFav });
    showToast('info', nextFav ? 'Добавлено в избранное' : 'Удалено из избранного');
  };

  // Share project
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('success', 'Ссылка скопирована в буфер обмена');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Tokenomics Pie Chart Data
  const dist = project.tokenomics?.distribution || { team: 20, investors: 20, community: 40, ecosystem: 10, reserve: 10 };
  const pieData = [
    { name: 'Сообщество / Airdrop', value: dist.community },
    { name: 'Инвесторы', value: dist.investors },
    { name: 'Команда', value: dist.team },
    { name: 'Экосистема', value: dist.ecosystem },
    { name: 'Резерв', value: dist.reserve },
  ].filter((d) => d.value > 0);

  return (
    <div id="project-details-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        id={`project-details-modal-${project.id}`}
        className="relative w-full max-w-4xl bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden text-[#F0F6FC] my-auto flex flex-col max-h-[92vh]"
      >
        
        {/* Modal Top Nav / Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363D] bg-[#0D1117]/80 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#8B949E]">
            <span>Проекты</span>
            <span>/</span>
            <span className="text-[#F0F6FC] font-medium">{project.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#F0F6FC] hover:bg-[#30363D] transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#3FB950]" /> : <Share2 className="w-3.5 h-3.5 text-[#58A6FF]" />}
              <span>{copiedLink ? 'Скопировано!' : 'Поделиться'}</span>
            </button>

            <button
              onClick={() => exportToICS(project)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#F0F6FC] hover:bg-[#30363D] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#8B949E]" />
              <span>.ICS Календарь</span>
            </button>

            <button
              onClick={() => onOpenEditModal(project)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f6feb]/20 border border-[#58A6FF]/40 text-xs text-[#58A6FF] hover:bg-[#1f6feb]/30 transition-colors font-medium"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Редактировать</span>
            </button>

            <button
              onClick={() => {
                if (confirm(`Удалить проект "${project.name}"?`)) {
                  onDeleteProject(project.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F85149] hover:bg-[#F85149]/10 transition-colors"
              title="Удалить проект"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D] transition-colors ml-2"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          
          {/* Header Block: Logo, Titles, Badges, Heart, Claim link */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#0D1117] border border-[#30363D]">
            <div className="flex items-start gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#21262D] border border-[#30363D] shrink-0 flex items-center justify-center">
                <img
                  src={project.logo}
                  alt={project.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="font-bold text-xl text-[#8B949E] uppercase">
                  {project.name.substring(0, 2)}
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-[#F0F6FC]">{project.name}</h1>
                  {project.tokenomics?.ticker && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#21262D] text-[#58A6FF] border border-[#30363D]">
                      ${project.tokenomics.ticker}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded bg-[#21262D] text-[#8B949E] border border-[#30363D]">
                    {project.tokenomics?.blockchain}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#21262D] text-[#8B949E] border border-[#30363D]">
                    {project.category}
                  </span>
                </div>

                {/* Status & Reward types */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border"
                    style={{
                      backgroundColor: statusInfo.bg,
                      borderColor: statusInfo.border,
                      color: statusInfo.color,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: statusInfo.dotColor }}
                    ></span>
                    <span>{statusInfo.label}</span>
                  </div>

                  {project.reward.rewardTypes?.map((t) => {
                    const info = REWARD_TYPE_LABELS[t];
                    return (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-[#21262D] border border-[#30363D] text-xs text-[#F0F6FC] flex items-center gap-1"
                      >
                        <span>{info?.icon}</span>
                        <span>{info?.label.split(' ')[0]}</span>
                      </span>
                    );
                  })}

                  <div className="text-xs font-medium px-2 py-0.5 rounded bg-[#21262D] border border-[#30363D] text-[#8B949E]">
                    Приоритет: <strong className="text-[#F0F6FC]">{project.priority}/10</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite & CTA actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleToggleFavorite}
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all ${
                  project.isFavorite
                    ? 'border-[#D29922] bg-[#D29922]/15 text-[#D29922]'
                    : 'border-[#30363D] bg-[#21262D] text-[#8B949E] hover:text-[#F0F6FC]'
                }`}
              >
                <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-[#D29922]' : ''}`} />
                <span>{project.isFavorite ? 'В избранном' : 'В избранное'}</span>
              </button>

              {project.reward?.claimLink ? (
                <a
                  href={project.reward.claimLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold shadow-lg shadow-[#238636]/20 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Получить награду</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : project.website ? (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold transition-all"
                >
                  <Globe className="w-4 h-4" />
                  <span>Сайт проекта</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}
            </div>
          </div>

          {/* Description & Socials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-2">
              <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">
                О проекте
              </span>
              <p className="text-xs text-[#F0F6FC] leading-relaxed whitespace-pre-wrap">
                {project.description || 'Описание проекта пока не добавлено.'}
              </p>

              {project.reward.expectedAmount && (
                <div className="mt-3 p-2.5 rounded-lg bg-[#58A6FF]/10 border border-[#58A6FF]/20 text-xs text-[#58A6FF] flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  <span>Ожидаемый размер награды: <strong className="text-white">{project.reward.expectedAmount}</strong></span>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
              <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider block">
                Социальные сети
              </span>

              <div className="flex flex-wrap gap-2">
                {project.socials?.twitter && (
                  <a
                    href={project.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#58A6FF] hover:bg-[#30363D] transition-colors flex items-center gap-1.5"
                  >
                    <span>Twitter / X</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {project.socials?.telegram && (
                  <a
                    href={project.socials.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#58A6FF] hover:bg-[#30363D] transition-colors flex items-center gap-1.5"
                  >
                    <span>Telegram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {project.socials?.discord && (
                  <a
                    href={project.socials.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#58A6FF] hover:bg-[#30363D] transition-colors flex items-center gap-1.5"
                  >
                    <span>Discord</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {project.socials?.github && (
                  <a
                    href={project.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#F0F6FC] hover:bg-[#30363D] transition-colors flex items-center gap-1.5"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {project.socials?.medium && (
                  <a
                    href={project.socials.medium}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#8B949E] hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>Medium/Mirror</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {project.socials?.custom?.map((c) => (
                  <a
                    key={c.id}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#8B949E] hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>{c.name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline & Deadlines Block with Live Countdowns */}
          <div className="p-5 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#58A6FF]" />
                Таймлайн и дедлайны
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Registration Start */}
              <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]">
                <div className="text-[11px] text-[#8B949E]">Старт регистрации</div>
                <div className="text-sm font-semibold text-[#F0F6FC] mt-0.5">
                  {formatDate(project.dates?.registrationStart)}
                </div>
              </div>

              {/* Registration End */}
              <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]">
                <div className="text-[11px] text-[#8B949E]">Конец регистрации</div>
                <div className="text-sm font-semibold text-[#F0F6FC] mt-0.5">
                  {formatDate(project.dates?.registrationEnd)}
                </div>
                {regCountdown && !regCountdown.isExpired && (
                  <div className="text-[11px] text-[#F0883E] font-mono mt-1">
                    ⏳ Осталось: {regCountdown.formatted}
                  </div>
                )}
              </div>

              {/* Claim Start */}
              <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]">
                <div className="text-[11px] text-[#8B949E]">Старт клейма</div>
                <div className="text-sm font-semibold text-[#F0F6FC] mt-0.5">
                  {formatDate(project.dates?.claimStart)}
                </div>
              </div>

              {/* Claim End */}
              <div className="p-3 rounded-lg bg-[#161B22] border border-[#30363D]">
                <div className="text-[11px] text-[#8B949E]">Конец клейма</div>
                <div className="text-sm font-semibold text-[#F0F6FC] mt-0.5">
                  {formatDate(project.dates?.claimEnd)}
                </div>
                {claimCountdown && !claimCountdown.isExpired && (
                  <div className="text-[11px] text-[#3FB950] font-mono mt-1">
                    🔥 До дедлайна: {claimCountdown.formatted}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activities Checklist */}
          <div className="p-5 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3FB950]" />
                  Активности и задания ({progress.completed}/{progress.total})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#3FB950] font-bold">
                  {progress.percent}% выполнено
                </span>
                <button
                  onClick={() => setShowAddActivityForm(!showAddActivityForm)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-[#21262D] text-[#58A6FF] border border-[#30363D] hover:bg-[#30363D]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить</span>
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#21262D] h-2.5 rounded-full overflow-hidden border border-[#30363D]">
              <div
                className="bg-[#3FB950] h-full rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              ></div>
            </div>

            {/* Add Activity Inline Form */}
            {showAddActivityForm && (
              <form onSubmit={handleAddActivity} className="p-3 rounded-lg bg-[#161B22] border border-[#58A6FF]/40 space-y-3">
                <div className="text-xs font-semibold text-[#58A6FF]">Новая активность</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Название (например: Своп на DEX)"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 text-xs rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                    required
                  />
                  <select
                    value={newActivityType}
                    onChange={(e) => setNewActivityType(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                  >
                    {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    placeholder="Ссылка на активность (https://...)"
                    value={newActivityLink}
                    onChange={(e) => setNewActivityLink(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-[#8B949E] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDailyReset}
                      onChange={(e) => setIsDailyReset(e.target.checked)}
                      className="rounded bg-[#0D1117] border-[#30363D] text-[#58A6FF]"
                    />
                    <span>Сброс в 03:00</span>
                  </label>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-[#238636] hover:bg-[#2ea043] text-white"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            )}

            {/* Activities List */}
            <div className="space-y-2">
              {(project.activities || []).length === 0 ? (
                <div className="text-center py-6 text-xs text-[#8B949E]">
                  Нет активностей. Нажмите "+ Добавить", чтобы создать первую.
                </div>
              ) : (
                project.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors ${
                      activity.isCompleted
                        ? 'border-[#3FB950]/30 bg-[#3FB950]/5'
                        : 'border-[#30363D] bg-[#161B22] hover:border-[#484F58]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleActivity(activity.id)}
                        className={`mt-0.5 p-1 rounded transition-colors ${
                          activity.isCompleted
                            ? 'text-[#3FB950]'
                            : 'text-[#8B949E] hover:text-[#F0F6FC]'
                        }`}
                      >
                        {activity.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 fill-[#3FB950]/20" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs font-medium ${
                              activity.isCompleted ? 'text-[#8B949E] line-through' : 'text-[#F0F6FC]'
                            }`}
                          >
                            {activity.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#21262D] text-[#8B949E] border border-[#30363D]">
                            {ACTIVITY_TYPE_LABELS[activity.type] || activity.type}
                          </span>
                          {activity.isDailyReset && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0883E]/15 text-[#F0883E] border border-[#F0883E]/30 flex items-center gap-1">
                              <RotateCcw className="w-2.5 h-2.5" />
                              03:00 МСК
                            </span>
                          )}
                        </div>

                        {activity.description && (
                          <p className="text-[11px] text-[#8B949E] mt-1">
                            {activity.description}
                          </p>
                        )}

                        {activity.isCompleted && activity.completedAt && (
                          <div className="text-[10px] text-[#3FB950] mt-1 font-mono">
                            ✓ Выполнено: {formatDate(activity.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    {activity.link && (
                      <a
                        href={activity.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded bg-[#21262D] border border-[#30363D] text-[11px] text-[#58A6FF] hover:bg-[#30363D] transition-colors flex items-center gap-1 shrink-0"
                      >
                        <span>Перейти</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Investors & Funds */}
          <div className="p-5 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#58A6FF]" />
              Фонды и инвесторы ({project.investors?.length || 0})
            </span>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#30363D] text-[#8B949E]">
                    <th className="pb-2 font-medium">Фонд / Инвестор</th>
                    <th className="pb-2 font-medium">Тир</th>
                    <th className="pb-2 font-medium">Сумма инвестиций</th>
                    <th className="pb-2 font-medium">Дата раунда</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363D]/50 text-[#F0F6FC]">
                  {(project.investors || []).map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#161B22]">
                      <td className="py-2.5 font-medium">{inv.name}</td>
                      <td className="py-2.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            inv.tier === 'Tier 1'
                              ? 'bg-[#1f6feb]/20 text-[#58A6FF] border border-[#58A6FF]/40'
                              : 'bg-[#21262D] text-[#8B949E] border border-[#30363D]'
                          }`}
                        >
                          {inv.tier}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[#3FB950]">
                        {inv.amount ? formatCurrency(inv.amount) : 'Не раскрыто'}
                      </td>
                      <td className="py-2.5 text-[#8B949E]">{formatDate(inv.roundDate)}</td>
                    </tr>
                  ))}
                  {(!project.investors || project.investors.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[#8B949E]">
                        Информация об инвесторах не указана
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tokenomics & Potential Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Tokenomics Breakdown */}
            <div className="p-5 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
              <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-[#58A6FF]" />
                Токеномика и распределение
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-[#161B22] border border-[#30363D]">
                  <div className="text-[#8B949E] text-[10px]">Тикер токена</div>
                  <div className="font-mono font-bold text-[#58A6FF]">{project.tokenomics?.ticker || '—'}</div>
                </div>
                <div className="p-2.5 rounded bg-[#161B22] border border-[#30363D]">
                  <div className="text-[#8B949E] text-[10px]">Total Supply</div>
                  <div className="font-mono text-[#F0F6FC]">
                    {project.tokenomics?.totalSupply ? formatNumber(project.tokenomics.totalSupply) : '—'}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#161B22] border border-[#30363D]">
                  <div className="text-[#8B949E] text-[10px]">Блокчейн</div>
                  <div className="font-medium text-[#F0F6FC]">{project.tokenomics?.blockchain || '—'}</div>
                </div>
                <div className="p-2.5 rounded bg-[#161B22] border border-[#30363D]">
                  <div className="text-[#8B949E] text-[10px]">Стандарт токена</div>
                  <div className="font-medium text-[#F0F6FC]">{project.tokenomics?.tokenStandard || '—'}</div>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="h-48 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', borderRadius: '8px', color: '#F0F6FC', fontSize: '11px' }}
                      formatter={(val: any) => [`${val}%`, 'Доля']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '10px', color: '#8B949E' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Potential & Difficulty Evaluation */}
            <div className="p-5 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-4">
              <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#3FB950]" />
                Оценка потенциала и сложности
              </span>

              {/* Potential Score Result */}
              <div className="p-3 rounded-xl bg-[#161B22] border border-[#30363D] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#8B949E]">Итоговый потенциал</div>
                  <div className="text-base font-bold mt-0.5" style={{ color: potential.color }}>
                    {potential.label} ({potential.score}/7 баллов)
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-base" style={{ borderColor: potential.color, color: potential.color }}>
                  {potential.score}
                </div>
              </div>

              {/* Potential Criteria Checklist */}
              <div className="space-y-1.5 text-xs text-[#8B949E]">
                <div className="flex items-center justify-between">
                  <span>Tier 1 Инвесторы (+2):</span>
                  <span className={project.potentialFactors?.tier1Investors || project.investors.some(i => i.tier === 'Tier 1') ? 'text-[#3FB950]' : 'text-[#8B949E]'}>
                    {project.potentialFactors?.tier1Investors || project.investors.some(i => i.tier === 'Tier 1') ? '✓ Да' : '✗ Нет'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Инвестиции &gt; $10M (+2):</span>
                  <span className={project.potentialFactors?.over10mRaised || project.investors.reduce((s, i) => s + (i.amount || 0), 0) >= 10000000 ? 'text-[#3FB950]' : 'text-[#8B949E]'}>
                    {project.potentialFactors?.over10mRaised || project.investors.reduce((s, i) => s + (i.amount || 0), 0) >= 10000000 ? '✓ Да' : '✗ Нет'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Известная команда (+1):</span>
                  <span className={project.potentialFactors?.famousTeam ? 'text-[#3FB950]' : 'text-[#8B949E]'}>
                    {project.potentialFactors?.famousTeam ? '✓ Да' : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Работающий продукт (+1):</span>
                  <span className={project.potentialFactors?.workingProduct ? 'text-[#3FB950]' : 'text-[#8B949E]'}>
                    {project.potentialFactors?.workingProduct ? '✓ Да' : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Активное сообщество (+1):</span>
                  <span className={project.potentialFactors?.activeCommunity ? 'text-[#3FB950]' : 'text-[#8B949E]'}>
                    {project.potentialFactors?.activeCommunity ? '✓ Да' : '—'}
                  </span>
                </div>
              </div>

              {/* Difficulty 1-5 */}
              <div className="pt-2 border-t border-[#30363D]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#8B949E]">Сложность выполнения:</span>
                  <span className="font-semibold text-[#F0F6FC]">{project.difficulty}/5</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-2 flex-1 rounded-full ${
                        lvl <= project.difficulty
                          ? project.difficulty >= 4
                            ? 'bg-[#F85149]'
                            : project.difficulty >= 3
                            ? 'bg-[#F0883E]'
                            : 'bg-[#3FB950]'
                          : 'bg-[#21262D]'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#30363D] bg-[#0D1117]/80 flex items-center justify-between text-xs text-[#8B949E] shrink-0">
          <span>ID: {project.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#21262D] text-[#F0F6FC] hover:bg-[#30363D] transition-colors font-medium"
          >
            Вернуться к списку
          </button>
        </div>

      </div>
    </div>
  );
}
