// app/adminPanel.jsx - Cloudinary entegrasyonlu
import { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator
} from "react-native";
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  addDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db, auth } from "../constants/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "expo-router";
import { pickImage, takePhoto, uploadToCloudinary, testCloudinaryConfig } from "../utils/cloudinaryUpload";

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "İçecekler",
    image: ""
  });
  const [user, setUser] = useState(null);

  const router = useRouter();
  const categories = ["İçecekler", "Yiyecekler", "Pastalar"];

  // Auth state'i dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        console.log("✅ Kullanıcı oturum açık:", currentUser.email);
        
        // Cloudinary yapılandırmasını test et
        testCloudinaryConfig();
      } else {
        console.log("⚠️ Kullanıcı oturumu yok, ana sayfaya yönlendiriliyor");
        
        if (Platform.OS === 'web') {
          window.location.href = '/';
        } else {
          router.replace("/");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const productsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(productsData);
    } catch (error) {
      console.error("❌ Ürünleri yükleme hatası:", error);
      Alert.alert("Hata", "Ürünler yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  // Galeri'den resim seç
  const handlePickImage = async () => {
    try {
      const image = await pickImage();
      if (image) {
        await handleUploadImage(image.uri);
      }
    } catch (error) {
      Alert.alert("Hata", error.message);
    }
  };

  // Kameradan fotoğraf çek
  const handleTakePhoto = async () => {
    try {
      const photo = await takePhoto();
      if (photo) {
        await handleUploadImage(photo.uri);
      }
    } catch (error) {
      Alert.alert("Hata", error.message);
    }
  };

  // Cloudinary'ye yükle
  const handleUploadImage = async (imageUri) => {
    setUploading(true);
    try {
      const result = await uploadToCloudinary(imageUri);
      
      setNewProduct(prev => ({
        ...prev,
        image: result.url
      }));
      
      Alert.alert("Başarılı", "Resim yüklendi!");
    } catch (error) {
      console.error("❌ Yükleme hatası:", error);
      Alert.alert("Hata", "Resim yüklenemedi: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Resim seçim modalı göster
  const showImagePicker = () => {
    if (Platform.OS === 'web') {
      // Web için sadece galeri
      handlePickImage();
    } else {
      // Mobil için seçenek menüsü
      Alert.alert(
        "Resim Seç",
        "Resmi nereden eklemek istersiniz?",
        [
          { text: "İptal", style: "cancel" },
          { text: "📸 Fotoğraf Çek", onPress: handleTakePhoto },
          { text: "🖼️ Galeriden Seç", onPress: handlePickImage }
        ]
      );
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert("Hata", "Ürün adı ve fiyat zorunludur!");
      return;
    }

    try {
      await addDoc(collection(db, "products"), {
        ...newProduct,
        price: `${newProduct.price}₺`,
        createdAt: new Date()
      });
      
      Alert.alert("Başarılı", "Ürün başarıyla eklendi!");
      setModalVisible(false);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "İçecekler",
        image: ""
      });
      fetchProducts();
    } catch (error) {
      console.error("❌ Ürün ekleme hatası:", error);
      Alert.alert("Hata", "Ürün eklenemedi!");
    }
  };

  const handleUpdateProduct = async (id, updates) => {
    try {
      const ref = doc(db, "products", id);
      await updateDoc(ref, updates);
      Alert.alert("Başarılı", "Ürün güncellendi!");
      fetchProducts();
    } catch (error) {
      console.error("❌ Ürün güncelleme hatası:", error);
      Alert.alert("Hata", "Ürün güncellenemedi!");
    }
  };

  const handleDeleteProduct = (id, name) => {
    Alert.alert(
      "Ürün Sil",
      `"${name}" ürünü silinsin mi?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "products", id));
              Alert.alert("Başarılı", "Ürün silindi!");
              fetchProducts();
            } catch (error) {
              console.error("❌ Ürün silme hatası:", error);
              Alert.alert("Hata", "Ürün silinemedi!");
            }
          }
        }
      ]
    );
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || "",
      price: product.price.replace("₺", ""),
      category: product.category,
      image: product.image || ""
    });
    setModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert("Hata", "Ürün adı ve fiyat zorunludur!");
      return;
    }

    try {
      await handleUpdateProduct(editingProduct.id, {
        ...newProduct,
        price: `${newProduct.price}₺`
      });
      setModalVisible(false);
      setEditingProduct(null);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "İçecekler",
        image: ""
      });
    } catch (error) {
      Alert.alert("Hata", "Ürün güncellenemedi!");
    }
  };

  const handleLogout = async () => {
    const confirmAction = Platform.OS === 'web' 
      ? window.confirm("Admin panelinden çıkmak istediğinize emin misiniz?")
      : await new Promise((resolve) => {
          Alert.alert(
            "Çıkış Yap",
            "Admin panelinden çıkmak istediğinize emin misiniz?",
            [
              { text: "İptal", style: "cancel", onPress: () => resolve(false) },
              { text: "Çıkış Yap", onPress: () => resolve(true) }
            ]
          );
        });

    if (!confirmAction) return;

    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("❌ Çıkış hatası:", error);
      Alert.alert("Hata", "Çıkış yapılamadı!");
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  // Gelişmiş görsel komponenti
  const ProductImage = ({ uri, style }) => {
    const [imageError, setImageError] = useState(false);

    if (!uri || imageError) {
      return (
        <View style={[style, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>🍽️</Text>
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <img 
          src={uri} 
          alt="Product"
          style={{
            width: style.width,
            height: style.height,
            borderRadius: style.borderRadius,
            backgroundColor: style.backgroundColor || '#f3f4f6',
            objectFit: 'cover'
          }}
          onError={() => {
            console.log("❌ Görsel yükleme hatası");
            setImageError(true);
          }}
        />
      );
    }
    
    return (
      <Image 
        source={{ uri }} 
        style={style}
        onError={(e) => {
          console.log("❌ Görsel yükleme hatası:", e.nativeEvent.error);
          setImageError(true);
        }}
      />
    );
  };

  if (loading || !user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>☕ Admin Panel</Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingProduct(null);
              setNewProduct({
                name: "",
                description: "",
                price: "",
                category: "İçecekler",
                image: ""
              });
              setModalVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>+ Ürün Ekle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Çıkış</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productHeader}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productCategory}>{item.category}</Text>
                <Text style={styles.productDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
              
              <ProductImage 
                uri={item.image}
                style={styles.productImage}
              />
            </View>

            <View style={styles.productFooter}>
              <Text style={styles.productPrice}>{item.price}</Text>
              
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(item)}
                >
                  <Text style={styles.editButtonText}>✏️ Düzenle</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteProduct(item.id, item.name)}
                >
                  <Text style={styles.deleteButtonText}>🗑️ Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />

      {/* Add/Edit Product Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingProduct ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
              </Text>

              <TextInput
                placeholder="Ürün adı"
                value={newProduct.name}
                onChangeText={(text) => setNewProduct(prev => ({...prev, name: text}))}
                style={styles.modalInput}
              />

              <TextInput
                placeholder="Ürün açıklaması"
                value={newProduct.description}
                onChangeText={(text) => setNewProduct(prev => ({...prev, description: text}))}
                style={[styles.modalInput, styles.textArea]}
                multiline
                numberOfLines={3}
              />

              <TextInput
                placeholder="Fiyat (sadece rakam)"
                value={newProduct.price}
                onChangeText={(text) => setNewProduct(prev => ({...prev, price: text}))}
                style={styles.modalInput}
                keyboardType="numeric"
              />

              <Text style={styles.labelText}>Kategori:</Text>
              <View style={styles.categoryContainer}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      newProduct.category === category && styles.categoryButtonActive
                    ]}
                    onPress={() => setNewProduct(prev => ({...prev, category}))}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      newProduct.category === category && styles.categoryButtonTextActive
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Resim Yükleme Bölümü */}
              <Text style={styles.labelText}>Ürün Resmi:</Text>
              
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={showImagePicker}
                disabled={uploading}
              >
                {uploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.uploadButtonText}>Yükleniyor...</Text>
                  </View>
                ) : (
                  <Text style={styles.uploadButtonText}>
                    {Platform.OS === 'web' ? '📁 Resim Seç' : '📸 Resim Ekle'}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.helperText}>
                💡 Telefonunuzun galerisinden veya kamerasından resim ekleyebilirsiniz
              </Text>
              
              {newProduct.image && (
                <View style={styles.imagePreviewContainer}>
                  <Text style={styles.previewLabel}>Ön İzleme:</Text>
                  <ProductImage 
                    uri={newProduct.image}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setNewProduct(prev => ({...prev, image: ""}))}
                  >
                    <Text style={styles.removeImageText}>🗑️ Resmi Kaldır</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={editingProduct ? handleSaveEdit : handleAddProduct}
                  disabled={uploading}
                >
                  <Text style={styles.saveButtonText}>
                    {editingProduct ? "Güncelle" : "Ekle"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6"
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    fontSize: 18,
    color: "#6b7280"
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 15
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8
  },
  addButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 15
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center"
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 15
  },
  listContainer: {
    padding: 20
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4
  },
  productHeader: {
    flexDirection: "row",
    marginBottom: 12
  },
  productInfo: {
    flex: 1,
    marginRight: 12
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4
  },
  productCategory: {
    fontSize: 12,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8
  },
  productDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#f3f4f6"
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: {
    fontSize: 30
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f59e0b"
  },
  productActions: {
    flexDirection: "row",
    gap: 8
  },
  editButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  editButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold"
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%"
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center"
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb"
  },
  textArea: {
    height: 80,
    textAlignVertical: "top"
  },
  labelText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
    marginTop: 5
  },
  categoryContainer: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 8
  },
  categoryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "transparent"
  },
  categoryButtonActive: {
    backgroundColor: "#f59e0b",
    borderColor: "#f59e0b"
  },
  categoryButtonText: {
    textAlign: "center",
    color: "#6b7280",
    fontWeight: "bold",
    fontSize: 13
  },
  categoryButtonTextActive: {
    color: "#fff"
  },
  uploadButton: {
    backgroundColor: "#8b5cf6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    lineHeight: 18
  },
  imagePreviewContainer: {
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 12
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6b7280",
    marginBottom: 12
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    marginBottom: 12
  },
  removeImageButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  removeImageText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6b7280",
    padding: 15,
    borderRadius: 12
  },
  cancelButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#10b981",
    padding: 15,
    borderRadius: 12
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16
  }
});