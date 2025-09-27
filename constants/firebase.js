// firebase.js - Expo projesi için
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase Console'dan aldığınız Web App config'i buraya yapıştırın
const firebaseConfig = {
  apiKey: "AIzaSyAQHqniRd9Gx6und0RGuSoDi7NkSKe2Bxg",
  authDomain: "cafemenu-5f3aa.firebaseapp.com",
  projectId: "cafemenu-5f3aa",
  storageBucket: "cafemenu-5f3aa.firebasestorage.app",
  messagingSenderId: "273283403591",
  appId: "1:273283403591:web:8bb29b64e547ce01cb8662",
  measurementId: "G-75LC4P6MLJ"
};
// Firebase uygulamasını başlat
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase başarıyla başlatıldı');
} catch (error) {
  console.error('❌ Firebase başlatma hatası:', error);
}

// Firebase servislerini başlat ve export et
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Connection test fonksiyonu
export const testFirebaseConnection = async () => {
  try {
    console.log('🔥 Firebase bağlantısı test ediliyor...');
    return true;
  } catch (error) {
    console.error('❌ Firebase bağlantı hatası:', error);
    return false;
  }
};

export default app;


