import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Plus, Save, Trash2, Upload } from "lucide-react";
import type { Activity, ActivityType, Deadline, DeadlineKind, Investor, InvestorTier, Project, ProjectStatus, RewardType, TokenSlice } from "../lib/types";
import { ACTIVITY_TYPES, BLOCKCHAINS, CATEGORIES, DEADLINE_KINDS, REWARD_LIST, SLICE_PALETTE, STATUS_LIST } from "../lib/types";
import { uid } from "../lib/utils";
import { useStore } from "../lib/store";
import { Field, LogoAvatar, Modal, ModalHeader, Toggle } from "./ui";
import { cx } from "../lib/utils";

interface Draft {
  name: string;
  ticker: string;
  website: string;
  logoUrl: string;
  description: string;
  status: ProjectStatus;
  blockchain: string;
  priority: Project["priority"];
  difficulty: Project["difficulty"];
  claimUrl: string;
  tokenStandard: string;
  totalSupply: string;
  categories: string[];
  tags: string;
  rewardTypes: RewardType[];
  deadlines: Deadline[];
  activities: Activity[];
  investors: Investor[];
  tokenomics: TokenSlice[];
}

function toDraft(p?: Project): Draft {
  return {
    name: p?.name ?? "",
    ticker: p?.ticker ?? "",
    website: p?.website ?? "",
    logoUrl: p?.logoUrl ?? "",
    description: p?.description ?? "",
    status: p?.status ?? "potential",
    blockchain: p?.blockchain ?? BLOCKCHAINS[0],
    priority: p?.priority ?? "medium",
    difficulty: p?.difficulty ?? "medium",
    claimUrl: p?.claimUrl ?? "",
    tokenStandard: p?.tokenStandard ?? "",
    totalSupply: p?.totalSupply ?? "",
    categories: p?.categories ?? [],
    tags: p?.tags.join(", ") ?? "",
    rewardTypes: p?.rewardTypes ?? ["airdrop"],
    deadlines: p?.deadlines.map((d) => ({ ...d })) ?? [],
    activities: p?.activities.map((a) => ({ ...a })) ?? [],
    investors: p?.investors.map((i) => ({ ...i })) ?? [],
    tokenomics: p?.tokenomics.map((s) => ({ ...s })) ?? [
      { id: uid("ts"), label: "Комьюнити", value: 40, color: SLICE_PALETTE[0] },
      { id: uid("ts"), label: "Инвесторы", value: 25, color: SLICE_PALETTE[1] },
      { id: uid("ts"), label: "Команда", value: 20, color: SLICE_PALETTE[2] },
      { id: uid("ts"), label: "Экосистема", value: 15, color: SLICE_PALETTE[3] },
    ],
  };
}

const sectionCls = "rounded-xl border border-line bg-raised/40 p-4";
const h5Cls = "mb-3 flex items-center justify-between font-display text-[11px] font-bold uppercase tracking-wider text-txt";
const addBtnCls = "inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-bold text-mut transition-colors hover:border-brand hover:text-brand";
const delBtnCls = "text-mut transition-colors hover:text-danger shrink-0";

