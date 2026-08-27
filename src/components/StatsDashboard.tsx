import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Coins, 
  Award, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Star
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { Project, REWARD_STATUS_LABELS } from '../types';
import { getProjectProgress, formatCurrency, formatNumber } from '../lib/utils';

interface StatsDashboardProps {
  projects: Project[];
}

const COLORS = ['#58A6FF', '#3FB950', '#F0883E', '#D29922', '#A371F7', '#8B949E', '#79C0FF', '#7EE787'];

export function StatsDashboard({ projects }: StatsDashboardProps) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.reward.status === 'registration' || p.reward.status === 'claiming' || p.reward.status === 'confirmed'
  ).length;
  const completedProjects = projects.filter((p) => p.reward.status === 'completed').length;
  const favoriteProjects = projects.filter((p) => p.isFavorite).length;

  let totalTasks = 0;
  let completedTasks = 0;
  let totalRaisedAll = 0;

  const investorCounts: Record<string, number> = {};
  const blockchainCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {
    confirmed: 0,
    claiming: 0,
    registration: 0,
    potential: 0,
    completed: 0,
  };
  const categoryCounts: Record<string, number> = {};

  projects.forEach((p) => {
    statusCounts[p.reward.status] = (statusCounts[p.reward.status] || 0) + 1;
    blockchainCounts[p.tokenomics.blockchain] = (blockchainCounts[p.tokenomics.blockchain] || 0) + 1;
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;

    p.investors?.forEach((inv) => {
      investorCounts[inv.name] = (investorCounts[inv.name] || 0) + 1;
      if (inv.amount) totalRaisedAll += inv.amount;
    });

    p.activities?.forEach((act) => {
      totalTasks++;
      if (act.isCompleted) completedTasks++;
    });
  });

  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart data
  const statusChartData = Object.entries(statusCounts).map(([statusKey, count]) => ({
    name: REWARD_STATUS_LABELS[statusKey as keyof typeof REWARD_STATUS_LABELS]?.label || statusKey,
    count,
    color: REWARD_STATUS_LABELS[statusKey as keyof typeof REWARD_STATUS_LABELS]?.color || '#58A6FF',
  }));

  const blockchainChartData = Object.entries(blockchainCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topInvestors = Object.entries(investorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const categoryChartData = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div id="stats-dashboard" className="space-y-6 animate-fadeIn text-[#F0F6FC]">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Projects */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B949E] font-medium uppercase tracking-wider">
              Всего проектов
            </span>
            <div className="p-2 rounded-lg bg-[#58A6FF]/10 text-[#58A6FF]">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#F0F6FC] mt-2 font-mono">
            {totalProjects}
          </div>
          <div className="text-xs text-[#8B949E] mt-1 flex items-center gap-1.5">
            <span className="text-[#3FB950] font-semibold">{activeProjects} активных</span>
            <span>•</span>
            <span>{completedProjects} завершенных</span>
          </div>
        </div>

        {/* Card 2: Overall Progress */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B949E] font-medium uppercase tracking-wider">
              Общий прогресс заданий
            </span>
            <div className="p-2 rounded-lg bg-[#3FB950]/10 text-[#3FB950]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#3FB950] mt-2 font-mono">
            {overallProgress}%
          </div>
          <div className="text-xs text-[#8B949E] mt-1">
            Выполнено <strong className="text-white">{completedTasks}</strong> из {totalTasks} задач
          </div>
        </div>

        {/* Card 3: Total Raised Investments */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B949E] font-medium uppercase tracking-wider">
              Привлечено фондами
            </span>
            <div className="p-2 rounded-lg bg-[#F0883E]/10 text-[#F0883E]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F0883E] mt-2 font-mono truncate">
            {formatCurrency(totalRaisedAll)}
          </div>
          <div className="text-xs text-[#8B949E] mt-1">
            Среди {Object.keys(investorCounts).length} уникальных фондов
          </div>
        </div>

        {/* Card 4: Favorites count */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B949E] font-medium uppercase tracking-wider">
              В избранном
            </span>
            <div className="p-2 rounded-lg bg-[#D29922]/10 text-[#D29922]">
              <Star className="w-4 h-4 fill-[#D29922]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#D29922] mt-2 font-mono">
            {favoriteProjects}
          </div>
          <div className="text-xs text-[#8B949E] mt-1">
            Проектов с высоким приоритетом отслеживания
          </div>
        </div>

      </div>

      {/* Charts Row 1: Status Distribution & Blockchain Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Distribution Pie */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F0F6FC] flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#58A6FF]" />
              <span>Распределение по статусам наград</span>
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', borderRadius: '8px', color: '#F0F6FC', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#8B949E' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blockchain Distribution Bar */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F0F6FC] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#58A6FF]" />
              <span>Топ блокчейнов (по числу проектов)</span>
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blockchainChartData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" stroke="#8B949E" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#8B949E" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', borderRadius: '8px', color: '#F0F6FC', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#58A6FF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Top Investors & Categories breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Investors Ranking */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D] space-y-4">
          <h3 className="text-sm font-bold text-[#F0F6FC] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#F0883E]" />
            <span>Топ венчурных фондов (по числу портфельных проектов)</span>
          </h3>

          <div className="space-y-2">
            {topInvestors.map((inv, idx) => (
              <div
                key={inv.name}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#0D1117] border border-[#30363D]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#21262D] text-[#8B949E] text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#F0F6FC]">{inv.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-[#1f6feb]/20 text-[#58A6FF] font-mono font-bold">
                    {inv.count} {inv.count === 1 ? 'проект' : 'проекта'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D] space-y-4">
          <h3 className="text-sm font-bold text-[#F0F6FC] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#3FB950]" />
            <span>Распределение по категориям</span>
          </h3>

          <div className="space-y-2.5">
            {categoryChartData.map((cat, i) => {
              const pct = Math.round((cat.count / totalProjects) * 100);
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#F0F6FC]">{cat.name}</span>
                    <span className="text-[#8B949E] font-mono">{cat.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#0D1117] h-2 rounded-full overflow-hidden border border-[#30363D]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
