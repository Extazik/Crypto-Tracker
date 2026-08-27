import React from 'react';
import { motion } from 'motion/react';
import { 
  Star, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  ChevronRight, 
  Flame,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';
import { Project, REWARD_STATUS_LABELS, REWARD_TYPE_LABELS } from '../types';
import { getProjectProgress, calculateCountdown, calculatePotentialScore } from '../lib/utils';

interface ProjectCardProps {
  key?: string | number;
  project: Project;
  onSelect: (project: Project) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onQuickToggleActivity?: (activityId: string, e: React.MouseEvent) => void;
}

export function ProjectCard({
  project,
  onSelect,
  onToggleFavorite,
  onQuickToggleActivity,
}: ProjectCardProps) {
  const progress = getProjectProgress(project);
  const statusInfo = REWARD_STATUS_LABELS[project.reward.status] || REWARD_STATUS_LABELS.potential;
  const potential = calculatePotentialScore(project.potentialFactors, project.investors);

  // Active countdown check
  const regCountdown = calculateCountdown(project.dates.registrationEnd);
  const claimCountdown = calculateCountdown(project.dates.claimEnd);

  let activeCountdown = null;
  let countdownLabel = '';

  if (project.reward.status === 'claiming' && claimCountdown && !claimCountdown.isExpired) {
    activeCountdown = claimCountdown;
    countdownLabel = 'Клейм до:';
  } else if (project.reward.status === 'registration' && regCountdown && !regCountdown.isExpired) {
    activeCountdown = regCountdown;
    countdownLabel = 'Конец рег:';
  } else if (claimCountdown && !claimCountdown.isExpired) {
    activeCountdown = claimCountdown;
    countdownLabel = 'Дедлайн:';
  }

  // Tier 1 investors
  const tier1Investors = (project.investors || []).filter((i) => i.tier === 'Tier 1');

  return (
    <motion.div
      id={`project-card-${project.id}`}
      onClick={() => onSelect(project)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ 
        y: -6, 
        scale: 1.018,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative flex flex-col justify-between rounded-2xl bg-[#161B22]/95 backdrop-blur-sm border border-[#30363D] hover:border-[#58A6FF]/60 p-5 transition-colors duration-300 hover:shadow-2xl hover:shadow-[#58A6FF]/10 cursor-pointer select-none overflow-hidden"
    >
      {/* Subtle top ambient glow gradient on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#58A6FF]/0 group-hover:via-[#58A6FF]/60 to-transparent transition-all duration-500 opacity-0 group-hover:opacity-100" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#58A6FF]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#58A6FF]/12 transition-all duration-500" />

      <div>
        {/* Card Header: Logo, Name, Favorite & Priority */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#21262D] border border-[#30363D] group-hover:border-[#58A6FF]/40 transition-colors shrink-0 flex items-center justify-center shadow-inner">
              <img
                src={project.logo}
                alt={project.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-bold text-lg text-[#8B949E] uppercase">
                {project.name.substring(0, 2)}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-[#F0F6FC] group-hover:text-[#58A6FF] transition-colors leading-tight">
                  {project.name}
                </h3>
                {project.tokenomics?.ticker && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#21262D] text-[#8B949E] border border-[#30363D]">
                    ${project.tokenomics.ticker}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#8B949E] flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#58A6FF]" />
                  {project.tokenomics.blockchain}
                </span>
                <span className="text-[#30363D]">•</span>
                <span className="text-xs text-[#8B949E]">{project.category}</span>
              </div>
            </div>
          </div>

          {/* Right Action Tools: Priority badge & Favorite Star */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span
              title={`Приоритет: ${project.priority}/10`}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#21262D] text-[#8B949E] border border-[#30363D]"
            >
              P{project.priority}
            </span>

            <button
              id={`fav-btn-${project.id}`}
              onClick={(e) => onToggleFavorite(project.id, e)}
              className={`p-1.5 rounded-lg border transition-all duration-200 hover:scale-110 active:scale-95 ${
                project.isFavorite
                  ? 'border-[#D29922]/50 bg-[#D29922]/15 text-[#D29922]'
                  : 'border-[#30363D] bg-[#21262D]/60 text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#484F58]'
              }`}
              title={project.isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              <Star
                className={`w-4 h-4 transition-transform ${project.isFavorite ? 'fill-[#D29922] scale-105' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Status & Expected Reward Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {/* Status Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border shadow-sm"
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

          {/* Reward Types Icons */}
          <div className="flex items-center gap-1">
            {(project.reward.rewardTypes || []).slice(0, 3).map((type) => {
              const info = REWARD_TYPE_LABELS[type];
              if (!info) return null;
              return (
                <span
                  key={type}
                  title={info.label}
                  className="px-2 py-0.5 rounded bg-[#21262D] border border-[#30363D] text-xs hover:border-[#58A6FF]/40 transition-colors"
                >
                  {info.icon}
                </span>
              );
            })}
          </div>

          {/* Potential rating */}
          <div
            title={`Потенциал проекта: ${potential.score}/7`}
            className="text-[11px] px-2 py-0.5 rounded border border-[#30363D] bg-[#21262D] text-[#8B949E] ml-auto font-medium"
          >
            {potential.label}
          </div>
        </div>

        {/* Expected Reward Size */}
        {project.reward.expectedAmount && (
          <div className="mt-3 text-xs text-[#8B949E] flex items-center gap-1.5 bg-[#0D1117]/60 p-2 rounded-lg border border-[#30363D]/60 group-hover:border-[#30363D] transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-[#D29922]" />
            <span>Награда: <strong className="text-[#F0F6FC]">{project.reward.expectedAmount}</strong></span>
          </div>
        )}

        {/* Short Description */}
        <p className="text-xs text-[#8B949E] line-clamp-2 mt-3 leading-relaxed">
          {project.description || 'Описание проекта уточняется.'}
        </p>

        {/* Tier 1 Investors pill preview */}
        {tier1Investors.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-[#8B949E] uppercase font-semibold">Tier 1:</span>
            {tier1Investors.map((inv) => (
              <span
                key={inv.id}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#1f6feb]/15 text-[#58A6FF] border border-[#58A6FF]/30 font-medium"
              >
                {inv.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Progress & Live Countdown */}
      <div className="mt-4 pt-3 border-t border-[#30363D]/60">
        
        {/* Live Countdown badge (if active) */}
        {activeCountdown && (
          <div className="mb-2.5 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-[#F0883E]/10 border border-[#F0883E]/30 text-[#F0883E]">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {countdownLabel}
            </span>
            <span className="font-mono font-bold tracking-wide">
              {activeCountdown.formatted}
            </span>
          </div>
        )}

        {/* Activities Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#8B949E]">
            <span>Задания ({progress.completed}/{progress.total})</span>
            <span className="font-mono font-medium text-[#F0F6FC]">
              {progress.percent}%
            </span>
          </div>
          <div className="w-full bg-[#21262D] h-2 rounded-full overflow-hidden border border-[#30363D]/60">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress.percent === 100
                  ? 'bg-[#3FB950]'
                  : progress.percent >= 50
                  ? 'bg-[#58A6FF]'
                  : 'bg-[#F0883E]'
              }`}
              style={{ width: `${progress.percent}%` }}
            ></div>
          </div>
        </div>

        {/* Bottom CTA row */}
        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-[#8B949E] text-[11px]">
            {project.activities.length} активност{project.activities.length === 1 ? 'ь' : project.activities.length < 5 ? 'и' : 'ей'}
          </span>

          <span className="flex items-center gap-1 text-[#58A6FF] font-medium group-hover:translate-x-1 transition-transform">
            <span>Детали</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