export function ProjectForm({ initial, onClose }: { initial?: Project; onClose: () => void }) {
  const { addProject, updateProject, toast } = useStore();
  const [d, setD] = useState<Draft>(() => toDraft(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  const descLen = d.description.length;
  const sliceSum = useMemo(() => Math.round(d.tokenomics.reduce((s, x) => s + x.value, 0) * 10) / 10, [d.tokenomics]);
  const slicesValid = d.tokenomics.length === 0 || sliceSum === 100;

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast("Файл больше 2MB — выберите изображение меньшего размера", "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast("Можно загружать только изображения", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set({ logoUrl: String(reader.result) });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = "Укажите название проекта";
    if (!d.ticker.trim()) e.ticker = "Укажите тикер токена";
    if (descLen > 500) e.description = "Описание длиннее 500 символов";
    if (!slicesValid) e.tokenomics = `Сумма долей ${sliceSum}% — должно быть ровно 100%`;
    if (d.activities.some((a) => !a.title.trim())) e.activities = "У всех активностей должно быть название";
    if (d.investors.some((i) => !i.name.trim())) e.investors = "У всех инвесторов должно быть имя";
    if (d.deadlines.some((x) => !x.date || !x.title.trim())) e.deadlines = "Заполните дату и название у всех дедлайнов";
    setErrors(e);
    if (Object.keys(e).length > 0) toast("Форма содержит ошибки — проверьте выделенные поля", "error");
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const project: Project = {
      id: initial?.id ?? uid("p"),
      createdAt: initial?.createdAt ?? Date.now(),
      name: d.name.trim(),
      ticker: d.ticker.trim().toUpperCase().replace(/^\$/, ""),
      website: d.website.trim() || undefined,
      logoUrl: d.logoUrl || undefined,
      description: d.description.trim(),
      status: d.status,
      blockchain: d.blockchain,
      priority: d.priority,
      difficulty: d.difficulty,
      claimUrl: d.claimUrl.trim() || undefined,
      tokenStandard: d.tokenStandard.trim() || undefined,
      totalSupply: d.totalSupply.trim() || undefined,
      categories: d.categories,
      tags: d.tags.split(",").map((t) => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean),
      rewardTypes: d.rewardTypes,
      deadlines: d.deadlines,
      activities: d.activities,
      investors: d.investors,
      tokenomics: d.tokenomics,
    };
    if (initial) updateProject(project);
    else addProject(project);
    onClose();
  };

  return (
    <Modal open onClose={onClose} width="max-w-3xl">
      <ModalHeader
        onClose={onClose}
        title={initial ? "Редактирование проекта" : "Новый проект"}
        subtitle={initial ? `${initial.name} · $${initial.ticker}` : "Добавление доступно только администратору"}
      />
      <div className="max-h-[72vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
        {/* основное */}
        <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
          <div className="flex flex-col items-center gap-2">
            <LogoAvatar project={{ id: initial?.id ?? "new", name: d.name || "New", ticker: d.ticker || "N", logoUrl: d.logoUrl || undefined }} size={84} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <button className={addBtnCls} onClick={() => fileRef.current?.click()}>
              <Upload size={12} /> Файл ≤2MB
            </button>
            {d.logoUrl && <button className="text-[10px] font-bold text-mut hover:text-danger" onClick={() => set({ logoUrl: "" })}>убрать</button>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Название *" error={errors.name}>
              <input className="input" value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Monad" />
            </Field>
            <Field label="Тикер *" error={errors.ticker}>
              <input className="input font-mono" value={d.ticker} onChange={(e) => set({ ticker: e.target.value })} placeholder="MON" />
            </Field>
            <Field label="Официальный сайт">
              <input className="input" value={d.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://…" />
            </Field>
            <Field label="Логотип (URL)" hint="или файл слева ≤2MB">
              <input className="input" value={d.logoUrl.startsWith("data:") ? "" : d.logoUrl} onChange={(e) => set({ logoUrl: e.target.value })} placeholder="https://…/logo.png" />
            </Field>
            <Field label="Claim URL">
              <input className="input" value={d.claimUrl} onChange={(e) => set({ claimUrl: e.target.value })} placeholder="https://claim…" />
            </Field>
            <Field label="Статус аирдропа">
              <select className="input" value={d.status} onChange={(e) => set({ status: e.target.value as ProjectStatus })}>
                {STATUS_LIST.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Блокчейн">
              <select className="input" value={d.blockchain} onChange={(e) => set({ blockchain: e.target.value })}>
                {BLOCKCHAINS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Приоритет">
              <select className="input" value={d.priority} onChange={(e) => set({ priority: e.target.value as Project["priority"] })}>
                <option value="high">Высокий</option><option value="medium">Средний</option><option value="low">Низкий</option>
              </select>
            </Field>
            <Field label="Сложность">
              <select className="input" value={d.difficulty} onChange={(e) => set({ difficulty: e.target.value as Project["difficulty"] })}>
                <option value="easy">Лёгкая</option><option value="medium">Средняя</option><option value="hard">Сложная</option>
              </select>
            </Field>
          </div>
        </div>

        <Field label="Описание" error={errors.description} hint={<span className={cx(descLen > 500 ? "text-danger" : descLen > 420 ? "text-amber" : "text-mut")}>{descLen}/500</span>}>
          <textarea className="input min-h-[92px] resize-y" value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="Что за проект, почему ожидается аирдроп, что делать…" />
        </Field>

        {/* категории и теги */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Категории">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const on = d.categories.includes(c);
                return (
                  <button key={c} type="button" onClick={() => set({ categories: on ? d.categories.filter((x) => x !== c) : [...d.categories, c] })}
                    className={cx("chip !py-1 transition-colors", on ? "!border-brand !bg-brand/15 !text-brand" : "text-mut")}>
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="space-y-3">
            <Field label="Теги (через запятую)">
              <input className="input" value={d.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="testnet, points, paradigm" />
            </Field>
            <Field label="Типы вознаграждений">
              <div className="flex flex-wrap gap-1.5">
                {REWARD_LIST.map((r) => {
                  const on = d.rewardTypes.includes(r.id);
                  return (
                    <button key={r.id} type="button" onClick={() => set({ rewardTypes: on ? d.rewardTypes.filter((x) => x !== r.id) : [...d.rewardTypes, r.id] })}
                      className={cx("chip !py-1 transition-colors", on ? "!border-sky !bg-sky/15 !text-sky" : "text-mut")}>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </div>

        {/* активности */}
        <section className={sectionCls}>
          <div className={h5Cls}>
            <span>▤ Активности чек-листа · {d.activities.length}</span>
            <button className={addBtnCls} onClick={() => set({ activities: [...d.activities, { id: uid("act"), title: "", type: "testnet" as ActivityType, dailyReset: false, done: false }] })}>
              <Plus size={12} /> Добавить
            </button>
          </div>
          {errors.activities && <p className="mb-2 text-xs font-semibold text-danger">{errors.activities}</p>}
          <div className="space-y-2">
            {d.activities.map((a, idx) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-linesoft bg-panel p-2">
                <span className="w-5 text-center font-mono text-[10px] font-bold text-mut">{idx + 1}</span>
                <input className="input !w-auto flex-1 !py-1.5 !text-xs" value={a.title} placeholder="Название задания"
                  onChange={(e) => set({ activities: d.activities.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)) })} />
                <select className="input !w-auto !py-1.5 !text-xs" value={a.type}
                  onChange={(e) => set({ activities: d.activities.map((x) => (x.id === a.id ? { ...x, type: e.target.value as ActivityType } : x)) })}>
                  {ACTIVITY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <input className="input !w-36 !py-1.5 !text-xs" value={a.url ?? ""} placeholder="https://ссылка"
                  onChange={(e) => set({ activities: d.activities.map((x) => (x.id === a.id ? { ...x, url: e.target.value } : x)) })} />
                <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-bold text-mut" title="Сброс каждые 24 часа в 03:00 МСК">
                  <input type="checkbox" className="dt-check" checked={a.dailyReset}
                    onChange={(e) => set({ activities: d.activities.map((x) => (x.id === a.id ? { ...x, dailyReset: e.target.checked } : x)) })} />
                  24ч
                </label>
                <button className={delBtnCls} onClick={() => set({ activities: d.activities.filter((x) => x.id !== a.id) })}><Trash2 size={14} /></button>
              </div>
            ))}
            {d.activities.length === 0 && <p className="text-xs text-mut">Добавьте задания, чтобы отслеживать прогресс проекта.</p>}
          </div>
        </section>

        {/* инвесторы */}
        <section className={sectionCls}>
          <div className={h5Cls}>
            <span>⌂ Инвесторы и раунды · {d.investors.length}</span>
            <button className={addBtnCls} onClick={() => set({ investors: [...d.investors, { id: uid("inv"), name: "", tier: 2 as InvestorTier }] })}>
              <Plus size={12} /> Добавить
            </button>
          </div>
          {errors.investors && <p className="mb-2 text-xs font-semibold text-danger">{errors.investors}</p>}
          <div className="space-y-2">
            {d.investors.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-linesoft bg-panel p-2">
                <input className="input !w-auto flex-1 !py-1.5 !text-xs" value={i.name} placeholder="Paradigm"
                  onChange={(e) => set({ investors: d.investors.map((x) => (x.id === i.id ? { ...x, name: e.target.value } : x)) })} />
                <select className="input !w-auto !py-1.5 !text-xs" value={String(i.tier)}
                  onChange={(e) => set({ investors: d.investors.map((x) => (x.id === i.id ? { ...x, tier: Number(e.target.value) as InvestorTier } : x)) })}>
                  <option value="1">Tier 1</option><option value="2">Tier 2</option>
                </select>
                <input className="input !w-32 !py-1.5 !text-xs font-mono" type="number" min={0} value={i.amountUsd ?? ""} placeholder="Сумма $"
                  onChange={(e) => set({ investors: d.investors.map((x) => (x.id === i.id ? { ...x, amountUsd: e.target.value ? Number(e.target.value) : undefined } : x)) })} />
                <input className="input !w-34 !py-1.5 !text-xs" type="date" value={i.roundDate ?? ""}
                  onChange={(e) => set({ investors: d.investors.map((x) => (x.id === i.id ? { ...x, roundDate: e.target.value || undefined } : x)) })} />
                <button className={delBtnCls} onClick={() => set({ investors: d.investors.filter((x) => x.id !== i.id) })}><Trash2 size={14} /></button>
              </div>
            ))}
            {d.investors.length === 0 && <p className="text-xs text-mut">Без инвесторов — отметьте проект как комьюнити-драйвен.</p>}
          </div>
        </section>

        {/* дедлайны */}
        <section className={sectionCls}>
          <div className={h5Cls}>
            <span>◷ Дедлайны · {d.deadlines.length}</span>
            <button className={addBtnCls} onClick={() => set({ deadlines: [...d.deadlines, { id: uid("dl"), date: new Date().toISOString().slice(0, 10), kind: "claim" as DeadlineKind, title: "" }] })}>
              <Plus size={12} /> Добавить
            </button>
          </div>
          {errors.deadlines && <p className="mb-2 text-xs font-semibold text-danger">{errors.deadlines}</p>}
          <div className="space-y-2">
            {d.deadlines.map((dl) => (
              <div key={dl.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-linesoft bg-panel p-2">
                <input className="input !w-36 !py-1.5 !text-xs" type="date" value={dl.date}
                  onChange={(e) => set({ deadlines: d.deadlines.map((x) => (x.id === dl.id ? { ...x, date: e.target.value } : x)) })} />
                <select className="input !w-auto !py-1.5 !text-xs" value={dl.kind}
                  onChange={(e) => set({ deadlines: d.deadlines.map((x) => (x.id === dl.id ? { ...x, kind: e.target.value as DeadlineKind } : x)) })}>
                  {DEADLINE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
                <input className="input !w-auto flex-1 !py-1.5 !text-xs" value={dl.title} placeholder="Клейм токена"
                  onChange={(e) => set({ deadlines: d.deadlines.map((x) => (x.id === dl.id ? { ...x, title: e.target.value } : x)) })} />
                <button className={delBtnCls} onClick={() => set({ deadlines: d.deadlines.filter((x) => x.id !== dl.id) })}><Trash2 size={14} /></button>
              </div>
            ))}
            {d.deadlines.length === 0 && <p className="text-xs text-mut">Дедлайны попадут в календарь и .ics-экспорт.</p>}
          </div>
        </section>

        {/* токеномика */}
        <section className={sectionCls}>
          <div className={h5Cls}>
            <span>◕ Токеномика</span>
            <button className={addBtnCls} onClick={() => set({ tokenomics: [...d.tokenomics, { id: uid("ts"), label: "", value: 0, color: SLICE_PALETTE[d.tokenomics.length % SLICE_PALETTE.length] }] })}>
              <Plus size={12} /> Доля
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Стандарт токена">
              <input className="input" value={d.tokenStandard} onChange={(e) => set({ tokenStandard: e.target.value })} placeholder="ERC-20" />
            </Field>
            <Field label="Total Supply">
              <input className="input" value={d.totalSupply} onChange={(e) => set({ totalSupply: e.target.value })} placeholder="1 000 000 000" />
            </Field>
          </div>
          <div className="mt-3 space-y-2">
            {d.tokenomics.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-linesoft bg-panel p-2">
                <input type="color" value={s.color} className="h-7 w-9 shrink-0 cursor-pointer rounded border border-line bg-transparent p-0.5"
                  onChange={(e) => set({ tokenomics: d.tokenomics.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)) })} />
                <input className="input !w-auto flex-1 !py-1.5 !text-xs" value={s.label} placeholder="Комьюнити"
                  onChange={(e) => set({ tokenomics: d.tokenomics.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)) })} />
                <div className="relative">
                  <input className="input !w-24 !py-1.5 !pr-7 !text-xs font-mono text-right" type="number" step="0.1" min={0} max={100} value={s.value || ""} placeholder="0"
                    onChange={(e) => set({ tokenomics: d.tokenomics.map((x) => (x.id === s.id ? { ...x, value: Number(e.target.value) } : x)) })} />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-mut">%</span>
                </div>
                <button className={delBtnCls} onClick={() => set({ tokenomics: d.tokenomics.filter((x) => x.id !== s.id) })}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className={cx("mt-3 flex items-center justify-between rounded-lg border px-3 py-2 font-mono text-xs font-extrabold", slicesValid ? "border-brand/50 bg-brand/10 text-brand" : "border-danger/50 bg-danger/10 text-danger")}>
            <span>Σ распределение долей</span>
            <span>{sliceSum}% {slicesValid ? "· верно" : "· нужно ровно 100%"}</span>
          </div>
          {errors.tokenomics && <p className="mt-2 text-xs font-semibold text-danger">{errors.tokenomics}</p>}
        </section>

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <Toggle checked={d.status === "claiming"} onChange={() => set({ status: d.status === "claiming" ? "confirmed" : "claiming" })} label="Статус «Получение» — клейм активен" />
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>Отмена</button>
            <button className="btn-primary" onClick={submit}>
              <Save size={15} /> {initial ? "Сохранить" : "Добавить проект"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
