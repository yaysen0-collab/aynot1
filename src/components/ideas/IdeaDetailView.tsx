import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Star, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Plus, 
  CheckSquare, 
  Square, 
  Sparkles, 
  FileText, 
  Terminal, 
  ExternalLink,
  ChevronDown,
  Calendar,
  Layers,
  Archive,
  Rocket,
  Compass,
  Search,
  Lightbulb,
  Mic,
  MicOff,
  Github,
  Globe,
  Palette,
  Link as LinkIcon
} from 'lucide-react';
import { 
  ProjectIdea, 
  IdeaStatus, 
  IdeaTodo, 
  IdeaPrompt, 
  IdeaNote 
} from '../../types';
import { 
  IDEA_STATUS_LIST, 
  IDEA_TYPE_MAP, 
  getStatusMeta, 
  calculateIdeaProgress, 
  exportIdeaToMarkdown 
} from '../../utils/ideaUtils';

import { toLocalISODate } from '../../utils/calendar';
interface IdeaDetailViewProps {
  idea: ProjectIdea;
  onBack: () => void;
  onUpdateIdea: (updated: ProjectIdea) => Promise<void>;
  onDeleteIdea: (id: string) => Promise<void>;
  onEditIdea: (idea: ProjectIdea) => void;
  voiceNotesEnabled?: boolean;
}

