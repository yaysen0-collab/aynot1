# Kod İncelemesi ve Yapılan Düzeltmeler

## Düzeltilen hatalar

| # | Dosya | Sorun | Sonuç |
| --- | --- | --- | --- |
| 1 | `SettingsView.tsx` | Durum bildirimi bloğunda `)}` eksikti | Ayarlar sayfası derlenmiyordu |
| 2 | `SettingsView.tsx` | "Tüm verileri sil" modalının kapanış etiketleri yoktu | Aynı dosyada ikinci JSX hatası |
| 3 | `App.tsx` | `saveCallSession` kullanılıyor ama import edilmemişti | Veli görüşmesi kaydı çalışmıyordu |
| 4 | `App.tsx` | `BackupData` tipi import edilmemişti | Derleme hatası |
| 5 | `cloudDataService.ts` | `PersonalTag` diye tanımsız bir tip kullanılıyordu | Derleme hatası (doğrusu `PersonalNoteTag`) |
| 6 | `cloudDataService.ts` | Not fotoğrafı hem nota hem `photos` belgesine yazılıyordu | Silinmeyen yetim belgeler birikiyordu |
| 7 | `App.tsx` | Yedekten geri yüklemede "üzerine yaz" modu yok sayılıyordu | Eski veriler silinmiyordu |
| 8 | 16 dosya | "Bugün" tarihi `toISOString()` ile UTC'den üretiliyordu | Türkiye'de 00:00-03:00 arası "dün" çıkıyordu |
| 9 | `index.html` + `public/manifest.json` | PWA manifest iki kez tanımlıydı | Çift manifest uyarısı |
| 10 | `vite.config.ts` | Önbellek dosya sınırı 2 MiB'tı | Firebase ile build hata verebilirdi |

## Giriş sistemi: tamamlanan kısımlar

- `AuthScreen` ve `DataMigrationModal` hiçbir yerde ekrana bağlı değildi. Artık oturum yoksa giriş ekranı, ilk girişte yerel veri varsa aktarma penceresi gösterilir.
- Sadece öğrenci, not ve veli görüşmeleri buluta yazılıyordu. Çalışma, İngilizce, üniversite, fikir ve not modülleri yalnızca yerel veritabanına gidiyor, üstelik `refreshData` bunları buluttan gelen veriyle ezebiliyordu. Tüm yazmalar `src/db/repository.ts` üzerinden yönlendiriliyor.
- Bulutta silme işlemleri yerel davranışla aynı hale getirildi (öğrenci silinince notları, ders silinince sınav/ödev/notları da silinir).
- Ayarlar sayfasındaki hesap kartı, çıkış, yerel veri temizleme ve bulut yedeği artık bağlı.
- Google girişi popup engellenirse yönlendirmeye düşüyor (iOS PWA uyumu). `too-many-requests`, `unauthorized-domain` gibi hata kodlarına Türkçe mesaj eklendi.
- Profil belgesi yazılamazsa giriş artık başarısız sayılmıyor.
- İnternet yokken Firestore yazma sözü sunucu onayını beklediği için arayüz donabiliyordu. Yazmalar en fazla 2,5 sn beklenip devam ediyor.

## Açık kalan öneriler

1. **Test:** Bu ortamda `npm install` yapılamadığı için uygulamayı çalıştırıp denemedim; yalnızca TypeScript ile sözdizimi ve tür kontrolü yaptım. Kendi makinenizde `npm install && npm run lint && npm run dev` çalıştırıp giriş, kayıt, çıkış ve veri aktarımını deneyin.
2. **Firebase konsolu:** E-posta/Şifre ve Google sağlayıcıları açık olmalı, yayın alan adı "Authorized domains" listesinde olmalı.
3. **Göç ayarları:** `migrationService`, mevcut hesabın `userName` ve ayarlarını yerel değerlerle üzerine yazar. Aynı hesabı ikinci cihazda ilk kez açarken dikkat edin.
4. **Kullanılmayan bağımlılıklar:** `@google/genai`, `express`, `dotenv`, `@types/express` kodda kullanılmıyor. Kaldırıp `npm install` ile kilit dosyasını güncelleyebilirsiniz.
5. **Veli oturumu:** `getOrCreateCurrentSession` state'ten gelen nesneyi doğrudan değiştiriyor (`session.items.push`). Kopyalayarak çalışması daha güvenli olur.
6. **Fotoğraflar:** Notlara gömülen fotoğraflar Firestore'da yer kaplar. Çok fotoğraf kullanacaksanız Firebase Storage'a geçmek daha uygun olur. `photoService.ts` şu an kullanılmıyor.
7. **Eski demo verisi:** Örnek veri yükleme yalnızca oturumsuz (yerel) modda çalışır.
8. **`firebase.ts`:** `testConnection` her açılışta `test/connection` belgesini okur. Kurallar buna izin vermediği için konsolda izin hatası görünür; zararsızdır ama kaldırılabilir.

