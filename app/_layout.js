import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1f2937",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18
        },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: "☕ Cafe Menü",
          headerShown: false
        }} 
      />
      
      <Stack.Screen 
        name="product/[id]" 
        options={{
          title: "Ürün Detayı",
          headerBackTitle: "Geri"
        }} 
      />
      
      {/* Admin Sayfaları */}
      <Stack.Screen 
        name="adminLogin" 
        options={{
          title: "🔑 Admin Giriş",
          presentation: "modal"
        }} 
      />
      
      <Stack.Screen 
        name="adminPanel" 
        options={{
          title: "👨‍💼 Admin Panel",
          headerShown: false
        }} 
      />
      
      <Stack.Screen 
        name="qrManagement" 
        options={{
          title: "🏷️ QR Kod Yönetimi",
          headerBackTitle: "Panel"
        }} 
      />
    </Stack>
  );
}