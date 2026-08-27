import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Download, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Project, REWARD_STATUS_LABELS } from '../types';
import { formatDate, exportProjectsToCSV } from '../lib/utils';

interface CalendarViewProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

export function CalendarView({ projects, onSelectProject }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026

  const prevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Find all deadline events
  interface CalendarEvent {
    id: string;
    projectId: string;
    project: Project;
    type: 'reg_end' | 'claim_end' | 'reg_start' | 'claim_start';
    label: string;
    date: Date;
    dateStr: string;
  }

  const events: CalendarEvent[] = [];

  projects.forEach((p) => {
    if (p.dates?.registrationEnd) {
      const d = new Date(p.dates.registrationEnd);
      if (!isNaN(d.getTime())) {
        events.push({
          id: `${p.id}-reg-end`,
          projectId: p.id,
          project: p,
          type: 'reg_end',
          label: `Конец рег: ${p.name}`,
          date: d,
          dateStr: p.dates.registrationEnd,
        });
      }
    }

    if (p.dates?.claimEnd) {
      const d = new Date(p.dates.claimEnd);
      if (!isNaN(d.getTime())) {
        events.push({
          id: `${p.id}-claim-end`,
          projectId: p.id,
          project: p,
          type: 'claim_end',
          label: `Конец клейма: ${p.name}`,
          date: d,
          dateStr: p.dates.claimEnd,
        });
      }
    }

    if (p.dates?.claimStart) {
      const d = new Date(p.dates.claimStart);
      if (!isNaN(d.getTime())) {
        events.push({
          id: `${p.id}-claim-start`,
          projectId: p.id,
          project: p,
          type: 'claim_start',
          label: `Старт клейма: ${p.name}`,
          date: d,
          dateStr: p.dates.claimStart,
        });
      }
    }
  });

  // Calculate calendar grid for currentMonth
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Shift Monday as first day of week (0=Mon, 6=Sun)
  const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: startDay }, (_, i) => i);

  return (
    <div id="calendar-view" className="space-y-6 animate-fadeIn">
      
      {/* Calendar Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#161B22] border border-[#30363D]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1f6feb]/20 border border-[#58A6FF]/30 flex items-center justify-center text-[#58A6FF]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#F0F6FC] flex items-center gap-2">
              <span>{monthNames[currentMonth]} {currentYear}</span>
              <span className="text-xs text-[#8B949E] font-normal">
                ({events.filter((e) => e.date.getFullYear() === currentYear && e.date.getMonth() === currentMonth).length} событий)
              </span>
            </h2>
            <p className="text-xs text-[#8B949E]">
              Календарь дедлайнов регистрации и клеймов аирдропов
            </p>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg bg-[#21262D] border border-[#30363D] text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#30363D] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setCurrentDate(new Date(2026, 7, 1))}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#21262D] border border-[#30363D] text-[#F0F6FC] hover:bg-[#30363D] transition-colors"
          >
            Сегодня
          </button>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg bg-[#21262D] border border-[#30363D] text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#30363D] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Month Grid */}
      <div className="rounded-2xl bg-[#161B22] border border-[#30363D] overflow-hidden">
        
        {/* Days of Week Headers */}
        <div className="grid grid-cols-7 border-b border-[#30363D] bg-[#0D1117] text-center text-xs font-semibold text-[#8B949E] py-2.5">
          <span>Пн</span>
          <span>Вт</span>
          <span>Ср</span>
          <span>Чт</span>
          <span>Пт</span>
          <span className="text-[#58A6FF]">Сб</span>
          <span className="text-[#58A6FF]">Вс</span>
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#30363D]/60 min-h-[500px]">
          {/* Leading Blanks */}
          {leadingBlanks.map((b) => (
            <div key={`blank-${b}`} className="p-2 bg-[#0D1117]/40 min-h-[90px]"></div>
          ))}

          {/* Actual Days */}
          {daysArray.map((day) => {
            const dayDate = new Date(currentYear, currentMonth, day);
            const dayEvents = events.filter(
              (e) =>
                e.date.getFullYear() === currentYear &&
                e.date.getMonth() === currentMonth &&
                e.date.getDate() === day
            );

            const isToday =
              new Date().getFullYear() === currentYear &&
              new Date().getMonth() === currentMonth &&
              new Date().getDate() === day;

            return (
              <div
                key={`day-${day}`}
                className={`p-2 min-h-[100px] flex flex-col justify-between transition-colors ${
                  isToday ? 'bg-[#1f6feb]/10' : 'hover:bg-[#21262D]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday ? 'bg-[#58A6FF] text-black font-bold' : 'text-[#8B949E]'
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F0883E] animate-pulse"></span>
                  )}
                </div>

                <div className="mt-1 space-y-1 overflow-y-auto max-h-[85px]">
                  {dayEvents.map((evt) => {
                    const statusInfo = REWARD_STATUS_LABELS[evt.project.reward.status];
                    return (
                      <div
                        key={evt.id}
                        onClick={() => onSelectProject(evt.project)}
                        className="text-[10px] p-1 rounded border cursor-pointer truncate transition-all hover:scale-[1.02]"
                        style={{
                          backgroundColor: evt.type === 'claim_end' ? 'rgba(63, 185, 80, 0.15)' : 'rgba(240, 136, 62, 0.15)',
                          borderColor: evt.type === 'claim_end' ? 'rgba(63, 185, 80, 0.4)' : 'rgba(240, 136, 62, 0.4)',
                          color: evt.type === 'claim_end' ? '#3FB950' : '#F0883E',
                        }}
                        title={`${evt.label} (${evt.project.tokenomics.blockchain})`}
                      >
                        <span className="font-semibold">{evt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Color Legend */}
        <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-2 text-xs">
          <span className="font-semibold text-[#F0F6FC]">Обозначения в календаре</span>
          <div className="flex flex-wrap gap-3 text-[#8B949E]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#3FB950]/20 border border-[#3FB950]"></span>
              <span>Клейм наград (Claiming)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#F0883E]/20 border border-[#F0883E]"></span>
              <span>Дедлайн регистрации</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#58A6FF]/20 border border-[#58A6FF]"></span>
              <span>Старт активностей</span>
            </div>
          </div>
        </div>

        {/* Upcoming in this month */}
        <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-2 text-xs">
          <span className="font-semibold text-[#F0F6FC]">
            Все дедлайны в этом месяце ({events.length})
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {events.map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSelectProject(evt.project)}
                className="flex items-center justify-between p-2 rounded-lg bg-[#0D1117] border border-[#30363D] hover:border-[#58A6FF]/50 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#F0F6FC]">{evt.project.name}</span>
                  <span className="text-[10px] text-[#8B949E]">({evt.label.split(':')[0]})</span>
                </div>
                <span className="font-mono text-[#58A6FF] text-[11px]">
                  {formatDate(evt.dateStr)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
