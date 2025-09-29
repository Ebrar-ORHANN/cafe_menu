import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  Share,
  Linking
} from "react-native";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../constants/firebase";
import { useRouter } from "expo-router";

export default function QRManagement() {
  const [tables, setTables] = useState([]);
  const [tableName, setTableName] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Web uygulamanızın URL'i - bunu kendi domain'inizle değiştirin
  const BASE_URL = "https://cafeumenu.vercel.app"; // Örnek URL

  const fetchTables = async () => {
    try {
      const snapshot = await getDocs(collection(db, "tables"));
      const tablesData = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setTables(tablesData);
    } catch (error) {
      console.error("❌ Masa verilerini yükleme hatası:", error);
      Alert.alert("Hata", "Masalar yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  const generateTableQR = async () => {
    if (!tableName.trim()) {
      Alert.alert("Hata", "Masa adı giriniz!");
      return;
    }

    try {
      const tableData = {
        name: tableName,
        createdAt: new Date(),
        scans: 0
      };

      const docRef = await addDoc(collection(db, "tables"), tableData);
      
      Alert.alert("Başarılı", `${tableName} için QR kod oluşturuldu!`);
      setTableName("");
      fetchTables();
    } catch (error) {
      console.error("❌ QR kod oluşturma hatası:", error);
      Alert.alert("Hata", "QR kod oluşturulamadı!");
    }
  };

  const deleteTable = (id, name) => {
    Alert.alert(
      "Masa Sil",
      `${name} masasını silmek istediğinize emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "tables", id));
              Alert.alert("Başarılı", "Masa silindi!");
              fetchTables();
            } catch (error) {
              console.error("❌ Masa silme hatası:", error);
              Alert.alert("Hata", "Masa silinemedi!");
            }
          }
        }
      ]
    );
  };

  const getQRCodeURL = (tableId) => {
    // QR kod oluşturma için Google Charts API kullanıyoruz
    const menuURL = `${BASE_URL}?table=${tableId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuURL)}`;
  };

  const openQRCode = (tableId, tableName) => {
    const qrURL = getQRCodeURL(tableId);
    Linking.openURL(qrURL);
  };

  const shareQRCode = async (tableId, tableName) => {
    try {
      const qrURL = getQRCodeURL(tableId);
      await Share.share({
        message: `${tableName} - Cafe Menü QR Kodu\n\n${qrURL}`,
        title: `${tableName} QR Kod`
      });
    } catch (error) {
      console.error("Paylaşım hatası:", error);
    }
  };

  const incrementScan = async (tableId) => {
    try {
      const tableRef = doc(db, "tables", tableId);
      const table = tables.find(t => t.id === tableId);
      await updateDoc(tableRef, {
        scans: (table?.scans || 0) + 1
      });
      fetchTables();
    } catch (error) {
      console.error("❌ Tarama sayısı güncelleme hatası:", error);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add Table Section */}
      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>🏷️ Yeni Masa QR Kodu Oluştur</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Masa adı (örn: Masa 1, Masa 2)"
            value={tableName}
            onChangeText={setTableName}
            style={styles.input}
          />
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={generateTableQR}
          >
            <Text style={styles.addButtonText}>+ Oluştur</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ Nasıl Kullanılır?</Text>
        <Text style={styles.infoText}>
          1. Masa adı girin ve QR kod oluşturun{'\n'}
          2. QR kodu görüntüleyin veya paylaşın{'\n'}
          3. QR kodu yazdırıp masalara yerleştirin{'\n'}
          4. Müşteriler QR'ı okutarak menüye ulaşsın
        </Text>
      </View>

      {/* Tables List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Oluşturulan QR Kodlar ({tables.length})</Text>
      </View>

      <FlatList
        data={tables}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableName}>{item.name}</Text>
              <View style={styles.scanBadge}>
                <Text style={styles.scanText}>
                  👁️ {item.scans || 0} tarama
                </Text>
              </View>
            </View>

            <Text style={styles.tableDate}>
              Oluşturulma: {new Date(item.createdAt?.seconds * 1000).toLocaleDateString('tr-TR')}
            </Text>

            <View style={styles.tableActions}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => openQRCode(item.id, item.name)}
              >
                <Text style={styles.viewButtonText}>👁️ QR Görüntüle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => shareQRCode(item.id, item.name)}
              >
                <Text style={styles.shareButtonText}>📤 Paylaş</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTable(item.id, item.name)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />

      {tables.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Henüz QR kod oluşturulmadı.{'\n'}
            Yukarıdan masa ekleyerek başlayın! 🏷️
          </Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    fontSize: 18,
    color: "#6b7280"
  },
  addSection: {
    backgroundColor: "#fff",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 15
  },
  inputContainer: {
    flexDirection: "row",
    gap: 10
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb"
  },
  addButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center"
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  },
  infoCard: {
    backgroundColor: "#eff6ff",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6"
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 22
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937"
  },
  listContainer: {
    padding: 20,
    paddingTop: 10
  },
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  tableName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937"
  },
  scanBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  scanText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "bold"
  },
  tableDate: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 12
  },
  tableActions: {
    flexDirection: "row",
    gap: 8
  },
  viewButton: {
    flex: 2,
    backgroundColor: "#3b82f6",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center"
  },
  viewButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13
  },
  shareButton: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center"
  },
  shareButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center"
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 24
  }
});