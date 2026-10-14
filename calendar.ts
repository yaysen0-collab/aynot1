export const DAY_NAMES_TR = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
];

// Yerel saate göre YYYY-MM-DD. (date.toISOString() UTC verir; Türkiye'de 00:00-03:00 arası "dün" çıkardı.)
export function toLocalISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

// Get target date of the current week for a given day index (0: Sunday .. 5: Friday .. 6: Saturday)
export function getTargetDateOfWeek(
  dateOrDay: Date | number = 5,
  targetDayOfWeek: number = 5
): string {
  let current: Date;
  let targetDay: number;

  if (typeof dateOrDay === 'number') {
    current = new Date();
    targetDay = dateOrDay;
  } else {
    current = new Date(dateOrDay);
    targetDay = targetDayOfWeek;
  }

  const currentDay = current.getDay();
  const diff = targetDay - currentDay;
  current.setDate(current.getDate() + diff);

  const y = current.getFullYear();
  const m = String(current.getMonth() + 1).padStart(2, '0');
  const d = String(current.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate repeating .ics (iCalendar) content
export function generateWeeklyIcsContent(
  callDay: number = 5,
  callTime: string = '14:00',
  durationMinutes: number = 60
): string {
  const [hourStr, minuteStr] = callTime.split(':');
  const startHour = parseInt(hourStr || '14', 10);
  const startMinute = parseInt(minuteStr || '00', 10);

  // Find the next upcoming occurrence
  const today = new Date();
  const nextDate = new Date(today);
  const currentDay = today.getDay();
  let daysUntil = (callDay - currentDay + 7) % 7;
  // If today is the call day and time has already passed, schedule for next week
  if (daysUntil === 0 && (today.getHours() > startHour || (today.getHours() === startHour && today.getMinutes() > startMinute))) {
    daysUntil = 7;
  }
  nextDate.setDate(today.getDate() + daysUntil);
  nextDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date(nextDate.getTime() + durationMinutes * 60 * 1000);

  const formatIcsDate = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      d.getFullYear() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      '00'
    );
  };

  const dtStart = formatIcsDate(nextDate);
  const dtEnd = formatIcsDate(endDate);
  const dtStamp = formatIcsDate(new Date()) + 'Z';
  const dayCode = ICS_DAYS[callDay] || 'FR';
  const dayName = DAY_NAMES_TR[callDay] || 'Cuma';

  const uid = `ogretmen-asistani-parent-calls-${Date.now()}@applet`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ogretmen Asistani//Veli Aramalari//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`,
    `SUMMARY:Aynot.: ${dayName} Veli Aramaları`,
    `DESCRIPTION:Haftalık veli bilgilendirme ve görüşme aramaları saati. Aynot. uygulamasını açarak listenizi kontrol edebilir ve notlarınızı kaydedebilirsiniz.`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Veli aramalarına 15 dakika kaldı!',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Veli aramaları saati geldi.',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

// Download .ics file directly to device
export function downloadIcsFile(callDay: number = 5, callTime: string = '14:00') {
  const content = generateWeeklyIcsContent(callDay, callTime);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ogretmen_asistani_veli_aramalari.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate Google Calendar direct web link with recurring rule
export function getGoogleCalendarUrl(
  callDay: number = 5,
  callTime: string = '14:00',
  durationMinutes: number = 60
): string {
  const [hourStr, minuteStr] = callTime.split(':');
  const startHour = parseInt(hourStr || '14', 10);
  const startMinute = parseInt(minuteStr || '00', 10);

  const today = new Date();
  const nextDate = new Date(today);
  const currentDay = today.getDay();
  let daysUntil = (callDay - currentDay + 7) % 7;
  nextDate.setDate(today.getDate() + daysUntil);
  nextDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date(nextDate.getTime() + durationMinutes * 60 * 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatUtcCompact = (d: Date) => {
    return (
      d.getFullYear() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      '00'
    );
  };

  const dates = `${formatUtcCompact(nextDate)}/${formatUtcCompact(endDate)}`;
  const dayCode = ICS_DAYS[callDay] || 'FR';
  const dayName = DAY_NAMES_TR[callDay] || 'Cuma';

  const title = encodeURIComponent(`Aynot.: ${dayName} Veli Aramaları`);
  const details = encodeURIComponent(
    'Haftalık veli bilgilendirme ve görüşme aramaları saati. Aynot. uygulamasını açarak veli arama listenizi kontrol edin.'
  );
  const recur = encodeURIComponent(`RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&recur=${recur}`;
}

// Notification helpers
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }
  try {
    new Notification(title, {
      icon: '/icon.svg',
      badge: '/pwa-192x192.png',
      ...options,
    });
    return true;
  } catch (err) {
    console.warn('Notification error:', err);
    return false;
  }
}
