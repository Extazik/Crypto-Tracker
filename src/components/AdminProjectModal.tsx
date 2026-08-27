import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Upload, 
  Save, 
  Coins, 
  Calendar, 
  Award, 
  Layers, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  Globe,
  Share2,
  Sparkles
} from 'lucide-react';
import { 
  Project, 
  RewardStatus, 
  RewardType, 
  ActivityType, 
  InvestorTier, 
  Blockchain, 
  BLOCKCHAINS, 
  CATEGORIES, 
  AVAILABLE_TAGS,
  REWARD_STATUS_LABELS,
  REWARD_TYPE_LABELS,
  ACTIVITY_TYPE_LABELS
} from '../types';
import { useToast } from './Toast';

interface AdminProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => Promise<void>;
  editingProject?: Project | null;
}

export function AdminProjectModal({
  isOpen,
  onClose,
  onSave,
  editingProject,
}: AdminProjectModalProps) {
  const { showToast } = useToast();
  const isEdit = !!editingProject;

  // 1.1 Main info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [website, setWebsite] = useState('');

  // 1.2 Activities
  const [activities, setActivities] = useState<any[]>([]);

  // 1.3 Reward Status
  const [rewardStatus, setRewardStatus] = useState<RewardStatus>('potential');
  const [claimLink, setClaimLink] = useState('');

  // 1.4 Reward Type
  const [rewardTypes, setRewardTypes] = useState<RewardType[]>(['tokens']);
  const [expectedAmount, setExpectedAmount] = useState('');

  // 1.5 Investors
  const [investors, setInvestors] = useState<any[]>([]);

  // 1.6 Tokenomics
  const [tokenName, setTokenName] = useState('');
  const [ticker, setTicker] = useState('');
  const [totalSupply, setTotalSupply] = useState<string>('');
  const [teamPercent, setTeamPercent] = useState<number>(20);
  const [investorsPercent, setInvestorsPercent] = useState<number>(20);
  const [communityPercent, setCommunityPercent] = useState<number>(40);
  const [ecosystemPercent, setEcosystemPercent] = useState<number>(10);
  const [reservePercent, setReservePercent] = useState<number>(10);
  const [blockchain, setBlockchain] = useState<Blockchain>('Ethereum');
  const [tokenStandard, setTokenStandard] = useState('ERC-20');

  // 1.7 Dates
  const [regStart, setRegStart] = useState('');
  const [regEnd, setRegEnd] = useState('');
  const [claimStart, setClaimStart] = useState('');
  const [claimEnd, setClaimEnd] = useState('');

  // 1.9 Socials
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [medium, setMedium] = useState('');
  const [github, setGithub] = useState('');
  const [youtube, setYoutube] = useState('');
  const [reddit, setReddit] = useState('');
  const [customSocials, setCustomSocials] = useState<{ id: string; name: string; url: string }[]>([]);

  // 1.10 Favorites & priority
  const [isFavorite, setIsFavorite] = useState(false);
  const [priority, setPriority] = useState(5);
  const [category, setCategory] = useState<any>('Layer 1');
  const [tags, setTags] = useState<string[]>(['Высокий приоритет']);
  const [difficulty, setDifficulty] = useState(2);

  // Validation state
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form values
  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name || '');
      setDescription(editingProject.description || '');
      setLogo(editingProject.logo || '');
      setWebsite(editingProject.website || '');
      setActivities(editingProject.activities || []);
      setRewardStatus(editingProject.reward?.status || 'potential');
      setClaimLink(editingProject.reward?.claimLink || '');
      setRewardTypes(editingProject.reward?.rewardTypes || ['tokens']);
      setExpectedAmount(editingProject.reward?.expectedAmount || '');
      setInvestors(editingProject.investors || []);
      setTokenName(editingProject.tokenomics?.tokenName || '');
      setTicker(editingProject.tokenomics?.ticker || '');
      setTotalSupply(editingProject.tokenomics?.totalSupply ? String(editingProject.tokenomics.totalSupply) : '');
      setTeamPercent(editingProject.tokenomics?.distribution?.team ?? 20);
      setInvestorsPercent(editingProject.tokenomics?.distribution?.investors ?? 20);
      setCommunityPercent(editingProject.tokenomics?.distribution?.community ?? 40);
      setEcosystemPercent(editingProject.tokenomics?.distribution?.ecosystem ?? 10);
      setReservePercent(editingProject.tokenomics?.distribution?.reserve ?? 10);
      setBlockchain(editingProject.tokenomics?.blockchain || 'Ethereum');
      setTokenStandard(editingProject.tokenomics?.tokenStandard || 'ERC-20');
      setRegStart(editingProject.dates?.registrationStart || '');
      setRegEnd(editingProject.dates?.registrationEnd || '');
      setClaimStart(editingProject.dates?.claimStart || '');
      setClaimEnd(editingProject.dates?.claimEnd || '');
      setTwitter(editingProject.socials?.twitter || '');
      setTelegram(editingProject.socials?.telegram || '');
      setDiscord(editingProject.socials?.discord || '');
      setMedium(editingProject.socials?.medium || '');
      setGithub(editingProject.socials?.github || '');
      setYoutube(editingProject.socials?.youtube || '');
      setReddit(editingProject.socials?.reddit || '');
      setCustomSocials(editingProject.socials?.custom || []);
      setIsFavorite(editingProject.isFavorite || false);
      setPriority(editingProject.priority || 5);
      setCategory(editingProject.category || 'Layer 1');
      setTags(editingProject.tags || ['Высокий приоритет']);
      setDifficulty(editingProject.difficulty || 2);
    } else {
      // Default empty form
      setName('');
      setDescription('');
      setLogo('https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=160&auto=format&fit=crop&q=80');
      setWebsite('');
      setActivities([
        {
          id: 'act_' + Date.now() + '_1',
          name: 'Тестнет активность и свапы',
          type: 'testnet',
          description: 'Выполнить 10+ транзакций в тестовой сети.',
          link: '',
          isCompleted: false,
          completedAt: null,
          isDailyReset: false,
        },
      ]);
      setRewardStatus('potential');
      setClaimLink('');
      setRewardTypes(['tokens']);
      setExpectedAmount('');
      setInvestors([
        {
          id: 'inv_' + Date.now() + '_1',
          name: '',
          tier: 'Tier 1',
          amount: null,
          roundDate: new Date().toISOString().split('T')[0],
        },
      ]);
      setTokenName('');
      setTicker('');
      setTotalSupply('1000000000');
      setTeamPercent(20);
      setInvestorsPercent(20);
      setCommunityPercent(40);
      setEcosystemPercent(10);
      setReservePercent(10);
      setBlockchain('Ethereum');
      setTokenStandard('ERC-20');
      setRegStart('');
      setRegEnd('');
      setClaimStart('');
      setClaimEnd('');
      setTwitter('');
      setTelegram('');
      setDiscord('');
      setMedium('');
      setGithub('');
      setYoutube('');
      setReddit('');
      setCustomSocials([]);
      setIsFavorite(false);
      setPriority(5);
      setCategory('Layer 1');
      setTags(['Высокий приоритет', 'Tier-1 Лид']);
      setDifficulty(2);
    }
    setErrors([]);
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  // File logo upload handler with 2MB limit
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Ошибка размера файла', 'Максимальный размер логотипа — 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(reader.result as string);
      showToast('success', 'Логотип загружен');
    };
    reader.readAsDataURL(file);
  };

  // Activity management
  const addActivity = () => {
    setActivities((prev) => [
      ...prev,
      {
        id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: '',
        type: 'testnet',
        description: '',
        link: '',
        isCompleted: false,
        completedAt: null,
        isDailyReset: false,
      },
    ]);
  };

  const removeActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const updateActivity = (id: string, field: string, value: any) => {
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const next = { ...a, [field]: value };
          if (field === 'isCompleted') {
            next.completedAt = value ? (a.completedAt || new Date().toISOString()) : null;
          }
          return next;
        }
        return a;
      })
    );
  };

  // Investor management
  const addInvestor = () => {
    setInvestors((prev) => [
      ...prev,
      {
        id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: '',
        tier: 'Tier 2',
        amount: null,
        roundDate: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const removeInvestor = (id: string) => {
    setInvestors((prev) => prev.filter((i) => i.id !== id));
  };

  const updateInvestor = (id: string, field: string, value: any) => {
    setInvestors((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  // Custom Socials management
  const addCustomSocial = () => {
    setCustomSocials((prev) => [
      ...prev,
      {
        id: 'soc_' + Date.now(),
        name: 'Warpcast / Lens',
        url: '',
      },
    ]);
  };

  const removeCustomSocial = (id: string) => {
    setCustomSocials((prev) => prev.filter((s) => s.id !== id));
  };

  const updateCustomSocial = (id: string, field: string, value: string) => {
    setCustomSocials((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Toggle Reward Types multiselect
  const toggleRewardType = (type: RewardType) => {
    setRewardTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Toggle Tag
  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Total tokenomics sum
  const distributionSum =
    Number(teamPercent) +
    Number(investorsPercent) +
    Number(communityPercent) +
    Number(ecosystemPercent) +
    Number(reservePercent);

  // Form Submit & Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (!name.trim()) {
      validationErrors.push('Название проекта обязательно для заполнения');
    }

    if (description.length > 500) {
      validationErrors.push('Описание не может превышать 500 символов');
    }

    if (rewardStatus === 'claiming' || rewardStatus === 'confirmed') {
      if (!claimLink.trim()) {
        validationErrors.push(
          'Ссылка на получение награды обязательна для статусов "Получение" и "Подтверждена"'
        );
      }
    }

    if (distributionSum !== 100) {
      validationErrors.push(
        `Сумма распределения токеномики должна быть ровно 100% (текущая: ${distributionSum}%)`
      );
    }

    if (ticker && (ticker.length < 2 || ticker.length > 8)) {
      validationErrors.push('Тикер токена должен содержать от 2 до 8 символов');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      showToast('error', 'Ошибки валидации формы');
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    try {
      const projectPayload: Partial<Project> = {
        name: name.trim(),
        description: description.trim(),
        logo: logo.trim(),
        website: website.trim(),
        reward: {
          status: rewardStatus,
          claimLink: claimLink.trim(),
          statusUpdatedAt: new Date().toISOString(),
          rewardTypes,
          expectedAmount: expectedAmount.trim(),
        },
        activities: activities.filter((a) => a.name.trim().length > 0),
        investors: investors.filter((i) => i.name.trim().length > 0),
        tokenomics: {
          tokenName: tokenName.trim() || name.trim(),
          ticker: (ticker.trim() || 'TKN').toUpperCase(),
          totalSupply: totalSupply ? Number(totalSupply) : null,
          distribution: {
            team: Number(teamPercent),
            investors: Number(investorsPercent),
            community: Number(communityPercent),
            ecosystem: Number(ecosystemPercent),
            reserve: Number(reservePercent),
          },
          blockchain,
          tokenStandard: tokenStandard.trim() || 'ERC-20',
        },
        dates: {
          registrationStart: regStart || null,
          registrationEnd: regEnd || null,
          claimStart: claimStart || null,
          claimEnd: claimEnd || null,
        },
        socials: {
          twitter: twitter.trim(),
          telegram: telegram.trim(),
          discord: discord.trim(),
          medium: medium.trim(),
          github: github.trim(),
          youtube: youtube.trim(),
          reddit: reddit.trim(),
          custom: customSocials.filter((s) => s.name.trim().length > 0),
        },
        isFavorite,
        priority: Number(priority),
        category,
        tags,
        difficulty: Number(difficulty),
      };

      await onSave(projectPayload);
      onClose();
    } catch (err: any) {
      showToast('error', 'Ошибка сохранения проекта', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="admin-project-modal-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        id="admin-project-modal"
        className="relative w-full max-w-4xl bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden text-[#F0F6FC] my-auto flex flex-col max-h-[92vh]"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363D] bg-[#0D1117] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#238636]/20 border border-[#238636]/40 flex items-center justify-center text-[#3FB950]">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F0F6FC]">
                {isEdit ? `Редактирование: ${editingProject.name}` : 'Добавление нового проекта'}
              </h2>
              <p className="text-xs text-[#8B949E]">
                Панель управления проектами и активностями
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          
          {/* Error Banner */}
          {errors.length > 0 && (
            <div className="p-4 rounded-xl bg-[#F85149]/10 border border-[#F85149]/30 text-[#F85149] space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Пожалуйста, исправьте следующие ошибки:
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-xs text-[#F0F6FC]">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* SECTION 1.1: Main Project Details */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="text-xs font-bold text-[#58A6FF] uppercase tracking-wider">
              1.1 Основная информация о проекте
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Project Name */}
              <div>
                <label className="block font-medium text-[#8B949E] mb-1">
                  Название проекта <span className="text-[#F85149]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Monad, Berachain"
                  className="w-full px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                />
              </div>

              {/* Official Website */}
              <div>
                <label className="block font-medium text-[#8B949E] mb-1">
                  Официальный сайт (URL)
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.xyz"
                  className="w-full px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                />
              </div>
            </div>

            {/* Description up to 500 chars */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium text-[#8B949E]">
                  Описание проекта (до 500 символов)
                </label>
                <span className={`text-[10px] ${description.length > 500 ? 'text-[#F85149] font-bold' : 'text-[#8B949E]'}`}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание архитектуры, назначения и ключевых особенностей..."
                className="w-full px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
              />
            </div>

            {/* Logo Upload / URL */}
            <div>
              <label className="block font-medium text-[#8B949E] mb-1">
                Логотип проекта (URL или загрузка PNG/JPG/SVG макс. 2MB)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#21262D] border border-[#30363D] overflow-hidden flex items-center justify-center shrink-0">
                  {logo ? (
                    <img src={logo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-[#8B949E]">Лого</span>
                  )}
                </div>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                />
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#21262D] border border-[#30363D] hover:bg-[#30363D] cursor-pointer text-[#F0F6FC] transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5 text-[#58A6FF]" />
                  <span>Загрузить</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 1.3 & 1.4: Reward Status & Reward Type */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="text-xs font-bold text-[#58A6FF] uppercase tracking-wider">
              1.3 & 1.4 Статус и тип награды
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Status Select */}
              <div>
                <label className="block font-medium text-[#8B949E] mb-1">
                  Статус награды
                </label>
                <select
                  value={rewardStatus}
                  onChange={(e) => setRewardStatus(e.target.value as RewardStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                >
                  <option value="potential">🟡 Потенциально (Potential)</option>
                  <option value="registration">🟠 Регистрация (Registration)</option>
                  <option value="claiming">🟢 Получение (Claiming)</option>
                  <option value="confirmed">🔵 Подтверждена (Confirmed)</option>
                  <option value="completed">⚫ Завершена (Completed)</option>
                </select>
              </div>

              {/* Claim Link (required for claiming/confirmed) */}
              <div>
                <label className="block font-medium text-[#8B949E] mb-1">
                  Ссылка на страницу получения (Claim URL)
                  {(rewardStatus === 'claiming' || rewardStatus === 'confirmed') && (
                    <span className="text-[#F85149] ml-1">*</span>
                  )}
                </label>
                <input
                  type="url"
                  value={claimLink}
                  onChange={(e) => setClaimLink(e.target.value)}
                  placeholder="https://claim.project.xyz"
                  className={`w-full px-3 py-2 rounded-lg bg-[#161B22] border text-[#F0F6FC] focus:outline-none ${
                    (rewardStatus === 'claiming' || rewardStatus === 'confirmed') && !claimLink
                      ? 'border-[#F85149]/60'
                      : 'border-[#30363D] focus:border-[#58A6FF]'
                  }`}
                />
              </div>
            </div>

            {/* Reward Types Multiselect */}
            <div>
              <label className="block font-medium text-[#8B949E] mb-1.5">
                Тип награды (выберите один или несколько)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['tokens', 'role', 'points', 'nft', 'whitelist', 'ambassador'] as RewardType[]).map((type) => {
                  const isSelected = rewardTypes.includes(type);
                  const info = REWARD_TYPE_LABELS[type];
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => toggleRewardType(type)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-[#58A6FF] bg-[#58A6FF]/15 text-[#F0F6FC] font-medium'
                          : 'border-[#30363D] bg-[#161B22] text-[#8B949E] hover:text-[#F0F6FC]'
                      }`}
                    >
                      <span className="text-base">{info.icon}</span>
                      <span className="truncate">{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expected Reward Amount */}
            <div>
              <label className="block font-medium text-[#8B949E] mb-1">
                Ожидаемый размер награды
              </label>
              <input
                type="text"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(e.target.value)}
                placeholder="Например: 1000-5000 токенов, $500-$2000"
                className="w-full px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
              />
            </div>
          </div>

          {/* SECTION 1.2: Activities Management */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#58A6FF] uppercase tracking-wider">
                1.2 Активности проекта ({activities.length})
              </div>
              <button
                type="button"
                onClick={addActivity}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#21262D] text-[#58A6FF] border border-[#30363D] hover:bg-[#30363D] font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить активность</span>
              </button>
            </div>

            <div className="space-y-3">
              {activities.map((act, index) => (
                <div key={act.id} className="p-3 rounded-lg bg-[#161B22] border border-[#30363D] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#8B949E]">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeActivity(act.id)}
                      className="text-[#8B949E] hover:text-[#F85149] p-1"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Название активности *"
                      value={act.name}
                      onChange={(e) => updateActivity(act.id, 'name', e.target.value)}
                      className="sm:col-span-2 px-2.5 py-1.5 rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                      required
                    />

                    <select
                      value={act.type}
                      onChange={(e) => updateActivity(act.id, 'type', e.target.value)}
                      className="px-2.5 py-1.5 rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                    >
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Описание активности"
                      value={act.description || ''}
                      onChange={(e) => updateActivity(act.id, 'description', e.target.value)}
                      className="px-2.5 py-1.5 rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                    />
                    <input
                      type="url"
                      placeholder="Ссылка на активность (https://...)"
                      value={act.link || ''}
                      onChange={(e) => updateActivity(act.id, 'link', e.target.value)}
                      className="px-2.5 py-1.5 rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-[#30363D]/40">
                    <label className="flex items-center gap-1.5 text-[#F0F6FC] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={act.isCompleted}
                        onChange={(e) => updateActivity(act.id, 'isCompleted', e.target.checked)}
                        className="rounded bg-[#0D1117] border-[#30363D] text-[#3FB950]"
                      />
                      <span>Выполнено</span>
                    </label>

                    {act.isCompleted && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#8B949E]">Дата:</span>
                        <input
                          type="date"
                          value={act.completedAt ? act.completedAt.split('T')[0] : ''}
                          onChange={(e) => updateActivity(act.id, 'completedAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                          className="px-2 py-0.5 rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC]"
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-1.5 text-[#F0883E] cursor-pointer ml-auto">
                      <input
                        type="checkbox"
                        checked={act.isDailyReset}
                        onChange={(e) => updateActivity(act.id, 'isDailyReset', e.target.checked)}
                        className="rounded bg-[#0D1117] border-[#30363D] text-[#F0883E]"
                      />
                      <span>Сброс каждые 24ч (03:00 МСК)</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 1.5: Investors & Funds */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#58A6FF] uppercase tracking-wider">
                1.5 Фонды и инвесторы ({investors.length})
              </div>
              <button
                type="button"
                onClick={addInvestor}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#21262D] text-[#58A6FF] border border-[#30363D] hover:bg-[#30363D] font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить ещё инвестора</span>
              </button>
            </div>

            <div className="space-y-2">
              {investors.map((inv) => (
                <div key={inv.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 rounded-lg bg-[#161B22] border border-[#30363D]">
                  <input
                    type="text"
                    placeholder="Название фонда (a16z, Paradigm...)"
                    value={inv.name}
                    onChange={(e) => updateInvestor(inv.id, 'name', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                  />

                  <select
                    value={inv.tier}
                    onChange={(e) => updateInvestor(inv.id, 'tier', e.target.value)}
                    className="w-28 px-2.5 py-1.5 rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                  >
                    <option value="Tier 1">Tier 1</option>
                    <option value="Tier 2">Tier 2</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Сумма ($ USD)"
                    value={inv.amount || ''}
                    onChange={(e) => updateInvestor(inv.id, 'amount', e.target.value ? Number(e.target.value) : null)}
                    className="w-32 px-2.5 py-1.5 rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                  />

                  <input
                    type="date"
                    value={inv.roundDate || ''}
                    onChange={(e) => updateInvestor(inv.id, 'roundDate', e.target.value)}
                    className="w-32 px-2 py-1.5 rounded bg-[#0D1117] border border-[#30363D] text-[#F0F6FC]"
                  />

                  <button
                    type="button"
                    onClick={() => removeInvestor(inv.id)}
                    className="text-[#8B949E] hover:text-[#F85149] p-1.5"
                    title="Удалить"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 1.6: Tokenomics */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="text-xs font-bold text-[#58A6FF] uppercase tracking-wider">
              1.6 Токеномика
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block font-medium text-[#8B949E] mb-1">Название токена</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="Monad Token"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#8B949E] mb-1">Тикер (3-5 симв.)</label>
                <input
                  type="text"
                  value={ticker}
                  maxLength={8}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="MONAD"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF] uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-[#8B949E] mb-1">Total Supply</label>
                <input
                  type="number"
                  value={totalSupply}
                  onChange={(e) => setTotalSupply(e.target.value)}
                  placeholder="1000000000"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#8B949E] mb-1">Блокчейн</label>
                <select
                  value={blockchain}
                  onChange={(e) => setBlockchain(e.target.value as Blockchain)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
                >
                  {BLOCKCHAINS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#8B949E] mb-1">Стандарт токена</label>
              <input
                type="text"
                value={tokenStandard}
                onChange={(e) => setTokenStandard(e.target.value)}
                placeholder="ERC-20, SPL, BEP-20..."
                className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC] focus:outline-none focus:border-[#58A6FF]"
              />
            </div>

            {/* Token Distribution (Must equal 100%) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-medium text-[#8B949E]">
                  Распределение токенов (Сумма должна быть ровно 100%)
                </span>
                <span
                  className={`font-mono font-bold ${
                    distributionSum === 100 ? 'text-[#3FB950]' : 'text-[#F85149]'
                  }`}
                >
                  Сумма: {distributionSum}% {distributionSum === 100 ? '✓' : '(не равно 100%)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <span className="text-[10px] text-[#8B949E]">Команда (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={teamPercent}
                    onChange={(e) => setTeamPercent(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#8B949E]">Инвесторы (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={investorsPercent}
                    onChange={(e) => setInvestorsPercent(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#8B949E]">Сообщество (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={communityPercent}
                    onChange={(e) => setCommunityPercent(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#8B949E]">Экосистема (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={ecosystemPercent}
                    onChange={(e) => setEcosystemPercent(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#8B949E]">Резерв (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reservePercent}
                    onChange={(e) => setReservePercent(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1.7: Dates */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="text-xs font-bold text-[#58A6FF] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              1.7 Даты регистрации и получения
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-[#8B949E] mb-1">Старт регистрации</label>
                <input
                  type="date"
                  value={regStart}
                  onChange={(e) => setRegStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#8B949E] mb-1">Конец регистрации</label>
                <input
                  type="date"
                  value={regEnd}
                  onChange={(e) => setRegEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#8B949E] mb-1">Старт получения</label>
                <input
                  type="date"
                  value={claimStart}
                  onChange={(e) => setClaimStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#8B949E] mb-1">Конец получения</label>
                <input
                  type="date"
                  value={claimEnd}
                  onChange={(e) => setClaimEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 1.9: Social Networks */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#58A6FF] uppercase tracking-wider">
                1.9 Социальные сети проекта
              </div>
              <button
                type="button"
                onClick={addCustomSocial}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#21262D] text-[#58A6FF] border border-[#30363D] hover:bg-[#30363D]"
              >
                <Plus className="w-3 h-3" />
                <span>Добавить другую сеть</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <span className="text-[10px] text-[#8B949E]">Twitter / X (URL)</span>
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://x.com/project"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#8B949E]">Telegram (URL)</span>
                <input
                  type="url"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="https://t.me/project"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#8B949E]">Discord (URL)</span>
                <input
                  type="url"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="https://discord.gg/project"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#8B949E]">GitHub (URL)</span>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/project"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#8B949E]">Medium / Mirror (URL)</span>
                <input
                  type="url"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  placeholder="https://medium.com/@project"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#8B949E]">YouTube (URL)</span>
                <input
                  type="url"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@project"
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
              </div>
            </div>

            {/* Custom networks list */}
            {customSocials.map((cust) => (
              <div key={cust.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Название платформы"
                  value={cust.name}
                  onChange={(e) => updateCustomSocial(cust.id, 'name', e.target.value)}
                  className="w-1/3 px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
                <input
                  type="url"
                  placeholder="URL ссылка"
                  value={cust.url}
                  onChange={(e) => updateCustomSocial(cust.id, 'url', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
                <button
                  type="button"
                  onClick={() => removeCustomSocial(cust.id)}
                  className="text-[#8B949E] hover:text-[#F85149]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* SECTION 1.10: Favorite, Priority, Category, Tags, Difficulty */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="text-xs font-bold text-[#58A6FF] uppercase tracking-wider">
              1.10 Избранное, Приоритет и Категория
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* In Favorites */}
              <div className="flex items-center gap-2 p-2.5 rounded bg-[#161B22] border border-[#30363D]">
                <input
                  type="checkbox"
                  id="is-fav"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="rounded bg-[#0D1117] border-[#30363D] text-[#D29922]"
                />
                <label htmlFor="is-fav" className="cursor-pointer flex items-center gap-1.5 font-medium text-[#F0F6FC]">
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-[#D29922] text-[#D29922]' : 'text-[#8B949E]'}`} />
                  <span>В избранное на главной</span>
                </label>
              </div>

              {/* Priority 1-10 */}
              <div>
                <label className="block font-medium text-[#8B949E] mb-1">
                  Приоритет проекта (1 - 10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-medium text-[#8B949E] mb-1">Категория</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#161B22] border border-[#30363D] text-[#F0F6FC]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Difficulty Scale 1-5 */}
            <div>
              <label className="block font-medium text-[#8B949E] mb-1">
                Сложность выполнения (1 - 5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`flex-1 py-1.5 rounded font-semibold transition-all ${
                      difficulty === lvl
                        ? 'bg-[#58A6FF] text-black shadow-md'
                        : 'bg-[#161B22] border border-[#30363D] text-[#8B949E] hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block font-medium text-[#8B949E] mb-1.5">Теги проекта</label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TAGS.map((t) => {
                  const isSelected = tags.includes(t);
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={`px-2.5 py-1 rounded-md text-[11px] border transition-all ${
                        isSelected
                          ? 'border-[#58A6FF] bg-[#58A6FF]/20 text-[#58A6FF] font-semibold'
                          : 'border-[#30363D] bg-[#161B22] text-[#8B949E] hover:text-[#F0F6FC]'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363D]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#21262D] text-[#F0F6FC] hover:bg-[#30363D] transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-semibold shadow-lg shadow-[#238636]/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать проект'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
