import { ProjectIdea, IdeaStatus, IdeaType } from '../types';

export interface StatusMeta {
  id: IdeaStatus;
  label: string;
  color: string;
  bgLight: string;
  borderLight: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
}

export const IDEA_STATUS_LIST: StatusMeta[] = [
  {
    id: 'fikir',
    label: 'Fikir',
    color: 'amber',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    borderLight: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60',
    badgeText: 'text-amber-800 dark:text-amber-200',
    iconName: 'Lightbulb',
  },
  {
    id: 'arastiriliyor',
    label: 'Araştırılıyor',
    color: 'sky',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
    borderLight: 'border-sky-200 dark:border-sky-800',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/60',
    badgeText: 'text-sky-800 dark:text-sky-200',
    iconName: 'Search',
  },
  {
    id: 'planlaniyor',
    label: 'Planlanıyor',
    color: 'indigo',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderLight: 'border-indigo-200 dark:border-indigo-800',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60',
    badgeText: 'text-indigo-800 dark:text-indigo-200',
    iconName: 'Compass',
  },
  {
    id: 'yapiliyor',
    label: 'Yapılıyor',
    color: 'teal',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40',
    borderLight: 'border-teal-200 dark:border-teal-800',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/60',
    badgeText: 'text-teal-800 dark:text-teal-200',
    iconName: 'Rocket',
  },
  {
    id: 'bitti',
    label: 'Bitti',
    color: 'emerald',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderLight: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    badgeText: 'text-emerald-800 dark:text-emerald-200',
    iconName: 'CheckCircle2',
  },
  {
    id: 'rafa_kaldirildi',
    label: 'Rafa Kaldırıldı',
    color: 'slate',
    bgLight: 'bg-slate-100 dark:bg-slate-800/60',
    borderLight: 'border-slate-200 dark:border-slate-700',
    badgeBg: 'bg-slate-200 dark:bg-slate-750',
    badgeText: 'text-slate-700 dark:text-slate-300',
    iconName: 'Archive',
  },
];

export const IDEA_TYPE_MAP: Record<IdeaType, { label: string; badgeClass: string }> = {
  saas: { 
    label: 'SaaS', 
    badgeClass: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
  },
  mobile: { 
    label: 'Mobil Uygulama', 
    badgeClass: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
  },
  web: { 
    label: 'Web Sitesi', 
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
  },
  tool: { 
    label: 'Araç / Otomasyon', 
    badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
  },
  other: { 
    label: 'Diğer', 
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' 
  },
};

export function getStatusMeta(status: IdeaStatus): StatusMeta {
  return IDEA_STATUS_LIST.find((s) => s.id === status) || IDEA_STATUS_LIST[0];
}

export function calculateIdeaProgress(idea: ProjectIdea): { completed: number; total: number; percent: number } {
  if (!idea.todos || idea.todos.length === 0) {
    return { completed: 0, total: 0, percent: 0 };
  }
  const total = idea.todos.length;
  const completed = idea.todos.filter((t) => t.completed).length;
  const percent = Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function exportIdeaToMarkdown(idea: ProjectIdea): string {
  const statusMeta = getStatusMeta(idea.status);
  const typeMeta = IDEA_TYPE_MAP[idea.type] || IDEA_TYPE_MAP.other;
  const progress = calculateIdeaProgress(idea);

  const lines: string[] = [];
  lines.push(`# ${idea.title}`);
  if (idea.summary) {
    lines.push(`> ${idea.summary}`);
  }
  lines.push('');
  lines.push(`- **Durum:** ${statusMeta.label}`);
  lines.push(`- **Tür:** ${typeMeta.label}`);
  if (idea.isStarred) lines.push(`- **Önem Derecesi:** ★ Önemli`);
  if (idea.tags && idea.tags.length > 0) {
    lines.push(`- **Etiketler:** ${idea.tags.map((t) => `#${t}`).join(', ')}`);
  }
  if (idea.todos && idea.todos.length > 0) {
    lines.push(`- **İlerleme:** %${progress.percent} (${progress.completed}/${progress.total} tamamlandı)`);
  }
  lines.push('');

  // Detaylar
  lines.push('## Proje Detayları');
  if (idea.problem) lines.push(`### Çözdüğü Problem\n${idea.problem}\n`);
  if (idea.targetAudience) lines.push(`### Hedef Kullanıcı\n${idea.targetAudience}\n`);
  if (idea.monetization) lines.push(`### Nasıl Para Kazanır?\n${idea.monetization}\n`);
  if (idea.competitors) lines.push(`### Rakipler & Benzerleri\n${idea.competitors}\n`);
  if (idea.techStack) lines.push(`### Kullanılacak Teknolojiler\n${idea.techStack}\n`);
  if (idea.nextStep) lines.push(`### Bir Sonraki Adım\n${idea.nextStep}\n`);

  // Linkler
  if (idea.links && idea.links.length > 0) {
    lines.push('## Bağlantılar & Linkler');
    idea.links.forEach((link) => {
      lines.push(`- [${link.title}](${link.url})`);
    });
    lines.push('');
  }

  // Yapılacaklar (MVP ve Diğerleri)
  if (idea.todos && idea.todos.length > 0) {
    lines.push('## Yapılacaklar Listesi');
    const mvpTodos = idea.todos.filter((t) => t.isMvp);
    const otherTodos = idea.todos.filter((t) => !t.isMvp);

    if (mvpTodos.length > 0) {
      lines.push('### MVP Maddeleri');
      mvpTodos.forEach((t) => {
        lines.push(`- [${t.completed ? 'x' : ' '}] (MVP) ${t.text}`);
      });
      lines.push('');
    }

    if (otherTodos.length > 0) {
      if (mvpTodos.length > 0) lines.push('### Diğer Yapılacaklar');
      otherTodos.forEach((t) => {
        lines.push(`- [${t.completed ? 'x' : ' '}] ${t.text}`);
      });
      lines.push('');
    }
  }

  // AI Prompt'ları
  if (idea.prompts && idea.prompts.length > 0) {
    lines.push("## Yapay Zeka Prompt'ları");
    const sortedPrompts = [...idea.prompts].sort((a, b) => a.order - b.order);
    sortedPrompts.forEach((p, idx) => {
      lines.push(`### ${idx + 1}. ${p.title}`);
      lines.push('```');
      lines.push(p.promptText);
      lines.push('```');
      lines.push('');
    });
  }

  // Not Akışı
  if (idea.notes && idea.notes.length > 0) {
    lines.push('## Not Akışı');
    const sortedNotes = [...idea.notes].sort((a, b) => b.createdAt - a.createdAt);
    sortedNotes.forEach((n) => {
      lines.push(`- **${n.date}:** ${n.content}`);
    });
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Oluşturulma: ${new Date(idea.createdAt).toLocaleDateString('tr-TR')} | Son Güncelleme: ${new Date(idea.updatedAt).toLocaleDateString('tr-TR')}*`);

  return lines.join('\n');
}