export const IdeaDetailView: React.FC<IdeaDetailViewProps> = ({
  idea,
  onBack,
  onUpdateIdea,
  onDeleteIdea,
  onEditIdea,
  voiceNotesEnabled = true,
}) => {
  const [activeTab, setActiveTab] = useState<'todos' | 'prompts' | 'notes' | 'details'>('todos');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Todo additions
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoIsMvp, setNewTodoIsMvp] = useState(true);

  // Prompt additions
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptText, setNewPromptText] = useState('');

  // Note additions
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isRecordingNote, setIsRecordingNote] = useState(false);

  // Confirm delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const statusMeta = getStatusMeta(idea.status);
  const typeMeta = IDEA_TYPE_MAP[idea.type] || IDEA_TYPE_MAP.other;
  const progress = calculateIdeaProgress(idea);

  // Markdown copy
  const handleCopyMarkdown = async () => {
    try {
      const md = exportIdeaToMarkdown(idea);
      await navigator.clipboard.writeText(md);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch {
      // fallback
    }
  };

  // Status change
  const handleStatusChange = async (newStatus: IdeaStatus) => {
    await onUpdateIdea({
      ...idea,
      status: newStatus,
      updatedAt: Date.now(),
    });
  };

  // Star toggle
  const handleToggleStar = async () => {
    await onUpdateIdea({
      ...idea,
      isStarred: !idea.isStarred,
      updatedAt: Date.now(),
    });
  };

  // Todo operations
  const handleToggleTodo = async (todoId: string) => {
    const updatedTodos = (idea.todos || []).map((t) => 
      t.id === todoId ? { ...t, completed: !t.completed } : t
    );
    await onUpdateIdea({
      ...idea,
      todos: updatedTodos,
      updatedAt: Date.now(),
    });
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newTodo: IdeaTodo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: newTodoText.trim(),
      completed: false,
      isMvp: newTodoIsMvp,
      createdAt: Date.now(),
    };
    await onUpdateIdea({
      ...idea,
      todos: [...(idea.todos || []), newTodo],
      updatedAt: Date.now(),
    });
    setNewTodoText('');
  };

  const handleDeleteTodo = async (todoId: string) => {
    const updatedTodos = (idea.todos || []).filter((t) => t.id !== todoId);
    await onUpdateIdea({
      ...idea,
      todos: updatedTodos,
      updatedAt: Date.now(),
    });
  };

  // Prompt operations
  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptTitle.trim() || !newPromptText.trim()) return;
    const currentPrompts = idea.prompts || [];
    const newPrompt: IdeaPrompt = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newPromptTitle.trim(),
      promptText: newPromptText.trim(),
      order: currentPrompts.length + 1,
      createdAt: Date.now(),
    };
    await onUpdateIdea({
      ...idea,
      prompts: [...currentPrompts, newPrompt],
      updatedAt: Date.now(),
    });
    setNewPromptTitle('');
    setNewPromptText('');
    setShowAddPrompt(false);
  };

  const handleCopyPrompt = async (prompt: IdeaPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopiedPromptId(prompt.id);
      setTimeout(() => setCopiedPromptId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    const updatedPrompts = (idea.prompts || []).filter((p) => p.id !== promptId);
    // Reorder
    const reordered = updatedPrompts.map((p, idx) => ({ ...p, order: idx + 1 }));
    await onUpdateIdea({
      ...idea,
      prompts: reordered,
      updatedAt: Date.now(),
    });
  };

  // Note operations
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    const todayStr = toLocalISODate();
    const newNote: IdeaNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      content: newNoteContent.trim(),
      date: todayStr,
      createdAt: Date.now(),
    };
    await onUpdateIdea({
      ...idea,
      notes: [newNote, ...(idea.notes || [])],
      updatedAt: Date.now(),
    });
    setNewNoteContent('');
  };

  const handleDeleteNote = async (noteId: string) => {
    const updatedNotes = (idea.notes || []).filter((n) => n.id !== noteId);
    await onUpdateIdea({
      ...idea,
      notes: updatedNotes,
      updatedAt: Date.now(),
    });
  };

  // Voice typing for note
  const isSpeechSupported = 
    typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startVoiceForNote = () => {
    if (!isSpeechSupported || !voiceNotesEnabled) return;
    try {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecordingNote(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewNoteContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setIsRecordingNote(false);
      recognition.onend = () => setIsRecordingNote(false);
      recognition.start();
    } catch {
      setIsRecordingNote(false);
    }
  };

  const mvpTodos = (idea.todos || []).filter((t) => t.isMvp);
  const otherTodos = (idea.todos || []).filter((t) => !t.isMvp);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Fikirler Listesine Dön</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleStar}
            className={`p-2 rounded-xl border transition shadow-sm ${
              idea.isStarred
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-400 hover:text-amber-500'
            }`}
            title="Önemli İşaretle"
          >
            <Star className={`w-4 h-4 ${idea.isStarred ? 'fill-amber-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-sm"
            title="Tüm fikri Markdown formatında kopyalar"
          >
            {copiedMarkdown ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Markdown Kopyala</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onEditIdea(idea)}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-sm"
            title="Fikri Düzenle"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shadow-sm"
            title="Fikri Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Idea Header Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${typeMeta.badgeClass}`}>
                {typeMeta.label}
              </span>

              {/* Status Selector Dropdown */}
              <div className="relative inline-block">
                <select
                  value={idea.status}
                  onChange={(e) => handleStatusChange(e.target.value as IdeaStatus)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none appearance-none pr-6 ${statusMeta.borderLight} ${statusMeta.bgLight} ${statusMeta.badgeText}`}
                >
                  {IDEA_STATUS_LIST.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
              </div>

              {idea.isStarred && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200 dark:border-amber-800">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span>Önemli</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {idea.title}
            </h1>

            {idea.summary && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {idea.summary}
              </p>
            )}

            {idea.tags && idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {idea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {idea.todos && idea.todos.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-teal-600" />
                <span>İlerleme (%{progress.percent})</span>
              </span>
              <span className="text-slate-500 font-medium">
                {progress.completed} / {progress.total} tamamlandı
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Bir Sonraki Adım Vurgusu */}
        {idea.nextStep && (
          <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Rocket className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                Bir Sonraki Adım:
              </span>
              <p className="text-xs font-semibold text-amber-950 dark:text-amber-100 mt-0.5">
                {idea.nextStep}
              </p>
            </div>
          </div>
        )}

        {/* Linkler Bar */}
        {idea.links && idea.links.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {idea.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition group border border-slate-200/80 dark:border-slate-700"
              >
                {link.type === 'github' && <Github className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" />}
                {link.type === 'live' && <Globe className="w-3.5 h-3.5 text-emerald-600" />}
                {link.type === 'design' && <Palette className="w-3.5 h-3.5 text-indigo-600" />}
                {(!link.type || link.type === 'other') && <LinkIcon className="w-3.5 h-3.5 text-sky-600" />}
                <span>{link.title}</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-teal-600 transition" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Detail Navigation Subtabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'todos'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Yapılacaklar ({idea.todos?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prompts')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'prompts'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Prompt'lar ({idea.prompts?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'notes'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Not Akışı ({idea.notes?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'details'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Detaylar</span>
        </button>
      </div>

      {/* SUBTAB 1: YAPILACAKLAR (MVP & DİĞERLERİ) */}
      {activeTab === 'todos' && (
        <div className="space-y-4">
          {/* Add Todo input */}
          <form 
            onSubmit={handleAddTodo}
            className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-2.5"
          >
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Yeni görev veya özellik ekle (örn. Auth & Stripe entegrasyonu)..."
              className="flex-1 w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newTodoIsMvp}
                  onChange={(e) => setNewTodoIsMvp(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-amber-600 dark:text-amber-400 font-bold">MVP Maddesi</span>
              </label>

              <button
                type="submit"
                disabled={!newTodoText.trim()}
                className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1 transition shadow-md shadow-teal-900/10 active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Ekle</span>
              </button>
            </div>
          </form>

          {/* MVP Maddeleri */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  MVP
                </span>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Minimum Viable Product (Öncelikli Özellikler)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                {mvpTodos.filter((t) => t.completed).length} / {mvpTodos.length} tamamlandı
              </span>
            </div>

            {mvpTodos.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center italic">
                Henüz MVP maddesi eklenmedi. Yukarıdan "MVP Maddesi" seçerek ekleyebilirsiniz.
              </p>
            ) : (
              <div className="space-y-1.5">
                {mvpTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition group ${
                      todo.completed
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-slate-400 dark:text-slate-500'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                    >
                      {todo.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-medium ${todo.completed ? 'line-through text-slate-400' : ''}`}>
                        {todo.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diğer Yapılacaklar */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Genel Yapılacaklar & Gelecek Sürümler
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                {otherTodos.filter((t) => t.completed).length} / {otherTodos.length} tamamlandı
              </span>
            </div>

            {otherTodos.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center italic">
                Ek bir görev yok.
              </p>
            ) : (
              <div className="space-y-1.5">
                {otherTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition group ${
                      todo.completed
                        ? 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 text-slate-400'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                    >
                      {todo.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-medium ${todo.completed ? 'line-through text-slate-400' : ''}`}>
                        {todo.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: PROMPT'LAR */}
      {activeTab === 'prompts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Yapay Zeka Prompt Kütüphanesi
              </h3>
              <p className="text-xs text-slate-500">
                Adım adım uyguladığınız prompt'ları saklayın ve tek tıkla kopyalayın
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPrompt(!showAddPrompt)}
              className="px-3.5 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-teal-900/10 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Prompt Ekle</span>
            </button>
          </div>

          {showAddPrompt && (
            <form
              onSubmit={handleAddPrompt}
              className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 animate-in fade-in duration-200"
            >
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Yeni AI Prompt'u Kaydet
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Adım / Başlık
                </label>
                <input
                  type="text"
                  required
                  value={newPromptTitle}
                  onChange={(e) => setNewPromptTitle(e.target.value)}
                  placeholder="Örn: 1. Landing Page Tasarımı veya 2. Supabase SQL Şeması"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Prompt Metni
                </label>
                <textarea
                  rows={4}
                  required
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="Yapay zekaya (ChatGPT, Claude, Gemini vb.) gönderdiğiniz tam prompt..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddPrompt(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm"
                >
                  Kaydet
                </button>
              </div>
            </form>
          )}

          {(!idea.prompts || idea.prompts.length === 0) ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <Terminal className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Henüz kayıtlı bir prompt yok.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Proje geliştirirken yapay zekaya verdiğiniz sistem prompt'larını buraya kaydedebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...idea.prompts].sort((a, b) => a.order - b.order).map((prompt, index) => {
                const isCopied = copiedPromptId === prompt.id;
                return (
                  <div
                    key={prompt.id}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center border border-teal-200 dark:border-teal-800">
                          {index + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {prompt.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyPrompt(prompt)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                            isCopied
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Kopyalandı!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-teal-600" />
                              <span>Tek Tıkla Kopyala</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePrompt(prompt.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900 text-slate-100 dark:bg-slate-950 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all overflow-x-auto max-h-48 border border-slate-800">
                      {prompt.promptText}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: TARİHLİ NOT AKIŞI */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* New note form */}
          <form
            onSubmit={handleAddNote}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Fikir Geliştikçe Yeni Düşünce Ekle
              </label>
              {isSpeechSupported && voiceNotesEnabled && (
                <button
                  type="button"
                  onClick={startVoiceForNote}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                    isRecordingNote
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isRecordingNote ? 'Dinliyor...' : 'Sesle Dikte Et'}</span>
                </button>
              )}
            </div>

            <textarea
              rows={3}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Bugün aklıma gelen yeni bir özellik, pazarlama fikri veya mimari not..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs leading-relaxed resize-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newNoteContent.trim()}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Notu Kaydet</span>
              </button>
            </div>
          </form>

          {/* Notes stream */}
          {(!idea.notes || idea.notes.length === 0) ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Henüz bir not eklenmedi.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {[...idea.notes].sort((a, b) => b.createdAt - a.createdAt).map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>{note.date}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                      title="Notu Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: DETAYLAR */}
      {activeTab === 'details' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Geliştirme & İş Modeli Detayları
            </h3>
            <button
              type="button"
              onClick={() => onEditIdea(idea)}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Düzenle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Çözdüğü Problem:
              </span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {idea.problem || 'Henüz belirtilmedi.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Hedef Kullanıcı:
              </span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {idea.targetAudience || 'Henüz belirtilmedi.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Nasıl Para Kazanır? (Monetization):
              </span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {idea.monetization || 'Henüz belirtilmedi.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Rakipler & Benzerleri:
              </span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {idea.competitors || 'Henüz belirtilmedi.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Kullanılacak Teknolojiler (Tech Stack):
            </span>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {idea.techStack || 'Henüz belirtilmedi.'}
            </p>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Fikri Silmek İstiyor musunuz?
                </h4>
                <p className="text-xs text-slate-500">
                  Bu işlem fikre ait tüm yapılacakları ve notları silecektir.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteIdea(idea.id);
                  onBack();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
