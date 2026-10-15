import { 
  Student, 
  StudentNote, 
  WeeklyCallSession, 
  StudyTask, 
  EnglishNote, 
  EnglishCard, 
  UniversityCourse,
  UniversityExam,
  UniversityNote,
  ProjectIdea,
  PersonalNote,
  PersonalNoteTag,
  SearchResultItem 
} from '../types';
import { getCategoryMeta } from '../utils/categories';
import { getStudyTypeMeta, formatDuration } from '../utils/studyUtils';
import { getExamTypeTitle } from '../utils/universityUtils';
import { getStatusMeta, IDEA_TYPE_MAP } from '../utils/ideaUtils';
import { getNoteDisplayTitle } from '../utils/noteUtils';

// Turkish case-insensitive normalize helper
export function normalizeTurkish(text: string): string {
  if (!text) return '';
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr-TR')
    .trim();
}

export interface SearchContext {
  students: Student[];
  studentNotes: StudentNote[];
  weeklyCallSessions?: WeeklyCallSession[];
  studyTasks?: StudyTask[];
  englishNotes?: EnglishNote[];
  englishCards?: EnglishCard[];
  universityCourses?: UniversityCourse[];
  universityExams?: UniversityExam[];
  universityNotes?: UniversityNote[];
  projectIdeas?: ProjectIdea[];
  personalNotes?: PersonalNote[];
  personalTags?: PersonalNoteTag[];
}

export interface SearchProvider {
  type: string;
  search: (query: string, context: SearchContext) => SearchResultItem[];
}

// 1. Student Name & Profile Provider
export const studentSearchProvider: SearchProvider = {
  type: 'student',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ) return [];

    const results: SearchResultItem[] = [];

    for (const student of context.students) {
      const normName = normalizeTurkish(student.name);
      const normGroup = normalizeTurkish(student.group);
      const normParent = normalizeTurkish(student.parentName || '');
      const normHealth = normalizeTurkish(student.healthAlert || '');

      let matched = false;
      let snippet = `Sınıf: ${student.group}`;

      if (normName.includes(normQ)) {
        matched = true;
      } else if (normGroup.includes(normQ)) {
        matched = true;
        snippet = `Sınıf eşleşmesi: ${student.group}`;
      } else if (normParent.includes(normQ)) {
        matched = true;
        snippet = `Veli: ${student.parentName || ''}`;
      } else if (normHealth.includes(normQ)) {
        matched = true;
        snippet = `Sağlık Uyarısı: ${student.healthAlert}`;
      }

      if (matched) {
        results.push({
          id: `search-student-${student.id}`,
          type: 'student',
          title: student.name,
          subtitle: `${student.group} • ${student.parentName || 'Veli kaydı yok'}`,
          snippet,
          badge: student.group,
          badgeColor: 'teal',
          targetId: student.id,
          studentId: student.id,
        });
      }
    }

    return results;
  },
};

