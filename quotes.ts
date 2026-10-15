export interface MotivationalQuote {
  quote: string;
  author?: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  { quote: 'Gelecek, bugünden hazırlananlara aittir.', author: 'Mustafa Kemal Atatürk' },
  { quote: 'Bir adım atarsan, yol önünde açılır.', author: 'Mevlana' },
  { quote: 'Büyük başarılar, küçük adımların sabırla birikmesidir.', author: 'Lao Tzu' },
  { quote: 'Her gün küçük bir ilerleme, zamanla devasa sonuçlar doğurur.', author: 'Robin Sharma' },
  { quote: 'Öğrenmek, zihnin asla tükenmeyen tek hazinesidir.', author: 'Leonardo da Vinci' },
  { quote: 'Zamanın değerini bilen, geleceğini inşa eder.', author: 'Seneca' },
  { quote: 'Disiplin, istek ile başarı arasındaki köprüdür.', author: 'Jim Rohn' },
  { quote: 'En uzun yolculuklar bile tek bir adımla başlar.', author: 'Lao Tzu' },
  { quote: 'Bilgiye yapılan yatırım, en yüksek faizi öder.', author: 'Benjamin Franklin' },
  { quote: 'Her gün yeni bir başlangıç, yeni bir öğrenme fırsatıdır.', author: 'Anonim' },
  { quote: 'Odaklanma, karmaşayı sadeleştiren sihirli bir güçtür.', author: 'Steve Jobs' },
  { quote: 'Azim ve sabır, tüm engelleri aşmanın anahtarıdır.', author: 'Mustafa Kemal Atatürk' },
  { quote: 'Zorluklar, yeteneklerimizi uyandıran fırsatlardır.', author: 'Epiktetos' },
  { quote: 'Bugün başladığın iş, yarınki hafifliğindir.', author: 'Marcus Aurelius' },
  { quote: 'Her gün öğrenilen bir kelime, dünyaya açılan yeni bir penceredir.', author: 'Anonim' },
  { quote: 'Gözlemle, dinle, not al ve üret.', author: 'Leonardo da Vinci' },
  { quote: 'Başarının sırrı, kararlılıkla devam etmektir.', author: 'Albert Einstein' },
  { quote: 'Kendine inan; içindeki güç düşündüğünden çok daha büyüktür.', author: 'Anonim' },
];

/**
 * Returns a stable quote for the given date.
 */
export function getDailyQuote(date: Date = new Date()): MotivationalQuote {
  // Use day of year or date timestamp to pick deterministic quote
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const index = Math.abs(dayOfYear) % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
}
