import React from 'react';
import { PersonalNote, PersonalNoteTag } from '../../types';
import { PersonalNoteModal } from './PersonalNoteModal';

interface QuickPersonalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: PersonalNoteTag[];
  onSaveNote: (note: PersonalNote) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  onOpenManageTags?: () => void;
  voiceNotesEnabled?: boolean;
}

/**
 * Hızlı not (+ düğmesi): artık küçük bir pencere değil, "Notlar" sekmesindeki
 * tam ekran not editörünün aynısı açılır.
 */
export const QuickPersonalNoteModal: React.FC<QuickPersonalNoteModalProps> = (props) => {
  return <PersonalNoteModal {...props} noteToEdit={null} />;
};