// 2. School & Student Notes Provider
export const studentNotesSearchProvider: SearchProvider = {
  type: 'student_note',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ) return [];

    const results: SearchResultItem[] = [];
    const studentMap = new Map<string, Student>();
    for (const s of context.students) {
      studentMap.set(s.id, s);
    }

    for (const note of context.studentNotes) {
      const normContent = normalizeTurkish(note.content);
      const normTitle = normalizeTurkish(note.title || '');
      const student = note.studentId ? studentMap.get(note.studentId) : undefined;
      const studentName = student ? student.name : '';
      const normStName = normalizeTurkish(studentName);
      
      const tag = note.tag || (note.category === 'veli_gorusmesi' ? 'veli' : note.category ? 'ogrenci' : 'diger');
      const tagLabels: Record<string, string> = {
        ogrenci: 'Öğrenci',
        veli: 'Veli',
        etkinlik: 'Etkinlik',
        malzeme: 'Malzeme',
        diger: 'Diğer',
      };
      const tagLabel = tagLabels[tag] || 'Not';
      const normTag = normalizeTurkish(tagLabel);

      if (
        normContent.includes(normQ) || 
        normTitle.includes(normQ) || 
        normStName.includes(normQ) || 
        normTag.includes(normQ)
      ) {
        // Extract a snippet around the match
        const idx = normContent.indexOf(normQ);
        let preview = note.content;
        if (idx !== -1 && note.content.length > 70) {
          const start = Math.max(0, idx - 20);
          const end = Math.min(note.content.length, idx + normQ.length + 50);
          preview = (start > 0 ? '...' : '') + note.content.slice(start, end) + (end < note.content.length ? '...' : '');
        }

        const displayTitle = note.title?.trim() || (studentName ? `${studentName}` : (preview.slice(0, 40) || 'Okul Notu'));

        results.push({
          id: `search-note-${note.id}`,
          type: 'student_note',
          title: displayTitle,
          subtitle: studentName ? `${studentName} • ${tagLabel} • ${note.date}` : `Okul Notu (${tagLabel}) • ${note.date}`,
          snippet: preview,
          date: note.date,
          badge: tagLabel,
          badgeColor: tag === 'veli' ? 'amber' : tag === 'ogrenci' ? 'teal' : tag === 'etkinlik' ? 'purple' : 'emerald',
          targetId: note.id,
          studentId: note.studentId,
        });
      }
    }

    return results;
  },
};

// 3. Weekly Parent Calls Provider
export const parentCallsSearchProvider: SearchProvider = {
  type: 'parent_call',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ || !context.weeklyCallSessions) return [];

    const results: SearchResultItem[] = [];

    for (const session of context.weeklyCallSessions) {
      for (const item of session.items) {
        if (!item.notes || !item.notes.trim()) continue;

        const normNotes = normalizeTurkish(item.notes);
        const normStName = normalizeTurkish(item.studentName);
        const normParent = normalizeTurkish(item.parentName || '');

        if (normNotes.includes(normQ) || normStName.includes(normQ) || normParent.includes(normQ)) {
          results.push({
            id: `search-call-${session.id}-${item.studentId}`,
            type: 'parent_call',
            title: item.studentName,
            subtitle: `Veli Araması (${session.weekDate}) • ${item.parentName || 'Veli'}`,
            snippet: item.notes,
            date: session.weekDate,
            badge: 'Veli Araması',
            badgeColor: 'amber',
            targetId: session.id,
            studentId: item.studentId,
          });
        }
      }
    }

    return results;
  },
};

// 4. Study Tasks Provider
export const studyTasksSearchProvider: SearchProvider = {
  type: 'study_task',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ || !context.studyTasks) return [];

    const results: SearchResultItem[] = [];

    for (const task of context.studyTasks) {
      const normTitle = normalizeTurkish(task.title);
      const meta = getStudyTypeMeta(task.type);
      const normType = normalizeTurkish(meta.label);

      if (normTitle.includes(normQ) || normType.includes(normQ)) {
        results.push({
          id: `search-task-${task.id}`,
          type: 'study_task',
          title: task.title,
          subtitle: `${meta.label} • Hedef: ${formatDuration(task.targetDurationMinutes)}`,
          snippet: `${task.date} tarihli çalışma görevi • ${task.completed ? 'Tamamlandı ✓' : 'Bekliyor'}`,
          date: task.date,
          badge: meta.label,
          badgeColor: 'indigo',
          targetId: task.id,
        });
      }
    }

    return results;
  },
};

// 5. English Notes Provider
export const englishNotesSearchProvider: SearchProvider = {
  type: 'english_note',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ || !context.englishNotes) return [];

    const results: SearchResultItem[] = [];

    for (const note of context.englishNotes) {
      const normTitle = normalizeTurkish(note.title);
      const normContent = normalizeTurkish(note.content);
      const normTag = normalizeTurkish(note.tag);

      if (normTitle.includes(normQ) || normContent.includes(normQ) || normTag.includes(normQ)) {
        results.push({
          id: `search-eng-note-${note.id}`,
          type: 'english_note',
          title: note.title,
          subtitle: `İngilizce Not • #${note.tag}`,
          snippet: note.content,
          badge: `İngilizce: ${note.tag}`,
          badgeColor: 'sky',
          targetId: note.id,
        });
      }
    }

    return results;
  },
};

