import React, { useState, useEffect } from 'react';
import { StickyNote, Lightbulb } from 'lucide-react';
import { PersonalNote, PersonalNoteTag, ProjectIdea } from '../../types';
import { NotesView } from './NotesView';
import { IdeasView } from '../ideas/IdeasView';

export type NotesSubTab = 'notlar' | 'fikirler';

interface NotesContainerViewProps {
  // Personal Notes props
  personalNotes: PersonalNote[];
  personalTags: PersonalNoteTag[];
  onSavePersonalNote: (note: PersonalNote) => Promise<void>;
  onDeletePersonalNote: (noteId: string) => Promise<void>;
  onSavePersonalTag: (tag: PersonalNoteTag) => Promise<void>;
  onDeletePersonalTag: (tagId: string) => Promise<void>;

  // Project Ideas props
  projectIdeas: ProjectIdea[];
  onSaveProjectIdea: (idea: Partial<ProjectIdea>, openDetail?: boolean) => Promise<void>;
  onUpdateProjectIdea: (idea: ProjectIdea) => Promise<void>;
  onDeleteProjectIdea: (ideaId: string) => Promise<void>;

  // Common props
  voiceNotesEnabled?: boolean;
  initialSubTab?: NotesSubTab;
  initialSelectedIdeaId?: string | null;
  onClearInitialSelectedIdeaId?: () => void;
  initialSelectedNoteId?: string | null;
  onClearInitialSelectedNoteId?: () => void;
}

export const NotesContainerView: React.FC<NotesContainerViewProps> = ({
  personalNotes,
  personalTags,
  onSavePersonalNote,
  onDeletePersonalNote,
  onSavePersonalTag,
  onDeletePersonalTag,
  projectIdeas,
  onSaveProjectIdea,
  onUpdateProjectIdea,
  onDeleteProjectIdea,
  voiceNotesEnabled = true,
  initialSubTab = 'notlar',
  initialSelectedIdeaId,
  onClearInitialSelectedIdeaId,
  initialSelectedNoteId,
  onClearInitialSelectedNoteId,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<NotesSubTab>(initialSubTab);

  // Sync subtab if initialSubTab or initialSelectedIdeaId changes
  useEffect(() => {
    if (initialSelectedIdeaId) {
      setActiveSubTab('fikirler');
    } else if (initialSelectedNoteId) {
      setActiveSubTab('notlar');
    } else if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab, initialSelectedIdeaId, initialSelectedNoteId]);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Segmented Sub-Tab Bar */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('notlar')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 ${
            activeSubTab === 'notlar'
              ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <StickyNote className="w-4 h-4" />
          <span>Notlar ({personalNotes.filter((n) => !n.isArchived).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('fikirler')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 ${
            activeSubTab === 'fikirler'
              ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Fikirler ({projectIdeas.filter((i) => i.status !== 'rafa_kaldirildi').length})</span>
        </button>
      </div>

      {/* Sub-tab 1: Personal Notes */}
      {activeSubTab === 'notlar' && (
        <NotesView
          notes={personalNotes}
          tags={personalTags}
          onSaveNote={onSavePersonalNote}
          onDeleteNote={onDeletePersonalNote}
          onSaveTag={onSavePersonalTag}
          onDeleteTag={onDeletePersonalTag}
          voiceNotesEnabled={voiceNotesEnabled}
          initialSelectedNoteId={initialSelectedNoteId}
          onClearInitialSelectedNoteId={onClearInitialSelectedNoteId}
        />
      )}

      {/* Sub-tab 2: Project Ideas */}
      {activeSubTab === 'fikirler' && (
        <IdeasView
          ideas={projectIdeas}
          onSaveIdea={onSaveProjectIdea}
          onUpdateIdea={onUpdateProjectIdea}
          onDeleteIdea={onDeleteProjectIdea}
          voiceNotesEnabled={voiceNotesEnabled}
          initialSelectedIdeaId={initialSelectedIdeaId}
          onClearInitialSelectedIdeaId={onClearInitialSelectedIdeaId}
        />
      )}
    </div>
  );
};
