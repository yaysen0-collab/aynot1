import {
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { saveSettingCloud } from './cloudDataService';
import { auth, googleProvider, db } from '../db/firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: number;
  modules: string[];
}

/**
 * Ensures a user profile document exists in Firestore under users/{uid}/profile/main
 */
export async function ensureUserProfile(user: User, customName?: string): Promise<UserProfile> {
  const profileRef = doc(db, 'users', user.uid, 'profile', 'main');
  const existing = await getDoc(profileRef);

  if (existing.exists()) {
    const data = existing.data() as UserProfile;
    // Kayıt anında onAuthStateChanged profili e-posta adıyla önce oluşturmuş olabilir; girilen adı koru
    if (customName && data.name !== customName) {
      await setDoc(profileRef, { name: customName }, { merge: true });
      return { ...data, name: customName };
    }
    return data;
  }

  const profileData: UserProfile = {
    uid: user.uid,
    name: customName || user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
    email: user.email || '',
    createdAt: Date.now(),
    modules: [], // Boş modül alanı (tüm bölümler açık)
  };

  await setDoc(profileRef, profileData);
  return profileData;
}

/**
 * Sign in using Google Popup
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    const code = err?.code as string | undefined;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      // Sayfa yönlendirilir; dönüşte onAuthStateChanged kullanıcıyı yakalar
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

/**
 * Sign in using Email and Password
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

/**
 * Register with Email, Password and Display Name
 */
export async function registerWithEmail(email: string, password: string, name: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const trimmedName = name.trim() || email.trim().split('@')[0];
  
  try {
    await updateProfile(result.user, { displayName: trimmedName });
  } catch (e) {
    console.warn('Could not set displayName on auth user:', e);
  }

  try {
    await ensureUserProfile(result.user, trimmedName);
    // Bugün ekranındaki karşılama adı olarak da kullan
    await saveSettingCloud(result.user.uid, 'userName', trimmedName);
  } catch (e) {
    console.warn('Profil/ayar yazılamadı (hesap yine de oluşturuldu):', e);
  }
  return result.user;
}

/**
 * Password Reset Email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Map Firebase Auth error codes to user-friendly Turkish messages
 */
export function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi formatı.';
    case 'auth/user-disabled':
      return 'Bu kullanıcı hesabı devre dışı bırakılmış.';
    case 'auth/user-not-found':
      return 'Bu e-posta adresi ile kayıtlı hesap bulunamadı.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Hatalı e-posta veya şifre girdiniz.';
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten kullanımda.';
    case 'auth/weak-password':
      return 'Şifreniz en az 6 karakter olmalıdır.';
    case 'auth/popup-closed-by-user':
      return 'Google giriş penceresi kapatıldı.';
    case 'auth/popup-blocked':
      return 'Giriş penceresi tarayıcı tarafından engellendi. Lütfen açılır pencerelere izin verin.';
    case 'auth/operation-not-allowed':
      return 'Bu giriş yöntemi henüz Firebase konsolunda etkinleştirilmemiş. Lütfen konsoldan Authentication sağlayıcısını açın.';
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin veya şifrenizi sıfırlayın.';
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/unauthorized-domain':
      return 'Bu alan adı Firebase konsolunda yetkilendirilmemiş. Authentication > Settings > Authorized domains bölümüne ekleyin.';
    case 'auth/missing-password':
      return 'Lütfen şifrenizi girin.';
    case 'auth/network-request-failed':
      return 'Ağ bağlantısı kurulamadı. Lütfen internetinizi kontrol edin.';
    default:
      return 'Bir kimlik doğrulama hatası oluştu. Lütfen tekrar deneyin.';
  }
}
