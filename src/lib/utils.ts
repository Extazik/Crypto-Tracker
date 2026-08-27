import { Project, PotentialFactors } from '../types';

/**
 * Format numbers with spaces (e.g. 1 000 000)
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '—';
  return new Intl.NumberFormat('ru-RU').format(num);
}

/**
 * Format currency with $ and spaces
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  return '$' + new Intl.NumberFormat('ru-RU').format(amount);
}

/**
 * Format date string to Russian format DD.MM.YYYY
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format date time with MSK time zone
 */
export function formatDateTimeMSK(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' МСК';
}

/**
 * Calculate countdown remaining time until target date
 */
export interface CountdownResult {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
}

export function calculateCountdown(targetDateStr: string | null | undefined): CountdownResult | null {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr).getTime();
  if (isNaN(target)) return null;

  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return {
      totalMs: diff,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formatted: 'Завершено',
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  let formatted = '';
  if (days > 0) {
    formatted = `${days}д ${hours}ч ${minutes}м`;
  } else if (hours > 0) {
    formatted = `${hours}ч ${minutes}м ${seconds}с`;
  } else {
    formatted = `${minutes}м ${seconds}с`;
  }

  return {
    totalMs: diff,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    formatted,
  };
}

/**
 * Calculate progress of project activities
 */
export function getProjectProgress(project: Project): {
  total: number;
  completed: number;
  percent: number;
} {
  const activities = project.activities || [];
  const total = activities.length;
  if (total === 0) return { total: 0, completed: 0, percent: 0 };
  const completed = activities.filter((a) => a.isCompleted).length;
  const percent = Math.round((completed / total) * 100);
  return { total, completed, percent };
}

/**
 * Calculate potential score (0-7)
 */
export function calculatePotentialScore(
  factors?: PotentialFactors,
  investors?: Project['investors']
): { score: number; level: 'low' | 'medium' | 'high'; label: string; color: string } {
  let score = 0;

  // Auto detect from investors if not explicitly provided
  const hasTier1 = factors?.tier1Investors ?? investors?.some((i) => i.tier === 'Tier 1');
  const totalRaised = investors?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
  const over10m = factors?.over10mRaised ?? totalRaised >= 10_000_000;

  if (hasTier1) score += 2;
  if (over10m) score += 2;
  if (factors?.famousTeam) score += 1;
  if (factors?.workingProduct) score += 1;
  if (factors?.activeCommunity) score += 1;

  if (score >= 6) {
    return { score, level: 'high', label: '🟢 Высокий', color: '#3FB950' };
  } else if (score >= 4) {
    return { score, level: 'medium', label: '🟡 Средний', color: '#D29922' };
  } else {
    return { score, level: 'low', label: '🔴 Низкий', color: '#F85149' };
  }
}

/**
 * Export projects to CSV
 */
export function exportProjectsToCSV(projects: Project[], filename = 'airdrop_projects.csv') {
  const headers = [
    'Название',
    'Статус награды',
    'Типы наград',
    'Ожидаемая награда',
    'Прогресс (%)',
    'Выполнено заданий',
    'Всего заданий',
    'Блокчейн',
    'Токен (тикер)',
    'Общий Supply',
    'Инвесторы',
    'Сумма инвестиций ($)',
    'Дедлайн регистрации',
    'Дедлайн получения',
    'Официальный сайт',
    'Избранное',
    'Приоритет',
  ];

  const rows = projects.map((p) => {
    const progress = getProjectProgress(p);
    const investorNames = p.investors.map((i) => `${i.name} (${i.tier})`).join('; ');
    const totalRaised = p.investors.reduce((acc, i) => acc + (i.amount || 0), 0);
    const rewardTypesStr = p.reward.rewardTypes.join(', ');

    return [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.reward.status}"`,
      `"${rewardTypesStr}"`,
      `"${p.reward.expectedAmount || ''}"`,
      progress.percent,
      progress.completed,
      progress.total,
      `"${p.tokenomics.blockchain || ''}"`,
      `"${p.tokenomics.ticker || ''}"`,
      p.tokenomics.totalSupply || '',
      `"${investorNames.replace(/"/g, '""')}"`,
      totalRaised || '',
      p.dates.registrationEnd || '',
      p.dates.claimEnd || '',
      `"${p.website || ''}"`,
      p.isFavorite ? 'Да' : 'Нет',
      p.priority,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate iCalendar .ics string and download
 */
export function exportToICS(project: Project) {
  const events: string[] = [];

  const formatICSDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  if (project.dates.registrationEnd) {
    const start = project.dates.registrationStart || project.dates.registrationEnd;
    events.push(`BEGIN:VEVENT
UID:${project.id}-reg@airdroptracker.local
SUMMARY:Дедлайн регистрации: ${project.name}
DESCRIPTION:Конец периода регистрации на аирдроп/активность проекта ${project.name}. Ссылка: ${project.website}
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(project.dates.registrationEnd)}
STATUS:CONFIRMED
END:VEVENT`);
  }

  if (project.dates.claimEnd) {
    const start = project.dates.claimStart || project.dates.claimEnd;
    events.push(`BEGIN:VEVENT
UID:${project.id}-claim@airdroptracker.local
SUMMARY:Получение наград (Claim): ${project.name}
DESCRIPTION:Период клейма наград проекта ${project.name}. Ссылка: ${project.reward.claimLink || project.website}
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(project.dates.claimEnd)}
STATUS:CONFIRMED
END:VEVENT`);
  }

  if (events.length === 0) {
    alert('У проекта нет установленных дат для календаря');
    return;
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airdrop Tracker//Crypto Activities Calendar//RU
CALSCALE:GREGORIAN
${events.join('\n')}
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${project.name.toLowerCase().replace(/\s+/g, '_')}_deadlines.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
