import { 
  Search, 
  Filter, 
  RotateCcw, 
  ArrowUpDown, 
  Star, 
  Calendar, 
  Layers, 
  Coins, 
  CheckSquare, 
  Award,
  ChevronDown,
  X
} from 'lucide-react';
import { 
  FilterState, 
  RewardStatus, 
  RewardType, 
  Blockchain, 
  REWARD_STATUS_LABELS, 
  REWARD_TYPE_LABELS, 
  BLOCKCHAINS,
  CATEGORIES
} from '../types';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  activeFilterCount: number;
  totalFilteredCount: number;
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onResetFilters,
  activeFilterCount,
  totalFilteredCount,
}: FilterSidebarProps) {

  const toggleStatus = (status: RewardStatus) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFilterChange({ ...filters, statuses: next });
  };

  const toggleRewardType = (type: RewardType) => {
    const next = filters.rewardTypes.includes(type)
      ? filters.rewardTypes.filter((t) => t !== type)
      : [...filters.rewardTypes, type];
    onFilterChange({ ...filters, rewardTypes: next });
  };

  const toggleBlockchain = (chain: Blockchain) => {
    const next = filters.blockchains.includes(chain)
      ? filters.blockchains.filter((c) => c !== chain)
      : [...filters.blockchains, chain];
    onFilterChange({ ...filters, blockchains: next });
  };

  const toggleProgressRange = (range: string) => {
    const next = filters.progressRanges.includes(range)
      ? filters.progressRanges.filter((r) => r !== range)
      : [...filters.progressRanges, range];
    onFilterChange({ ...filters, progressRanges: next });
  };

  const toggleCategory = (cat: string) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onFilterChange({ ...filters, categories: next });
  };

  return (
    <aside id="filters-sidebar" className="w-full lg:w-72 bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex flex-col gap-5 text-[#F0F6FC] shrink-0">
      
      {/* Header with Active Filters & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-[#30363D]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#58A6FF]" />
          <span className="font-semibold text-sm">Фильтры</span>
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/30">
              {activeFilterCount}
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            id="btn-reset-filters"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-[#8B949E] hover:text-[#F85149] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Сбросить</span>
          </button>
        )}
      </div>

      {/* 1. Search Bar */}
      <div>
        <label htmlFor="search-input" className="block text-xs font-medium text-[#8B949E] mb-1.5">
          Поиск по названию, тикеру, инвестору
        </label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8B949E]" />
          <input
            id="search-input"
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Например: Monad, a16z, BERA..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF]"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-2.5 text-[#8B949E] hover:text-[#F0F6FC]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Sort Dropdown */}
      <div>
        <label htmlFor="sort-select" className="block text-xs font-medium text-[#8B949E] mb-1.5 flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#58A6FF]" />
          <span>Сортировка</span>
        </label>
        <select
          id="sort-select"
          value={filters.sortBy}
          onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })}
          className="w-full px-3 py-2 text-xs rounded-lg bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
        >
          <option value="status_priority">По статусу (Подтверждена &gt; Получение...)</option>
          <option value="date_desc">По дате добавления (новые)</option>
          <option value="date_asc">По дате добавления (старые)</option>
          <option value="progress_desc">По прогрессу (100% &gt; 0%)</option>
          <option value="progress_asc">По прогрессу (0% &gt; 100%)</option>
          <option value="priority_desc">По приоритету (10 &gt; 1)</option>
          <option value="name_asc">По названию (А - Я)</option>
        </select>
      </div>

      {/* 3. Favorites Filter */}
      <div>
        <label className="text-xs font-medium text-[#8B949E] mb-1.5 block">
          Избранное
        </label>
        <button
          onClick={() => onFilterChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs border transition-all ${
            filters.favoritesOnly
              ? 'bg-[#D29922]/15 border-[#D29922]/40 text-[#D29922] font-medium'
              : 'bg-[#0D1117] border-[#30363D] text-[#8B949E] hover:text-[#F0F6FC]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Star className={`w-3.5 h-3.5 ${filters.favoritesOnly ? 'fill-[#D29922]' : ''}`} />
            Только избранные проекты
          </span>
          {filters.favoritesOnly && <span className="text-[11px]">✓</span>}
        </button>
      </div>

      {/* 4. Status Filter */}
      <div>
        <label className="text-xs font-medium text-[#8B949E] mb-2 block">
          Статус награды
        </label>
        <div className="space-y-1.5">
          {(['confirmed', 'claiming', 'registration', 'potential', 'completed'] as RewardStatus[]).map((status) => {
            const isSelected = filters.statuses.includes(status);
            const info = REWARD_STATUS_LABELS[status];
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                  isSelected
                    ? 'border-[#58A6FF]/40 bg-[#58A6FF]/10 text-[#F0F6FC]'
                    : 'border-[#30363D]/60 bg-[#0D1117]/50 text-[#8B949E] hover:border-[#484F58] hover:text-[#F0F6FC]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: info.dotColor }}
                  ></span>
                  <span>{info.label}</span>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="rounded border-[#30363D] bg-[#161B22] text-[#58A6FF] pointer-events-none"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Reward Types */}
      <div>
        <label className="text-xs font-medium text-[#8B949E] mb-2 block">
          Тип награды
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(['tokens', 'role', 'points', 'nft', 'whitelist', 'ambassador'] as RewardType[]).map((type) => {
            const isSelected = filters.rewardTypes.includes(type);
            const info = REWARD_TYPE_LABELS[type];
            return (
              <button
                key={type}
                onClick={() => toggleRewardType(type)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] border transition-all truncate ${
                  isSelected
                    ? 'border-[#58A6FF]/40 bg-[#58A6FF]/10 text-[#F0F6FC] font-medium'
                    : 'border-[#30363D]/60 bg-[#0D1117]/50 text-[#8B949E] hover:text-[#F0F6FC]'
                }`}
              >
                <span>{info.icon}</span>
                <span className="truncate">{info.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Dates / Deadlines Filter */}
      <div>
        <label className="text-xs font-medium text-[#8B949E] mb-2 block flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-[#58A6FF]" />
          По дедлайнам и датам
        </label>
        <div className="space-y-1">
          {[
            { key: 'all', label: 'Все даты' },
            { key: 'active_now', label: 'Активные сейчас' },
            { key: 'ends_in_7d', label: 'Завершаются в 7 дней 🔥' },
            { key: 'ends_in_30d', label: 'Завершаются в 30 дней' },
            { key: 'future', label: 'Будущие (не начались)' },
          ].map((d) => (
            <button
              key={d.key}
              onClick={() => onFilterChange({ ...filters, dateFilter: d.key as any })}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                filters.dateFilter === d.key
                  ? 'border-[#58A6FF]/40 bg-[#58A6FF]/10 text-[#58A6FF] font-medium'
                  : 'border-transparent text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 7. Investors Filter (Tier 1 / Tier 2) */}
      <div>
        <label className="text-xs font-medium text-[#8B949E] mb-1.5 block">
          Инвесторы
        </label>
        <div className="grid grid-cols-3 gap-1">
          {[
            { key: 'all', label: 'Все' },
            { key: 'tier1', label: 'Tier 1' },
            { key: 'tier2', label: 'Tier 2' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => onFilterChange({ ...filters, investorTier: t.key as any })}
              className={`py-1.5 text-xs text-center rounded-lg border transition-all ${
                filters.investorTier === t.key
                  ? 'border-[#58A6FF] bg-[#58A6FF]/15 text-[#58A6FF] font-semibold'
                  : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 8. Progress Ranges */}
      <div>
        <label className="text-xs font-medium text-[#8B949E] mb-1.5 block flex items-center gap-1">
          <CheckSquare className="w-3.5 h-3.5 text-[#3FB950]" />
          По прогрессу заданий
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {['0-25', '25-50', '50-75', '75-100', '100'].map((range) => {
            const isSelected = filters.progressRanges.includes(range);
            return (
              <button
                key={range}
                onClick={() => toggleProgressRange(range)}
                className={`px-2 py-1 rounded text-xs border text-center transition-all ${
                  isSelected
                    ? 'border-[#3FB950]/50 bg-[#3FB950]/15 text-[#3FB950] font-medium'
                    : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:text-[#F0F6FC]'
                }`}
              >
                {range === '100' ? '100% (готово)' : `${range}%`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 9. Blockchain Multi-select */}
      <div>
        <label className="text-xs font-medium text-[#8B949E] mb-1.5 block flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-[#58A6FF]" />
          Блокчейн
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
          {BLOCKCHAINS.map((chain) => {
            const isSelected = filters.blockchains.includes(chain);
            return (
              <button
                key={chain}
                onClick={() => toggleBlockchain(chain)}
                className={`px-2 py-1 rounded-md text-[11px] border transition-all ${
                  isSelected
                    ? 'border-[#58A6FF] bg-[#58A6FF]/20 text-[#58A6FF] font-medium'
                    : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:text-[#F0F6FC]'
                }`}
              >
                {chain}
              </button>
            );
          })}
        </div>
      </div>

      {/* 10. Categories */}
      <div>
        <label className="text-xs font-medium text-[#8B949E] mb-1.5 block">
          Категории
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const isSelected = filters.categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-2 py-1 rounded-md text-[11px] border transition-all ${
                  isSelected
                    ? 'border-[#58A6FF] bg-[#58A6FF]/15 text-[#58A6FF] font-medium'
                    : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:text-[#F0F6FC]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="pt-3 border-t border-[#30363D] text-xs text-[#8B949E] flex items-center justify-between">
        <span>Найдено проектов:</span>
        <strong className="text-[#58A6FF] font-mono text-sm">{totalFilteredCount}</strong>
      </div>

    </aside>
  );
}