// 6. English Flashcards Provider (word, meaning, exampleSentence, personalNote)
export const englishCardsSearchProvider: SearchProvider = {
  type: 'english_card',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ || !context.englishCards) return [];

    const results: SearchResultItem[] = [];

    for (const card of context.englishCards) {
      const normWord = normalizeTurkish(card.word);
      const normMeaning = normalizeTurkish(card.meaning);
      const normSentence = normalizeTurkish(card.exampleSentence || '');
      const normPersonal = normalizeTurkish(card.personalNote || '');

      if (
        normWord.includes(normQ) ||
        normMeaning.includes(normQ) ||
        normSentence.includes(normQ) ||
        normPersonal.includes(normQ)
      ) {
        results.push({
          id: `search-eng-card-${card.id}`,
          type: 'english_card',
          title: `${card.word} ➔ ${card.meaning}`,
          subtitle: card.exampleSentence ? `Örnek: "${card.exampleSentence}"` : 'Kelime Kartı',
          snippet: card.personalNote ? `Not: ${card.personalNote}` : (card.exampleSentence || card.meaning),
          badge: 'Kelime Kartı',
          badgeColor: 'emerald',
          targetId: card.id,
        });
      }
    }

    return results;
  },
};

// 7. University Courses Provider
export const universityCoursesSearchProvider: SearchProvider = {
  type: 'university_course',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ || !context.universityCourses) return [];

    const results: SearchResultItem[] = [];

    for (const course of context.universityCourses) {
      const normName = normalizeTurkish(course.name);
      const normCode = normalizeTurkish(course.code || '');
      const normInst = normalizeTurkish(course.instructor || '');

      if (normName.includes(normQ) || normCode.includes(normQ) || normInst.includes(normQ)) {
        results.push({
          id: `search-univ-course-${course.id}`,
          type: 'university_course',
          title: course.code ? `${course.code} - ${course.name}` : course.name,
          subtitle: course.instructor ? `Öğretim Elemanı: ${course.instructor}` : 'Üniversite Dersi',
          snippet: `Üniversite Dersi (${course.name})`,
          badge: 'Ders',
          badgeColor: 'indigo',
          targetId: course.id,
        });
      }
    }

    return results;
  },
};

// 8. University Exams Provider
export const universityExamsSearchProvider: SearchProvider = {
  type: 'university_exam',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ || !context.universityExams) return [];

    const results: SearchResultItem[] = [];
    const courseMap = new Map((context.universityCourses || []).map(c => [c.id, c.name]));

    for (const exam of context.universityExams) {
      const courseName = courseMap.get(exam.courseId) || 'Ders';
      const examTitle = exam.title || getExamTypeTitle(exam.examType);
      const normCourse = normalizeTurkish(courseName);
      const normTitle = normalizeTurkish(examTitle);

      if (normCourse.includes(normQ) || normTitle.includes(normQ)) {
        results.push({
          id: `search-univ-exam-${exam.id}`,
          type: 'university_exam',
          title: `${courseName} - ${examTitle}`,
          subtitle: `Tarih: ${exam.date}${exam.time ? ' ' + exam.time : ''}`,
          snippet: `Sınav Türü: ${examTitle} | ${exam.date}`,
          date: exam.date,
          badge: 'Sınav',
          badgeColor: 'amber',
          targetId: exam.id,
        });
      }
    }

    return results;
  },
};

