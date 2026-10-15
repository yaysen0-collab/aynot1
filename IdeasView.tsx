import React, { useState, useMemo } from 'react';
import { 
  Lightbulb, 
  Plus, 
  Search, 
  LayoutList, 
  Columns3, 
  Star, 
  Filter, 
  ArrowUpDown, 
  Archive, 
  CheckSquare, 
  Rocket, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  ExternalLink,
  Tag
} from 'lucide-react';
import { ProjectIdea, IdeaStatus, IdeaType } from '../../types';
import { 
  IDEA_STATUS_LIST, 
  IDEA_TYPE_MAP, 
  getStatusMeta, 
  calculateIdeaProgress 
} from '../../utils/ideaUtils';
import { IdeaDetailView } from './IdeaDetailView';
import { QuickIdeaModal } from './QuickIdeaModal';
import { IdeaEditModal } from './IdeaEditModal';

interface IdeasViewProps {
  ideas: ProjectIdea[];
  onSaveIdea: (idea: Partial<ProjectIdea>) => Promise<void>;
  onUpdateIdea: (idea: ProjectIdea) => Promise<void>;
  onDeleteIdea: (id: string) => Promise<void>;
  voiceNotesEnabled?: boolean;
  initialSelectedIdeaId?: string | null;
  onClearInitialSelectedIdeaId?: () => void;
}

