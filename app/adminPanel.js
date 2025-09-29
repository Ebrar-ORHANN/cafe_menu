// app/adminPanel.jsx
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
  Platform
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
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "İçecekler",
    image: ""
  });

  const router = useRouter();

  const categories = ["İçecekler", "Yiyecekler", "Pastalar"];

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
    Alert.alert(
      "Çıkış Yap",
      "Admin panelinden çıkmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          onPress: async () => {
            try {
              await signOut(auth);
              console.log("✅ Admin çıkış yaptı");
              
              // Router ile ana sayfaya yönlendir
              router.replace("/");
            } catch (error) {
              console.error("❌ Çıkış hatası:", error);
              Alert.alert("Hata", "Çıkış yapılamadı!");
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Web için görsel komponenti
  const ProductImage = ({ uri, style }) => {
    if (Platform.OS === 'web') {
      return (
        <img 
          src={uri} 
          style={{
            width: style.width,
            height: style.height,
            borderRadius: style.borderRadius,
            backgroundColor: style.backgroundColor,
            objectFit: 'cover'
          }}
          onError={(e) => {
            console.log("❌ Görsel yükleme hatası");
            e.target.style.display = 'none';
          }}
        />
      );
    }
    
    // Native için
    const Image = require('react-native').Image;
    return (
      <Image 
        source={{ uri }} 
        style={style}
        onError={(e) => console.log("❌ Görsel yükleme hatası:", e.nativeEvent.error)}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Ürünler yükleniyor...</Text>
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
              
              {item.image && (
                <ProductImage 
                  uri={item.image}
                  style={styles.productImage}
                />
              )}
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
            <ScrollView>
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

              <TextInput
                placeholder="Resim URL'si (örn: https://example.com/image.jpg)"
                value={newProduct.image}
                onChangeText={(text) => setNewProduct(prev => ({...prev, image: text}))}
                style={styles.modalInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              {newProduct.image && (
                <View style={styles.imagePreviewContainer}>
                  <Text style={styles.previewLabel}>Ön İzleme:</Text>
                  <ProductImage 
                    uri={newProduct.image}
                    style={styles.imagePreview}
                  />
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
    marginBottom: 10
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
    fontSize:13
  },
  categoryButtonTextActive: {
    color: "#fff"
  },
  imagePreviewContainer: {
    marginBottom: 15,
    alignItems: "center"
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6b7280",
    marginBottom: 8
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#f3f4f6"
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