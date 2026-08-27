import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, RotateCcw, Download, Coins, Calendar as CalendarIcon, 
  BarChart3, Filter, SlidersHorizontal, Flame, LayoutGrid, CheckCircle2, Sparkles
} from 'lucide-react';
import { Project, FilterState, DEFAULT_FILTERS, NotificationItem, REWARD_STATUS_LABELS } from './types';
import { calculateCountdown, exportProjectsToCSV } from './lib/utils';
import { ToastProvider, useToast } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { FilterSidebar } from './components/FilterSidebar';
import { ProjectCard } from './components/ProjectCard';
import { ProjectDetailsModal } from './components/ProjectDetailsModal';
import { AdminProjectModal } from './components/AdminProjectModal';
import { CalendarView } from './components/CalendarView';
import { StatsDashboard } from './components/StatsDashboard';
import { DailyResetModal } from './components/DailyResetModal';
import { AuthModal } from './components/AuthModal';
import { AdminProfileModal } from './components/AdminProfileModal';

function MainApp() {
  const { showToast } = useToast();
  const { isAuthenticated, getAuthHeaders, openLoginModal } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<'projects' | 'calendar' | 'stats' | 'reset-logs'>('projects');

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDailyResetModalOpen, setIsDailyResetModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const checkJsonResponse = (res: Response) => {
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Сервер вернул HTML вместо JSON. Убедитесь, что вы запустили файл server.ts!");
    }
  };

  // Оставляем пустым, так как запросы идут локально
  const API_BASE_URL = ''; 

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/projects`);
      checkJsonResponse(res); 
      
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      } else {
        showToast('error', data.error || 'Ошибка при загрузке проектов');
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      showToast('error', 'Не удалось загрузить проекты', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesTicker = p.tokenomics?.ticker?.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        const matchesTag = p.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesTicker && !matchesDesc && !matchesTag) return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(p.reward.status)) return false;
      if (filters.rewardTypes.length > 0) {
        const hasAnyRewardType = filters.rewardTypes.some((t) => p.reward.rewardTypes?.includes(t));
        if (!hasAnyRewardType) return false;
      }
      if (filters.blockchains.length > 0 && !filters.blockchains.includes(p.tokenomics.blockchain)) return false;
      if (filters.investorTier === 'tier1') {
        if (!p.investors.some((inv) => inv.tier === 'Tier 1')) return false;
      } else if (filters.investorTier === 'tier2') {
        if (!p.investors.some((inv) => inv.tier === 'Tier 2')) return false;
      }
      if (filters.categories.length > 0 && !filters.categories.includes(p.category)) return false;
      if (filters.favoritesOnly && !p.isFavorite) return false;
      
      if (filters.progressRanges.length > 0) {
        const done = p.activities?.filter((a) => a.isCompleted).length || 0;
        const total = p.activities?.length || 1;
        const pct = Math.round((done / total) * 100);

        const matchRange = filters.progressRanges.some((range) => {
          if (range === '0-25') return pct >= 0 && pct <= 25;
          if (range === '25-50') return pct > 25 && pct <= 50;
          if (range === '50-75') return pct > 50 && pct <= 75;
          if (range === '75-100') return pct > 75 && pct < 100;
          if (range === '100') return pct === 100;
          return false;
        });
        if (!matchRange) return false;
      }

      if (filters.dateFilter !== 'all') {
        const now = new Date().getTime();
        const deadlineStr = p.dates.claimEnd || p.dates.registrationEnd;
        if (!deadlineStr) return false;
        const deadline = new Date(deadlineStr).getTime();
        const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);

        if (filters.dateFilter === 'ends_in_7d' && (diffDays < 0 || diffDays > 7)) return false;
        if (filters.dateFilter === 'ends_in_30d' && (diffDays < 0 || diffDays > 30)) return false;
        if (filters.dateFilter === 'active_now' && diffDays < 0) return false;
        if (filters.dateFilter === 'future' && diffDays <= 30) return false;
      }
      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'priority_desc': return b.priority - a.priority;
        case 'date_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name_asc': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  }, [projects, filters]);

  const handleSaveProject = async (projectData: Partial<Project>) => {
    if (!isAuthenticated) {
      openLoginModal('Для сохранения или создания проектов требуется авторизация администратора (Extazik).');
      return;
    }
    try {
      const url = editingProject ? `${API_BASE_URL}/api/projects/${editingProject.id}` : `${API_BASE_URL}/api/projects`;
      const res = await fetch(url, {
        method: editingProject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(projectData),
      });

      checkJsonResponse(res);
      const data = await res.json();

      if (data.success) {
        if (editingProject) {
          setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? data.data : p)));
          if (selectedProject?.id === editingProject.id) setSelectedProject(data.data);
          showToast('success', 'Проект успешно обновлен!', data.data.name);
        } else {
          setProjects((prev) => [data.data, ...prev]);
          showToast('success', 'Новый проект добавлен!', data.data.name);
        }
      } else {
        showToast('error', data.error || 'Ошибка при сохранении проекта');
      }
    } catch (err: any) {
      showToast('error', 'Ошибка сохранения проекта', err.message);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!isAuthenticated) {
      openLoginModal('Для удаления проекта требуется авторизация администратора (Extazik).');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, { 
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      checkJsonResponse(res);
      const data = await res.json();
      
      if (data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (selectedProject?.id === id) setSelectedProject(null);
        showToast('info', 'Проект удален');
      } else {
        showToast('error', data.error || 'Ошибка при удалении проекта');
      }
    } catch (err: any) {
      showToast('error', 'Ошибка при удалении проекта', err.message);
    }
  };

  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const nextFav = !project.isFavorite;

    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, isFavorite: nextFav } : p)));
    if (selectedProject?.id === id) setSelectedProject({ ...selectedProject, isFavorite: nextFav });

    try {
      const res = await fetch(`${API_BASE_URL}/api/favorites/${id}`, { method: nextFav ? 'POST' : 'DELETE' });
      checkJsonResponse(res);
      showToast('info', nextFav ? 'Добавлено в избранное' : 'Удалено из избранного', project.name);
    } catch (err: any) {
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, isFavorite: !nextFav } : p)));
      showToast('error', 'Не удалось обновить избранное', err.message);
    }
  };

  const handleOpenEdit = (project: Project) => {
    if (!isAuthenticated) {
      openLoginModal('Для редактирования проекта требуется авторизация администратора (Extazik).');
      return;
    }
    setEditingProject(project);
    setIsAdminModalOpen(true);
  };

  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      openLoginModal('Для добавления нового проекта требуется авторизация администратора (Extazik).');
      return;
    }
    setEditingProject(null);
    setIsAdminModalOpen(true);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.statuses.length > 0) count += filters.statuses.length;
    if (filters.rewardTypes.length > 0) count += filters.rewardTypes.length;
    if (filters.progressRanges.length > 0) count += filters.progressRanges.length;
    if (filters.dateFilter !== 'all') count++;
    if (filters.investorTier !== 'all') count++;
    if (filters.blockchains.length > 0) count += filters.blockchains.length;
    if (filters.favoritesOnly) count++;
    if (filters.categories.length > 0) count += filters.categories.length;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] flex flex-col font-sans selection:bg-[#58A6FF]/30 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        onOpenAddModal={handleOpenCreate}
        onOpenResetModal={() => setIsDailyResetModalOpen(true)}
        onExportCSV={() => exportProjectsToCSV(filteredProjects)}
        onSelectProject={(p) => setSelectedProject(p)}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'projects' && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="hidden lg:block w-72 shrink-0 sticky top-20">
              <FilterSidebar filters={filters} onFilterChange={setFilters} onResetFilters={() => setFilters(DEFAULT_FILTERS)} activeFilterCount={activeFilterCount} totalFilteredCount={filteredProjects.length} />
            </div>
            <div className="lg:hidden w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#161B22] border border-[#30363D]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8B949E]">Найдено:</span>
                <span className="text-xs font-bold text-[#F0F6FC]">{filteredProjects.length} проектов</span>
              </div>
              <button onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#21262D] border border-[#30363D] text-xs font-medium text-[#58A6FF]">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Фильтры ({activeFilterCount})</span>
              </button>
            </div>
            {isMobileFilterOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex flex-col">
                <div className="flex justify-between items-center py-2 text-white font-bold">
                  <span>Фильтры проектов</span>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="text-[#8B949E] p-2">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <FilterSidebar filters={filters} onFilterChange={setFilters} onResetFilters={() => setFilters(DEFAULT_FILTERS)} activeFilterCount={activeFilterCount} totalFilteredCount={filteredProjects.length} />
                </div>
                <button onClick={() => setIsMobileFilterOpen(false)} className="mt-3 w-full py-2.5 rounded-xl bg-[#1f6feb] text-white font-semibold text-xs">
                  Показать ({filteredProjects.length})
                </button>
              </div>
            )}
            <div className="flex-1 w-full space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#161B22] border border-[#30363D]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
                  <input type="text" placeholder="Поиск по названию, тикеру ($MONAD), описанию, тегам..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF]" />
                  {filters.search && <button onClick={() => setFilters({ ...filters, search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8B949E] hover:text-white">✕</button>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => exportProjectsToCSV(filteredProjects)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#F0F6FC] hover:bg-[#30363D] transition-colors" title="Экспорт в CSV">
                    <Download className="w-3.5 h-3.5 text-[#8B949E]" />
                    <span className="hidden sm:inline">Экспорт CSV</span>
                  </button>
                  <button onClick={handleOpenCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold shadow-md shadow-[#238636]/20 transition-all">
                    <Plus className="w-4 h-4" />
                    <span>+ Добавить проект</span>
                  </button>
                </div>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-56 rounded-2xl bg-[#161B22] border border-[#30363D] animate-pulse"></div>)}
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#161B22] border border-[#30363D] space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#21262D] text-[#8B949E] flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#F0F6FC]">Проекты не найдены</h3>
                    <p className="text-xs text-[#8B949E] mt-1 max-w-sm mx-auto">Попробуйте изменить параметры фильтрации.</p>
                  </div>
                  <button onClick={() => setFilters(DEFAULT_FILTERS)} className="px-4 py-2 text-xs font-medium rounded-lg bg-[#21262D] border border-[#30363D] text-[#58A6FF] hover:bg-[#30363D] transition-colors">
                    Сбросить все фильтры
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} onSelect={(p) => setSelectedProject(p)} onToggleFavorite={(id, e) => handleToggleFavorite(id, e)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'calendar' && <CalendarView projects={projects} onSelectProject={(p) => setSelectedProject(p)} />}
        {activeTab === 'stats' && <StatsDashboard projects={projects} />}
        {activeTab === 'reset-logs' && <DailyResetModal isOpen={true} onClose={() => setActiveTab('projects')} projects={projects} onTriggerResetSuccess={(updated) => setProjects(updated)} />}
      </main>
      <footer className="border-t border-[#30363D] bg-[#0D1117] py-6 px-4 text-center text-xs text-[#8B949E]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#58A6FF]" />
            <span className="font-semibold text-[#F0F6FC]">Airdrop & Crypto Tracker</span>
            <span>— трекер крипто-активностей</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Сброс заданий: <strong>03:00 MSK (UTC+3)</strong></span>
            <span>•</span>
            <button onClick={() => setIsDailyResetModalOpen(true)} className="text-[#58A6FF] hover:underline">Управление сбросом</button>
          </div>
        </div>
      </footer>
      {selectedProject && <ProjectDetailsModal project={selectedProject} onClose={() => setSelectedProject(null)} onUpdateProject={(updated) => { setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p))); setSelectedProject(updated); }} onDeleteProject={handleDeleteProject} onOpenEditModal={(p) => { setSelectedProject(null); handleOpenEdit(p); }} />}
      <AdminProjectModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} onSave={handleSaveProject} editingProject={editingProject} />
      <DailyResetModal isOpen={isDailyResetModalOpen} onClose={() => setIsDailyResetModalOpen(false)} projects={projects} onTriggerResetSuccess={(updated) => setProjects(updated)} />
      <AuthModal />
      <AdminProfileModal />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
