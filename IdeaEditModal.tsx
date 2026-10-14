import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lightbulb, 
  Star, 
  Check, 
  Plus, 
  Trash2, 
  ExternalLink,
  Github,
  Globe,
  Palette,
  Link as LinkIcon
} from 'lucide-react';
import { ProjectIdea, IdeaStatus, IdeaType, IdeaLink } from '../../types';
import { IDEA_STATUS_LIST, IDEA_TYPE_MAP } from '../../utils/ideaUtils';

interface IdeaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: Partial<ProjectIdea>) => Promise<void>;
  ideaToEdit?: ProjectIdea | null;
}

export const IdeaEditModal: React.FC<IdeaEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  ideaToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [type, setType] = useState<IdeaType>('saas');
  const [status, setStatus] = useState<IdeaStatus>('fikir');
  const [isStarred, setIsStarred] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Detaylar
  const [problem, setProblem] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [monetization, setMonetization] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [techStack, setTechStack] = useState('');
  const [nextStep, setNextStep] = useState('');

  // Linkler
  const [links, setLinks] = useState<IdeaLink[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<'github' | 'live' | 'design' | 'other'>('github');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (ideaToEdit) {
        setTitle(ideaToEdit.title || '');
        setSummary(ideaToEdit.summary || '');
        setType(ideaToEdit.type || 'saas');
        setStatus(ideaToEdit.status || 'fikir');
        setIsStarred(!!ideaToEdit.isStarred);
        setTags(ideaToEdit.tags || []);
        setProblem(ideaToEdit.problem || '');
        setTargetAudience(ideaToEdit.targetAudience || '');
        setMonetization(ideaToEdit.monetization || '');
        setCompetitors(ideaToEdit.competitors || '');
        setTechStack(ideaToEdit.techStack || '');
        setNextStep(ideaToEdit.nextStep || '');
        setLinks(ideaToEdit.links || []);
      } else {
        setTitle('');
        setSummary('');
        setType('saas');
        setStatus('fikir');
        setIsStarred(false);
        setTags([]);
        setProblem('');
        setTargetAudience('');
        setMonetization('');
        setCompetitors('');
        setTechStack('');
        setNextStep('');
        setLinks([]);
      }
      setTagInput('');
      setNewLinkTitle('');
      setNewLinkUrl('');
      setNewLinkType('github');
    }
  }, [isOpen, ideaToEdit]);

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tToRemove: string) => {
    setTags(tags.filter((t) => t !== tToRemove));
  };

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    const titleVal = newLinkTitle.trim() || (
      newLinkType === 'github' ? 'GitHub Deposu' :
      newLinkType === 'live' ? 'Canlı Site' :
      newLinkType === 'design' ? 'Figma / Tasarım' : 'Bağlantı'
    );
    const newLink: IdeaLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: titleVal,
      url,
      type: newLinkType,
    };
    setLinks([...links, newLink]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    try {
      setSaving(true);
      await onSave({
        id: ideaToEdit?.id,
        title: title.trim(),
        summary: summary.trim() || undefined,
        type,
        status,
        isStarred,
        tags,
        problem: problem.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
        monetization: monetization.trim() || undefined,
        competitors: competitors.trim() || undefined,
        techStack: techStack.trim() || undefined,
        nextStep: nextStep.trim() || undefined,
        links,
        notes: ideaToEdit?.notes || [],
        todos: ideaToEdit?.todos || [],
        prompts: ideaToEdit?.prompts || [],
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <Lightbulb className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {ideaToEdit ? 'Fikri / Projeyi Düzenle' : 'Yeni Fikir & Proje'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                SaaS, mobil uygulama veya araç projesini yapılandır
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* 1. Temel Bilgiler */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                Fikir / Proje Başlığı <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsStarred(!isStarred)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                  isStarred
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-600'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{isStarred ? 'Önemli' : 'Önemli İşaretle'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: AI Destekli Müşteri Destek Asistanı (SaaS)"
              className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
            />

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tek Cümlelik Özet
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Örn: E-ticaret siteleri için gelen sipariş sorularını WhatsApp üzerinden yanıtlayan yapay zeka botu."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* 2. Tür ve Durum Seçimi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Proje Türü
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(IDEA_TYPE_MAP) as IdeaType[]).map((tKey) => {
                  const meta = IDEA_TYPE_MAP[tKey];
                  const isSelected = type === tKey;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setType(tKey)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition text-left flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 ring-1 ring-amber-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{meta.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Proje Durumu
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {IDEA_STATUS_LIST.map((s) => {
                  const isSelected = status === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition text-left flex items-center justify-between ${
                        isSelected
                          ? `${s.borderLight} ${s.bgLight} ${s.badgeText} ring-1 ring-amber-500`
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Etiketler */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Etiketler
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Etiket yazıp Ekle'ye bas (örn. b2b, ai, micro-saas)"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-750 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* 4. Detay Alanları */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-850/50 space-y-3.5">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Geliştirme & İş Modeli Detayları
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Çözdüğü Problem
                </label>
                <textarea
                  rows={2}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Kullanıcıların hangi acı noktasını çözüyor?"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hedef Kullanıcı
                </label>
                <textarea
                  rows={2}
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Kimler kullanır? (Örn: Shopify mağaza sahipleri)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nasıl Para Kazanır? (Monetization)
                </label>
                <textarea
                  rows={2}
                  value={monetization}
                  onChange={(e) => setMonetization(e.target.value)}
                  placeholder="Aylık abonelik ($29/ay), kullanım başına ücret, freemium vb."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rakipler / Benzerleri
                </label>
                <textarea
                  rows={2}
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  placeholder="Mevcut alternatifler, artı ve eksileri..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kullanılacak Teknolojiler (Tech Stack)
              </label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="Örn: Next.js, Supabase, Tailwind, Stripe, OpenAI / Gemini API"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bir Sonraki Adım <span className="text-amber-600 dark:text-amber-400">(Bugün ekranında görünür)</span>
              </label>
              <input
                type="text"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                placeholder="Örn: Landing page taslağını çiz ve 5 potansiyel müşteriye göster"
                className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          {/* 5. Linkler */}
          <div className="space-y-2.5">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              Linkler & Bağlantılar (GitHub, Canlı Site, Tasarım)
            </label>

            {links.length > 0 && (
              <div className="space-y-1.5">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {link.type === 'github' && <Github className="w-4 h-4 text-slate-700 dark:text-slate-300 flex-shrink-0" />}
                      {link.type === 'live' && <Globe className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      {link.type === 'design' && <Palette className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                      {(!link.type || link.type === 'other') && <LinkIcon className="w-4 h-4 text-sky-600 flex-shrink-0" />}
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{link.title}:</span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-600 dark:text-teal-400 hover:underline truncate text-[11px]"
                      >
                        {link.url}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(link.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newLinkType}
                  onChange={(e) => setNewLinkType(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="github">GitHub</option>
                  <option value="live">Canlı Site</option>
                  <option value="design">Tasarım (Figma)</option>
                  <option value="other">Diğer</option>
                </select>

                <input
                  type="text"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Başlık (örn: Frontend Deposu)"
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none placeholder-slate-400"
                />

                <input
                  type="text"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="URL (örn: github.com/...)"
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1 transition text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link Ekle</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            İptal
          </button>

          <button
            type="button"
            disabled={!title.trim() || saving}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Kaydediliyor...' : ideaToEdit ? 'Değişiklikleri Kaydet' : 'Fikri Kaydet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