## Sonradan yapılan düzeltmeler

- **Ders notu:** "Yeni Ders Notu" her zaman listedeki ilk derse ekleniyordu. Not penceresine **Ders seçici** eklendi; üstteki ders filtresi seçiliyse o ders önerilir. Düzenlerken de derse taşınabilir.
- **Ders notu formu:** Ders detay sayfasında pencere sürekli bağlı kaldığı için bir notu düzenledikten sonra diğer not açıldığında eski metin görünüyordu. Form her açılışta sıfırlanıyor. Düzenlemede oluşturulma tarihi de sıfırlanmıyor.
- **Koyu tema:** Tailwind 4 `dark:` sınıflarını varsayılan olarak sistem ayarına bağlar; uygulama ise `<html class="dark">` kullanıyor. `index.css`'e `@custom-variant dark` eklendi, böylece Ayarlar'daki Açık/Koyu seçimi çalışır.
- **Renk paleti:** Ana renk (#2F7FB5) `teal`, `indigo`, `purple`, `blue`; vurgu rengi (#F4B860) `sky`, `amber` sınıflarına bağlandı. `emerald` (başarı) ve `rose` (hata/silme) anlamlarını korumak için değiştirilmedi.

## Ortak sınav tarihi (geri sayım)

- **Çalışma → Sınavlar** sekmesinin üstünde "Ortak Sınav Tarihi" kartı var. Tarih (isteğe bağlı saat ve sınav türü) girilip **Tüm derslere uygula** denince aktif dönemdeki her derse aynı sınav yazılır (`exam-common-{dersId}` kimliğiyle, tekrar uygulamak çift kayıt oluşturmaz). Tarih değişince hepsi birlikte güncellenir.
- Ortak tarih varken sonradan eklenen derslere de aynı sınav otomatik oluşturulur.
- **Ortak tarihi kaldır** sonucu girilmemiş ortak sınavları siler; sonucu girilmiş olanlara dokunmaz.
- **Bugün** ekranında bu sınavlar tek kart olarak gösterilir: "Üniversite Sınavlarına Kalan Süre / Tüm dersler (N ders) / X gün kaldı".
- **Giriş ekranında** "Sınava X gün kaldı" bilgisi, tarih bu cihazda en az bir kez girildiyse (localStorage) gösterilir. Hiç giriş yapılmamış yeni bir cihazda tarih bilinmediği için görünmez.
- Tek bir dersin sınavı kartı üzerinden düzenlenirse o ders ortak gruptan ayrılır ve bağımsız bir sınav olarak kalır.
- Günün sözleri listesinden "Konfüçyüs" imzalı iki söz çıkarıldı (`src/utils/quotes.ts`).

## Not yazma ekranı (iPhone Notlar tarzı)

- `PersonalNoteModal.tsx` baştan yazıldı: küçük pencere yerine **tam ekran** editör. Büyük başlık, geniş yazı alanı (yazdıkça uzar), tarih satırı, üst çubukta Sabitle / Etiket / Sesle yaz / ⋯ menüsü ve **Bitti**.
- **Otomatik kayıt:** yazmayı bıraktıktan 0,7 sn sonra kaydeder; "Kaydet" düğmesi yok. Geri oku veya Bitti ile çıkınca son hali kaydedilir. Kayıt başarısız olursa ekranda kalır, yazılanlar kaybolmaz.
- Hiç yazılmamış not kaydedilmez; tamamen boşaltılan not silinir (iPhone gibi).
- Listeler: satır başına `- `, `• ` veya `1. ` yazınca Enter listeyi sürdürür, boş maddede Enter listeyi bitirir. ⋯ menüsünde madde işareti ve numaralı liste düğmeleri var.
- Klavye açılınca ekran görünen alana uyar (iPhone Safari için `visualViewport`).
- `QuickPersonalNoteModal.tsx` (+ düğmesindeki hızlı not) artık aynı tam ekran editörü açar. Eski küçük hızlı not penceresi kaldırıldı.
- Bileşenlerin dış arayüzü (props) aynı kaldığı için Notlar listesi ve diğer ekranlar değişmedi. Ders notu, öğrenci notu ve İngilizce notu pencerelerine dokunulmadı.
