// utils/cloudinaryUpload.js - DEBUG VERSION
import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';

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
      quality: 0.7, // Kaliteyi düşürdüm
      base64: false
    });

    if (result.canceled) {
      return null;
    }

    console.log('📸 Seçilen resim bilgisi:', {
      uri: result.assets[0].uri,
      width: result.assets[0].width,
      height: result.assets[0].height,
      fileSize: result.assets[0].fileSize
    });

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
      quality: 0.7
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
 * Cloudinary'ye resim yükleme - DETAYLI DEBUG
 */
export const uploadToCloudinary = async (imageUri) => {
  try {
    console.log('🔍 DEBUG - Upload başlıyor...');
    console.log('📍 Image URI:', imageUri);
    console.log('📍 Cloud Name:', CLOUDINARY_CLOUD_NAME);
    console.log('📍 Upload Preset:', CLOUDINARY_UPLOAD_PRESET);
    console.log('📍 Upload URL:', CLOUDINARY_URL);

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      const error = 'Cloudinary yapılandırması eksik!';
      console.error('❌', error);
      Alert.alert('Yapılandırma Hatası', error);
      throw new Error(error);
    }

    // FormData oluştur
    const formData = new FormData();
    
    // Platform'a göre dosya ekleme
    if (Platform.OS === 'web') {
      console.log('🌐 Web platformu - Blob kullanılıyor');
      
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        console.log('📦 Blob oluşturuldu:', {
          size: blob.size,
          type: blob.type
        });
        
        formData.append('file', blob);
      } catch (blobError) {
        console.error('❌ Blob oluşturma hatası:', blobError);
        throw new Error('Resim hazırlanamadı: ' + blobError.message);
      }
    } else {
      console.log('📱 Mobile platformu - URI kullanılıyor');
      
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      console.log('📄 Dosya bilgisi:', {
        filename,
        type,
        uri: imageUri
      });

      formData.append('file', {
        uri: imageUri,
        type,
        name: filename
      });
    }

    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'cafe-menu');

    console.log('📤 FormData hazır, upload başlatılıyor...');

    // Upload
    const uploadStartTime = Date.now();
    
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    const uploadDuration = Date.now() - uploadStartTime;
    console.log(`⏱️ Upload süresi: ${uploadDuration}ms`);
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response OK:', response.ok);

    // Response'u kontrol et
    const responseText = await response.text();
    console.log('📥 Response Body:', responseText);

    if (!response.ok) {
      let errorMessage = 'Yükleme başarısız!';
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Cloudinary Hatası:', errorData);
        errorMessage = errorData.error?.message || JSON.stringify(errorData);
      } catch (parseError) {
        console.error('❌ Response parse hatası:', parseError);
        errorMessage = responseText || 'Bilinmeyen hata';
      }

      // Kullanıcıya detaylı hata göster
      Alert.alert(
        'Yükleme Hatası',
        `Hata: ${errorMessage}\n\nStatus: ${response.status}\n\nLütfen Cloudinary ayarlarınızı kontrol edin.`
      );
      
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    console.log('✅ Upload başarılı!');
    console.log('🖼️ Cloudinary URL:', data.secure_url);
    console.log('🆔 Public ID:', data.public_id);

    return {
      url: data.secure_url,
      publicId: data.public_id,
      thumbnail: data.eager?.[0]?.secure_url || data.secure_url
    };
  } catch (error) {
    console.error('❌ UPLOAD HATASI:', error);
    console.error('❌ Hata detayı:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    // Kullanıcıya hata göster
    if (error.message && !error.message.includes('Cloudinary')) {
      Alert.alert(
        'Upload Hatası',
        `Bir sorun oluştu:\n\n${error.message}\n\nLütfen tekrar deneyin.`
      );
    }
    
    throw error;
  }
};

/**
 * Cloudinary'den resim silme (opsiyonel)
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    console.log('⚠️ Resim silme işlemi backend tarafında yapılmalı');
    console.log('Public ID:', publicId);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary silme hatası:', error);
    return false;
  }
};

// Test fonksiyonu
export const testCloudinaryConfig = () => {
  console.log('🔍 Cloudinary Yapılandırma Testi:');
  console.log('================================');
  console.log('Cloud Name:', CLOUDINARY_CLOUD_NAME || '❌ TANIMLI DEĞİL');
  console.log('Upload Preset:', CLOUDINARY_UPLOAD_PRESET || '❌ TANIMLI DEĞİL');
  console.log('Upload URL:', CLOUDINARY_URL);
  console.log('================================');
  
  const isConfigured = CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET;
  
  if (isConfigured) {
    console.log('✅ Cloudinary yapılandırması OK');
  } else {
    console.log('❌ Cloudinary yapılandırması EKSIK!');
    console.log('💡 .env dosyasını kontrol edin:');
    console.log('   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dxoto04hz');
    console.log('   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=cafe-menu');
  }
  
  return isConfigured;
};