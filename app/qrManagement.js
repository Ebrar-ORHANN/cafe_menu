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
  Linking,
  Platform
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

  // UYARI: Bu URL'i kendi domain'inizle değiştirin!
  // Web'de çalışıyorsa: https://sizin-domain.com
  // Expo Go'da test için: exp://192.168.x.x:8081
  const BASE_URL = process.env.EXPO_PUBLIC_APP_URL || "https://cafeumenu.vercel.app";

  const fetchTables = async () => {
    try {
      const snapshot = await getDocs(collection(db, "tables"));
      const tablesData = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      // En yeni masaları önce göster
      tablesData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
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
        name: tableName.trim(),
        createdAt: new Date(),
        scans: 0,
        lastScan: null
      };

      await addDoc(collection(db, "tables"), tableData);
      
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
    // Menü URL'i - müşteri bu linke yönlenecek
    const menuURL = `${BASE_URL}?table=${tableId}`;
    
    // QR Server API - daha kaliteli QR kodlar
    // Alternatif: https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=${encodeURIComponent(menuURL)}
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(menuURL)}&margin=10`;
  };

  const openQRCode = (tableId, tableName) => {
    const qrURL = getQRCodeURL(tableId);
    Linking.openURL(qrURL);
  };

  const shareQRCode = async (tableId, tableName) => {
    try {
      const menuURL = `${BASE_URL}?table=${tableId}`;
      const qrURL = getQRCodeURL(tableId);
      
      const message = Platform.select({
        ios: `${tableName} - Cafe Menü\n\nQR Kod: ${qrURL}\nDirekt Link: ${menuURL}`,
        android: `${tableName} - Cafe Menü\n\nQR Kod: ${qrURL}\nDirekt Link: ${menuURL}`,
        default: `${tableName} - Cafe Menü\n\nQR Kod: ${qrURL}\nDirekt Link: ${menuURL}`
      });

      await Share.share({
        message: message,
        title: `${tableName} QR Kod`
      });
    } catch (error) {
      console.error("Paylaşım hatası:", error);
    }
  };

  const copyDirectLink = async (tableId, tableName) => {
    try {
      const menuURL = `${BASE_URL}?table=${tableId}`;
      // Not: React Native'de clipboard için @react-native-clipboard/clipboard paketi gerekir
      // Şimdilik Alert ile gösterelim
      Alert.alert(
        "Direkt Link",
        menuURL,
        [
          { text: "Kapat", style: "cancel" },
          {
            text: "Paylaş",
            onPress: () => Share.share({ message: menuURL })
          }
        ]
      );
    } catch (error) {
      console.error("Link kopyalama hatası:", error);
    }
  };

  const resetScans = async (tableId, tableName) => {
    Alert.alert(
      "Taramaları Sıfırla",
      `${tableName} için tarama sayısı sıfırlansın mı?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sıfırla",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "tables", tableId), {
                scans: 0,
                lastScan: null
              });
              Alert.alert("Başarılı", "Tarama sayısı sıfırlandı!");
              fetchTables();
            } catch (error) {
              console.error("❌ Sıfırlama hatası:", error);
              Alert.alert("Hata", "Sıfırlama yapılamadı!");
            }
          }
        }
      ]
    );
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
            placeholder="Masa adı (örn: Masa 1, Bahçe Masası)"
            value={tableName}
            onChangeText={setTableName}
            style={styles.input}
            maxLength={30}
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
          4. Müşteriler QR'ı okutarak menüye ulaşsın{'\n'}
          5. Tarama istatistiklerini takip edin
        </Text>
      </View>

      {/* Statistics */}
      {tables.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 İstatistikler</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statItem}>
              🏷️ Toplam Masa: {tables.length}
            </Text>
            <Text style={styles.statItem}>
              👁️ Toplam Tarama: {tables.reduce((sum, t) => sum + (t.scans || 0), 0)}
            </Text>
          </View>
        </View>
      )}

      {/* Tables List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          Oluşturulan QR Kodlar ({tables.length})
        </Text>
      </View>

      <FlatList
        data={tables}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableName}>{item.name}</Text>
              <TouchableOpacity
                style={styles.scanBadge}
                onPress={() => resetScans(item.id, item.name)}
              >
                <Text style={styles.scanText}>
                  👁️ {item.scans || 0} tarama
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.tableDate}>
              Oluşturulma: {new Date(item.createdAt?.seconds * 1000).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>

            {item.lastScan && (
              <Text style={styles.lastScanText}>
                Son tarama: {new Date(item.lastScan?.seconds * 1000).toLocaleString('tr-TR')}
              </Text>
            )}

            <View style={styles.tableActions}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => openQRCode(item.id, item.name)}
              >
                <Text style={styles.viewButtonText}>👁️ QR Aç</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => shareQRCode(item.id, item.name)}
              >
                <Text style={styles.shareButtonText}>📤 Paylaş</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => copyDirectLink(item.id, item.name)}
              >
                <Text style={styles.linkButtonText}>🔗</Text>
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
          <Text style={styles.emptyEmoji}>🏷️</Text>
          <Text style={styles.emptyText}>
            Henüz QR kod oluşturulmadı.{'\n'}
            Yukarıdan masa ekleyerek başlayın!
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
    marginBottom: 10,
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
  statsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  statItem: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600"
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
    color: "#1f2937",
    flex: 1
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
    marginBottom: 4
  },
  lastScanText: {
    fontSize: 11,
    color: "#10b981",
    marginBottom: 12,
    fontWeight: "600"
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
    flex: 2,
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
  linkButton: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center"
  },
  linkButtonText: {
    color: "#fff",
    fontSize: 16
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
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
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 24
  }
});