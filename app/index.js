import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, testFirebaseConnection } from "../constants/firebase";
import ProductCard from "../components/ProductCard";
import { Link, useLocalSearchParams } from "expo-router";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [tableName, setTableName] = useState(null);
  
  // QR kod parametresini al
  const params = useLocalSearchParams();

  const categories = ['Tümü', 'İçecekler', 'Yiyecekler', 'Pastalar'];

  const fetchProducts = async () => {
    try {
      const isConnected = await testFirebaseConnection();
      if (!isConnected) {
        Alert.alert("Bağlantı Hatası", "Firebase'e bağlanılamadı!");
        return;
      }

      const snapshot = await getDocs(collection(db, "products"));
      const productsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setProducts(productsData);
    } catch (error) {
      console.error("❌ Ürünleri yükleme hatası:", error);
      Alert.alert("Hata", "Ürünler yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (tableId) => {
    if (!tableId) return;

    try {
      // Masa bilgisini al
      const tableRef = doc(db, "tables", tableId);
      const tableDoc = await getDoc(tableRef);

      if (tableDoc.exists()) {
        const tableData = tableDoc.data();
        setTableName(tableData.name);

        // Tarama sayısını artır
        await updateDoc(tableRef, {
          scans: (tableData.scans || 0) + 1,
          lastScan: new Date()
        });

        console.log(`✅ ${tableData.name} için QR kod tarandı!`);
      } else {
        console.log("⚠️ Masa bulunamadı");
      }
    } catch (error) {
      console.error("❌ QR kod işleme hatası:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    
    // URL'den gelen table parametresini kontrol et
    if (params.table) {
      handleQRScan(params.table);
    }
  }, [params.table]);

  const filteredProducts = selectedCategory === 'Tümü' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'İçecekler': return '🥤';
      case 'Yiyecekler': return '🍽️';
      case 'Pastalar': return '🧁';
      case 'Tümü': return '🍴';
      default: return '🍴';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>☕ Cafe Menü</Text>
          {tableName && (
            <Text style={styles.tableLabel}>📍 {tableName}</Text>
          )}
        </View>
        
        {/* Admin Giriş Butonu */}
        <Link href="/adminLogin" asChild>
          <TouchableOpacity style={styles.adminButton}>
            <Text style={styles.adminButtonText}>👨‍💼 Admin</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.categoryButtonTextActive
            ]}>
              {getCategoryIcon(category)} {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Products List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Menü yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ProductCard product={item} />}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {filteredProducts.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Bu kategoride ürün bulunamadı.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6"
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  headerLeft: {
    flex: 1
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937"
  },
  tableLabel: {
    fontSize: 14,
    color: "#8b5cf6",
    fontWeight: "600",
    marginTop: 4
  },
  adminButton: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  adminButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14
  },
  categoryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center"
  },
  categoryButtonActive: {
    backgroundColor: "#f59e0b"
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6b7280"
  },
  categoryButtonTextActive: {
    color: "#fff"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    fontSize: 18,
    color: "#6b7280"
  },
  listContainer: {
    padding: 20
  },
  row: {
    justifyContent: "flex-start"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280"
  }
});