// 9. University Notes Provider
export const universityNotesSearchProvider: SearchProvider = {
  type: 'university_note',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ || !context.universityNotes) return [];

    const results: SearchResultItem[] = [];
    const courseMap = new Map((context.universityCourses || []).map(c => [c.id, c.name]));

    for (const note of context.universityNotes) {
      const courseName = courseMap.get(note.courseId) || 'Ders';
      const normTitle = normalizeTurkish(note.title);
      const normContent = normalizeTurkish(note.content);
      const normCourse = normalizeTurkish(courseName);

      if (normTitle.includes(normQ) || normContent.includes(normQ) || normCourse.includes(normQ)) {
        results.push({
          id: `search-univ-note-${note.id}`,
          type: 'university_note',
          title: note.title,
          subtitle: `${courseName} • #${note.tag}`,
          snippet: note.content.slice(0, 140) + (note.content.length > 140 ? '...' : ''),
          badge: `#${note.tag}`,
          badgeColor: 'sky',
          targetId: note.id,
        });
      }
    }

    return results;
  },
};

// 10. Project Ideas Provider (Başlık, Özet, Etiket, Problem vb.)
export const projectIdeasSearchProvider: SearchProvider = {
  type: 'idea',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ || !context.projectIdeas) return [];

    const results: SearchResultItem[] = [];

    for (const idea of context.projectIdeas) {
      const normTitle = normalizeTurkish(idea.title);
      const normSummary = normalizeTurkish(idea.summary || '');
      const normProblem = normalizeTurkish(idea.problem || '');
      const normTags = (idea.tags || []).map((t) => normalizeTurkish(t)).join(' ');
      const normNext = normalizeTurkish(idea.nextStep || '');

      if (
        normTitle.includes(normQ) ||
        normSummary.includes(normQ) ||
        normProblem.includes(normQ) ||
        normTags.includes(normQ) ||
        normNext.includes(normQ)
      ) {
        const typeMeta = IDEA_TYPE_MAP[idea.type] || IDEA_TYPE_MAP.other;
        const statusMeta = getStatusMeta(idea.status);

        results.push({
          id: `search-idea-${idea.id}`,
          type: 'idea',
          title: idea.title,
          subtitle: `${typeMeta.label} • Durum: ${statusMeta.label}${idea.isStarred ? ' ★' : ''}`,
          snippet: idea.summary || idea.problem || idea.nextStep || 'Proje / SaaS Fikri',
          badge: statusMeta.label,
          badgeColor: 'amber',
          targetId: idea.id,
          ideaId: idea.id,
        });
      }
    }

    return results;
  },
};

// 11. Idea Notes Provider (Fikir içindeki tarihli not akışı)
export const ideaNotesSearchProvider: SearchProvider = {
  type: 'idea_note',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ || !context.projectIdeas) return [];

    const results: SearchResultItem[] = [];

    for (const idea of context.projectIdeas) {
      if (!idea.notes) continue;
      for (const note of idea.notes) {
        const normContent = normalizeTurkish(note.content);
        if (normContent.includes(normQ)) {
          results.push({
            id: `search-idea-note-${note.id}`,
            type: 'idea_note',
            title: `Not: ${note.content.slice(0, 40)}${note.content.length > 40 ? '...' : ''}`,
            subtitle: `"${idea.title}" Fikrine Ait Not • ${note.date}`,
            snippet: note.content,
            badge: 'Fikir Notu',
            badgeColor: 'amber',
            targetId: idea.id,
            ideaId: idea.id,
          });
        }
      }
    }

    return results;
  },
};

// 12. Idea Prompts Provider (Fikir içindeki AI promptları)
export const ideaPromptsSearchProvider: SearchProvider = {
  type: 'idea_prompt',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ || !context.projectIdeas) return [];

    const results: SearchResultItem[] = [];

    for (const idea of context.projectIdeas) {
      if (!idea.prompts) continue;
      for (const prompt of idea.prompts) {
        const normTitle = normalizeTurkish(prompt.title);
        const normText = normalizeTurkish(prompt.promptText);

        if (normTitle.includes(normQ) || normText.includes(normQ)) {
          results.push({
            id: `search-idea-prompt-${prompt.id}`,
            type: 'idea_prompt',
            title: `AI Prompt: ${prompt.title}`,
            subtitle: `"${idea.title}" Projesine Ait Prompt`,
            snippet: prompt.promptText.slice(0, 140) + (prompt.promptText.length > 140 ? '...' : ''),
            badge: 'Prompt',
            badgeColor: 'teal',
            targetId: idea.id,
            ideaId: idea.id,
          });
        }
      }
    }

    return results;
  },
};

