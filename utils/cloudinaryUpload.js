// utils/cloudinaryUpload.js
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Galeri veya kameradan resim seçme
 */
export const pickImage = async () => {
  try {
    // İzin kontrolü
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Galeri erişim izni gerekli!');
    }

    // Resim seçimi
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('❌ Resim seçme hatası:', error);
    throw error;
  }
};

/**
 * Kameradan fotoğraf çekme
 */
export const takePhoto = async () => {
  try {
    // İzin kontrolü
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Kamera erişim izni gerekli!');
    }

    // Fotoğraf çekimi
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('❌ Fotoğraf çekme hatası:', error);
    throw error;
  }
};

/**
 * Cloudinary'ye resim yükleme
 */
export const uploadToCloudinary = async (imageUri) => {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary yapılandırması eksik! .env dosyasını kontrol edin.');
    }

    console.log('📤 Cloudinary\'ye yükleniyor...');

    // FormData oluştur
    const formData = new FormData();
    
    // Platform'a göre dosya ekleme
    if (Platform.OS === 'web') {
      // Web için
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('file', blob);
    } else {
      // Mobile için
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        type,
        name: filename
      });
    }

    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'cafe-menu');

    // Upload
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Yükleme başarısız!');
    }

    const data = await response.json();
    console.log('✅ Cloudinary\'ye yüklendi:', data.secure_url);

    return {
      url: data.secure_url,
      publicId: data.public_id,
      thumbnail: data.eager?.[0]?.secure_url || data.secure_url
    };
  } catch (error) {
    console.error('❌ Cloudinary yükleme hatası:', error);
    throw error;
  }
};

/**
 * Cloudinary'den resim silme (opsiyonel)
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    // Not: Bu işlem için backend gerekir çünkü API Secret kullanılmalı
    console.log('⚠️ Resim silme işlemi backend tarafında yapılmalı');
    console.log('Public ID:', publicId);
    
    // Şimdilik sadece log atıyoruz
    // İleride backend eklerseniz buradan API çağrısı yapabilirsiniz
    return true;
  } catch (error) {
    console.error('❌ Cloudinary silme hatası:', error);
    return false;
  }
};

// Test fonksiyonu
export const testCloudinaryConfig = () => {
  const isConfigured = CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET;
  
  if (isConfigured) {
    console.log('✅ Cloudinary yapılandırması OK');
    console.log('Cloud Name:', CLOUDINARY_CLOUD_NAME);
    console.log('Upload Preset:', CLOUDINARY_UPLOAD_PRESET);
  } else {
    console.log('❌ Cloudinary yapılandırması eksik!');
    console.log('Cloud Name:', CLOUDINARY_CLOUD_NAME || 'YOK');
    console.log('Upload Preset:', CLOUDINARY_UPLOAD_PRESET || 'YOK');
  }
  
  return isConfigured;
};