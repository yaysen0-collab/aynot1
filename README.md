# Aynot.

Öğretmenler ve öğrenciler için kişisel takip, okul notları ve çalışma asistanı. Telefona kurulabilen (PWA) bir web uygulamasıdır; veriler Firebase hesabına bağlı olarak bulutta saklanır ve cihazlar arasında eşitlenir.

## Özellikler

| Bölüm | Neler yapılır |
| --- | --- |
| **Bugün** | Günlük özet, bugünün görevleri, geciken veli aramaları, yaklaşan sınavlar |
| **Okul** | Öğrenci kartları ve notları, fotoğraflı notlar, sağlık uyarısı, haftalık veli arama listesi |
| **Çalışma** | Haftalık çalışma planı, Pomodoro, yorgunluk modu, gün kopyalama |
| **İngilizce** | Kelime kartları (aralıklı tekrar), desteler, notlar, günlük hedef |
| **Üniversite** | Dönemler, dersler, sınavlar ve sonuçları, ödevler, ders notları |
| **Fikirler / Notlar** | Proje fikirleri, etiketli kişisel notlar |
| **Genel** | Evrensel arama, sesli not girişi, koyu/açık tema, yedekleme ve geri yükleme |

## Teknoloji

- React 19 + TypeScript + Vite
- Tailwind CSS 4, lucide-react
- Firebase Authentication (e-posta/şifre ve Google) + Cloud Firestore
- `vite-plugin-pwa` ile PWA ve çevrimdışı önbellek
- Eski yerel veriler için IndexedDB (`src/db/indexedDb.ts`)

## Kurulum

Gereksinim: Node.js 20 veya üzeri (ya da Bun).

```bash
npm install        # veya: bun install
npm run dev        # http://localhost:3000
```

Diğer komutlar:

```bash
npm run build      # üretim derlemesi (dist/)
npm run preview    # derlemeyi yerelde dene
npm run lint       # tsc --noEmit ile tür denetimi
```

## Firebase kurulumu

Uygulama `firebase-applet-config.json` dosyasındaki proje bilgilerini kullanır. Kendi Firebase projenizle çalıştırmak için:

1. [Firebase Console](https://console.firebase.google.com) üzerinde bir proje oluşturun.
2. **Authentication → Sign-in method** bölümünde **E-posta/Şifre** ve **Google** sağlayıcılarını etkinleştirin.
3. **Authentication → Settings → Authorized domains** listesine uygulamayı yayınladığınız alan adını ekleyin. `localhost` varsayılan olarak ekli gelir.
4. **Firestore Database** oluşturun. Varsayılan dışında bir veritabanı kullanıyorsanız adını `firestoreDatabaseId` alanına yazın.
5. `firestore.rules` dosyasındaki kuralları yayınlayın:
   ```bash
   firebase deploy --only firestore:rules
   ```
6. Web uygulaması ayarlarından aldığınız değerleri `firebase-applet-config.json` içine yazın.

> Firebase web API anahtarı gizli bir değer değildir, ancak Google Cloud Console → *APIs & Services → Credentials* bölümünden anahtarı yalnızca kendi alan adlarınıza (HTTP referrer) kısıtlamanız önerilir. Asıl güvenliği Firestore kuralları sağlar.

## Giriş sistemi nasıl çalışır?

- Uygulama açıldığında oturum durumu `onAuthStateChanged` ile kontrol edilir. Oturum yoksa **giriş / kayıt ekranı** gösterilir (`src/components/auth/AuthScreen.tsx`).
- Giriş yöntemleri: e-posta ve şifre, Google. Şifre sıfırlama e-postası da desteklenir.
- Her kullanıcının verisi `users/{uid}/...` altında tutulur. Kurallar yalnızca hesabın sahibine erişim verir.
- **Veri akışı:** `src/db/repository.ts` tüm yazma ve silme işlemlerini yönlendirir. Oturum açıkken Firestore'a, açık değilken IndexedDB'ye yazar. Okuma tarafında Firestore `onSnapshot` dinleyicileri (`subscribeToUserData`) kullanılır.
- **Yerel veri aktarımı:** Hesabı ilk kez açan bir cihazda eski yerel veri varsa, "Bu cihazdaki verilerini hesabına aktar" penceresi çıkar. Aktarım kayıt kimliklerini korur, bu yüzden tekrar çalıştırılması çift kayıt oluşturmaz. Yerel veri silinmez.
- **Çıkış:** Ayarlar → Çıkış Yap. Sayfa yeniden yüklenir, böylece önceki kullanıcının verisi bellekte kalmaz.
- Girişi zorunlu tutmak istemezseniz `src/App.tsx` içindeki `REQUIRE_LOGIN` sabitini `false` yapın. Bu durumda uygulama oturumsuz, yalnızca yerel IndexedDB ile çalışır. Giriş ekranına bir "misafir olarak devam et" düğmesi eklemeniz gerekir.

## Proje yapısı

```
src/
  App.tsx                  Ana uygulama: durum, sekmeler, auth kapısı
  components/
    auth/                  Giriş/kayıt ekranı, yerel veri aktarma penceresi
    today/ students/ school/ study/ english/ university/ ideas/ notes/ settings/
  db/
    firebase.ts            Firebase başlatma (Auth + Firestore, çevrimdışı önbellek)
    repository.ts          Yazma/silme yönlendirici (bulut veya yerel)
    indexedDb.ts           Yerel veritabanı
  services/
    authService.ts         Giriş, kayıt, şifre sıfırlama, hata mesajları
    cloudDataService.ts    Firestore okuma/yazma ve cascade silme
    migrationService.ts    Yerel veriyi buluta aktarma
    parentCallService.ts   Haftalık veli arama oturumları
    searchService.ts       Türkçe uyumlu evrensel arama
  utils/                   Takvim, tarih, kart tekrar algoritması vb.
firestore.rules            Güvenlik kuralları
```

## Veri modeli (Firestore)

`users/{uid}` altındaki koleksiyonlar: `students`, `student_notes`, `parent_call_sessions`, `study_tasks`, `study_day_configs`, `day_checkins`, `english_notes`, `english_decks`, `english_cards`, `english_review_logs`, `university_terms`, `university_courses`, `university_exams`, `university_notes`, `university_assignments`, `project_ideas`, `personal_notes`, `personal_tags`, `settings`, `profile`.

## Yedekleme

Ayarlar → Veri Yönetimi bölümünden JSON olarak dışa aktarabilir ve geri yükleyebilirsiniz. Geri yüklerken **birleştir** veya **üzerine yaz** seçilir. Üzerine yaz seçeneği hesaptaki mevcut verileri önce siler.

## Telefona kurma

Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini kullanın. Uygulama içindeki kurulum rehberi de aynı adımları gösterir.