// 13. Personal Notes Provider (Notlar & Etiketler)
export const personalNotesSearchProvider: SearchProvider = {
  type: 'personal_note',
  search(query: string, context: SearchContext): SearchResultItem[] {
    const normQ = normalizeTurkish(query);
    if (!normQ || !context.personalNotes) return [];

    const results: SearchResultItem[] = [];
    const tagsMap = new Map<string, PersonalNoteTag>();
    if (context.personalTags) {
      for (const t of context.personalTags) {
        tagsMap.set(t.id, t);
      }
    }

    for (const note of context.personalNotes) {
      const displayTitle = getNoteDisplayTitle(note);
      const normTitle = normalizeTurkish(displayTitle);
      const normContent = normalizeTurkish(note.content || '');

      // Check tag matches
      const noteTags = (note.tagIds || []).map((id) => tagsMap.get(id)).filter(Boolean) as PersonalNoteTag[];
      const tagNames = noteTags.map((t) => t.name).join(', ');
      const normTagNames = normalizeTurkish(tagNames);

      const titleMatches = normTitle.includes(normQ);
      const contentMatches = normContent.includes(normQ);
      const tagMatches = normTagNames.includes(normQ);

      if (titleMatches || contentMatches || tagMatches) {
        let snippet = '';
        if (contentMatches) {
          const lowerContent = note.content.toLowerCase();
          const matchIndex = lowerContent.indexOf(query.toLowerCase());
          const start = Math.max(0, matchIndex - 30);
          const end = Math.min(note.content.length, matchIndex + 100);
          snippet = (start > 0 ? '...' : '') + note.content.slice(start, end).trim() + (end < note.content.length ? '...' : '');
        } else {
          snippet = note.content.slice(0, 120) + (note.content.length > 120 ? '...' : '');
        }

        const primaryTag = noteTags[0];
        const badgeLabel = noteTags.length > 0 ? noteTags.map((t) => t.name).join(', ') : 'Not';
        const badgeColor = primaryTag ? primaryTag.color : 'blue';

        results.push({
          id: `search-personal-note-${note.id}`,
          type: 'personal_note',
          title: displayTitle,
          subtitle: noteTags.length > 0 ? `Etiketler: ${tagNames}` : 'Kişisel Not',
          snippet: snippet || '(İçerik boş)',
          badge: badgeLabel,
          badgeColor,
          targetId: note.id,
          noteId: note.id,
        });
      }
    }

    return results;
  },
};

// Extensible Search Engine class
export class UnifiedSearchEngine {
  private providers: SearchProvider[] = [];

  constructor() {
    this.registerProvider(studentSearchProvider);
    this.registerProvider(studentNotesSearchProvider);
    this.registerProvider(parentCallsSearchProvider);
    this.registerProvider(studyTasksSearchProvider);
    this.registerProvider(englishNotesSearchProvider);
    this.registerProvider(englishCardsSearchProvider);
    this.registerProvider(universityCoursesSearchProvider);
    this.registerProvider(universityExamsSearchProvider);
    this.registerProvider(universityNotesSearchProvider);
    this.registerProvider(projectIdeasSearchProvider);
    this.registerProvider(ideaNotesSearchProvider);
    this.registerProvider(ideaPromptsSearchProvider);
    this.registerProvider(personalNotesSearchProvider);
  }

  registerProvider(provider: SearchProvider) {
    this.providers.push(provider);
  }

  search(query: string, context: SearchContext): SearchResultItem[] {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const allResults: SearchResultItem[] = [];
    for (const provider of this.providers) {
      const results = provider.search(trimmed, context);
      allResults.push(...results);
    }

    return allResults;
  }
}

export const globalSearchEngine = new UnifiedSearchEngine();

