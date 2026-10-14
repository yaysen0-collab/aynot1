import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../db/firebase';

const photoCache = new Map<string, string>();

/**
 * Resizes and compresses an image to JPEG format <= 200 KB
 */
export async function compressImageToDataUrl(fileOrDataUrl: File | string, maxDimension = 1024, maxBytes = 200 * 1024): Promise<string> {
  let imgSource = '';
  if (typeof fileOrDataUrl === 'string') {
    imgSource = fileOrDataUrl;
  } else {
    imgSource = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    });
  }

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imgSource;
  });

  let width = img.width;
  let height = img.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(img, 0, 0, width, height);

  // Compress iteratively to ensure <= 200KB
  let quality = 0.8;
  let outputDataUrl = canvas.toDataURL('image/jpeg', quality);

  while (outputDataUrl.length * 0.75 > maxBytes && quality > 0.2) {
    quality -= 0.15;
    outputDataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  return outputDataUrl;
}

/**
 * Saves photo to separate Firestore document under users/{uid}/photos/{photoId}
 */
export async function savePhotoDocument(uid: string, photoId: string, dataUrl: string): Promise<string> {
  const photoDocRef = doc(db, 'users', uid, 'photos', photoId);
  await setDoc(photoDocRef, {
    id: photoId,
    dataUrl,
    createdAt: Date.now()
  });
  photoCache.set(photoId, dataUrl);
  return photoId;
}

/**
 * Retrieves photo dataUrl from cache or Firestore
 */
export async function getPhotoDocument(uid: string, photoId: string): Promise<string | null> {
  if (photoCache.has(photoId)) {
    return photoCache.get(photoId)!;
  }

  try {
    const photoDocRef = doc(db, 'users', uid, 'photos', photoId);
    const snap = await getDoc(photoDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.dataUrl) {
        photoCache.set(photoId, data.dataUrl);
        return data.dataUrl;
      }
    }
  } catch (err) {
    console.error('Error fetching photo document:', err);
  }
  return null;
}