export const IdeasView: React.FC<IdeasViewProps> = ({
  ideas,
  onSaveIdea,
  onUpdateIdea,
  onDeleteIdea,
  voiceNotesEnabled = true,
  initialSelectedIdeaId,
  onClearInitialSelectedIdeaId,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [starredOnly, setStarredOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt'>('updatedAt');

  // Modals & detail view state
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(initialSelectedIdeaId || null);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ideaToEdit, setIdeaToEdit] = useState<ProjectIdea | null>(null);

  // If initialSelectedIdeaId changes from outside (e.g. today view or search jump)
  React.useEffect(() => {
    if (initialSelectedIdeaId) {
      setSelectedIdeaId(initialSelectedIdeaId);
      if (onClearInitialSelectedIdeaId) {
        onClearInitialSelectedIdeaId();
      }
    }
  }, [initialSelectedIdeaId, onClearInitialSelectedIdeaId]);

  // Selected idea object
  const activeIdea = useMemo(() => {
    return ideas.find((i) => i.id === selectedIdeaId) || null;
  }, [ideas, selectedIdeaId]);

  // Filtered & sorted ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      // 1. Archive filter
      if (!showArchived && idea.status === 'rafa_kaldirildi') {
        return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = idea.title.toLowerCase().includes(q);
        const matchSummary = idea.summary?.toLowerCase().includes(q);
        const matchTags = idea.tags?.some((t) => t.toLowerCase().includes(q));
        const matchNext = idea.nextStep?.toLowerCase().includes(q);
        const matchProblem = idea.problem?.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchTags && !matchNext && !matchProblem) {
          return false;
        }
      }

      // 3. Type filter
      if (selectedType !== 'all' && idea.type !== selectedType) {
        return false;
      }

      // 4. Status filter
      if (selectedStatus !== 'all' && idea.status !== selectedStatus) {
        return false;
      }

      // 5. Starred filter
      if (starredOnly && !idea.isStarred) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'createdAt') {
        return b.createdAt - a.createdAt;
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [ideas, showArchived, searchQuery, selectedType, selectedStatus, starredOnly, sortBy]);

  // Star toggle
  const handleToggleStar = async (idea: ProjectIdea, e: React.MouseEvent) => {
    e.stopPropagation();
    await onUpdateIdea({
      ...idea,
      isStarred: !idea.isStarred,
      updatedAt: Date.now(),
    });
  };

  // Status changer from card menu
  const handleStatusChange = async (idea: ProjectIdea, newStatus: IdeaStatus, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    await onUpdateIdea({
      ...idea,
      status: newStatus,
      updatedAt: Date.now(),
    });
  };

  // Quick save handler with option to open detail
  const handleQuickSave = async (partialIdea: Partial<ProjectIdea>, openDetail?: boolean) => {
    const newId = `idea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullIdea: ProjectIdea = {
      id: newId,
      title: partialIdea.title || 'Yeni Fikir',
      summary: partialIdea.summary,
      type: partialIdea.type || 'saas',
      status: partialIdea.status || 'fikir',
      isStarred: partialIdea.isStarred ?? false,
      tags: partialIdea.tags || [],
      problem: partialIdea.problem,
      targetAudience: partialIdea.targetAudience,
      monetization: partialIdea.monetization,
      competitors: partialIdea.competitors,
      techStack: partialIdea.techStack,
      nextStep: partialIdea.nextStep,
      links: partialIdea.links || [],
      notes: partialIdea.notes || [],
      todos: partialIdea.todos || [],
      prompts: partialIdea.prompts || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await onSaveIdea(fullIdea);
    if (openDetail) {
      setSelectedIdeaId(newId);
    }
  };

  // If an idea is selected, show detail view
  if (activeIdea) {
    return (
      <IdeaDetailView
        idea={activeIdea}
        onBack={() => setSelectedIdeaId(null)}
        onUpdateIdea={onUpdateIdea}
        onDeleteIdea={onDeleteIdea}
        onEditIdea={(idea) => {
          setIdeaToEdit(idea);
          setIsEditModalOpen(true);
        }}
        voiceNotesEnabled={voiceNotesEnabled}
      />
    );
  }

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <Lightbulb className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Fikirler & Projeler
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredIdeas.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            SaaS fikirleri, MVP yapılacaklar listeleri ve yapay zeka promptları
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View mode toggle: List / Kanban */}
          <div className="p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              title="Liste Görünümü"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-xl transition ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              title="Pano (Kanban) Görünümü"
            >
              <Columns3 className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsQuickModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Hızlı Fikir</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Fikirlerde ara (başlık, özet, etiket, problem)..."
            className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Type filters */}
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-2.5 py-1 rounded-xl font-semibold transition ${
              selectedType === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Tüm Türler
          </button>
          {(Object.keys(IDEA_TYPE_MAP) as IdeaType[]).map((tKey) => (
            <button
              key={tKey}
              type="button"
              onClick={() => setSelectedType(tKey === selectedType ? 'all' : tKey)}
              className={`px-2.5 py-1 rounded-xl font-semibold transition ${
                selectedType === tKey
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {IDEA_TYPE_MAP[tKey].label}
            </button>
          ))}

          {/* Starred only toggle */}
          <button
            type="button"
            onClick={() => setStarredOnly(!starredOnly)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold transition ml-auto ${
              starredOnly
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>Yıldızlılar</span>
          </button>

          {/* Archive toggle */}
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold transition ${
              showArchived
                ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Rafa Kaldırılanlar Açık' : 'Arşivi Göster'}</span>
          </button>

          {/* Sort selector */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 pl-1">
            <ArrowUpDown className="w-3 h-3" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="updatedAt">Son Güncellenen</option>
              <option value="createdAt">Oluşturulma Tarihi</option>
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredIdeas.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto">
                <Lightbulb className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Fikir bulunamadı
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Filtreleri temizleyebilir veya yukarıdaki "Hızlı Fikir" butonuyla ilk SaaS veya proje fikrinizi hemen ekleyebilirsiniz.
              </p>
              <button
                type="button"
                onClick={() => setIsQuickModalOpen(true)}
                className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>İlk Fikrini Ekle</span>
              </button>
            </div>
          ) : (
            filteredIdeas.map((idea) => {
              const statusMeta = getStatusMeta(idea.status);
              const typeMeta = IDEA_TYPE_MAP[idea.type] || IDEA_TYPE_MAP.other;
              const progress = calculateIdeaProgress(idea);

              return (
                <div
                  key={idea.id}
                  onClick={() => setSelectedIdeaId(idea.id)}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer group space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeMeta.badgeClass}`}>
                          {typeMeta.label}
                        </span>

                        {/* Status dropdown button on card */}
                        <div 
                          className="relative inline-block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={idea.status}
                            onChange={(e) => handleStatusChange(idea, e.target.value as IdeaStatus, e)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none appearance-none pr-5 ${statusMeta.borderLight} ${statusMeta.bgLight} ${statusMeta.badgeText}`}
                          >
                            {IDEA_STATUS_LIST.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>

                        {idea.tags && idea.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {idea.tags.slice(0, 3).map((t) => (
                              <span key={t} className="text-[10px] text-slate-500 font-medium">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-snug">
                        {idea.title}
                      </h3>

                      {idea.summary && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {idea.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(idea, e)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
                      >
                        <Star className={`w-4 h-4 ${idea.isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>

                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>

                  {/* Next Step Banner */}
                  {idea.nextStep && (
                    <div className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-center gap-2 text-xs">
                      <Rocket className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="text-amber-900 dark:text-amber-200 font-medium truncate">
                        <strong className="font-bold">Sonraki Adım:</strong> {idea.nextStep}
                      </span>
                    </div>
                  )}

                  {/* Progress bar & metadata footer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      {idea.todos && idea.todos.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            %{progress.percent} ({progress.completed}/{progress.total})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Yapılacak eklenmedi</span>
                      )}

                      {idea.prompts && idea.prompts.length > 0 && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          ⚡ {idea.prompts.length} Prompt
                        </span>
                      )}

                      {idea.notes && idea.notes.length > 0 && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          📝 {idea.notes.length} Not
                        </span>
                      )}
                    </div>

                    <span className="text-[11px]">
                      {new Date(idea.updatedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CONTENT: KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex items-start gap-3 min-w-[720px]">
            {IDEA_STATUS_LIST.filter((s) => showArchived || s.id !== 'rafa_kaldirildi').map((colStatus) => {
              const colIdeas = filteredIdeas.filter((i) => i.status === colStatus.id);

              return (
                <div
                  key={colStatus.id}
                  className="flex-1 min-w-[220px] rounded-3xl bg-slate-100/80 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 p-3 space-y-3 flex flex-col"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${colStatus.badgeBg}`} />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {colStatus.label}
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-xs">
                      {colIdeas.length}
                    </span>
                  </div>

                  {/* Cards in Column */}
                  <div className="space-y-2.5 flex-1">
                    {colIdeas.length === 0 ? (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-750 text-center text-[11px] text-slate-400">
                        Bu sütunda fikir yok
                      </div>
                    ) : (
                      colIdeas.map((idea) => {
                        const typeMeta = IDEA_TYPE_MAP[idea.type] || IDEA_TYPE_MAP.other;
                        const progress = calculateIdeaProgress(idea);

                        return (
                          <div
                            key={idea.id}
                            onClick={() => setSelectedIdeaId(idea.id)}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-teal-400 shadow-sm cursor-pointer space-y-2 group transition"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${typeMeta.badgeClass}`}>
                                {typeMeta.label}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleToggleStar(idea, e)}
                                className="text-slate-400 hover:text-amber-500"
                              >
                                <Star className={`w-3.5 h-3.5 ${idea.isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                              </button>
                            </div>

                            <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-teal-600 transition">
                              {idea.title}
                            </h5>

                            {idea.nextStep && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium line-clamp-2">
                                🚀 {idea.nextStep}
                              </p>
                            )}

                            {/* Status changer select */}
                            <div 
                              className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="relative">
                                <select
                                  value={idea.status}
                                  onChange={(e) => handleStatusChange(idea, e.target.value as IdeaStatus, e)}
                                  className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer"
                                >
                                  {IDEA_STATUS_LIST.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {idea.todos && idea.todos.length > 0 && (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  %{progress.percent}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK IDEA MODAL */}
      <QuickIdeaModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        onSave={handleQuickSave}
        voiceNotesEnabled={voiceNotesEnabled}
      />

      {/* FULL EDIT MODAL */}
      <IdeaEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setIdeaToEdit(null);
        }}
        onSave={async (updatedData) => {
          if (ideaToEdit) {
            await onUpdateIdea({
              ...ideaToEdit,
              ...updatedData,
              updatedAt: Date.now(),
            } as ProjectIdea);
          } else {
            await onSaveIdea(updatedData);
          }
        }}
        ideaToEdit={ideaToEdit}
      />
    </div>
  );
};
