import { View, Text, Image, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function ProductCard({ product }) {
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'İçecekler': return '🥤';
      case 'Yiyecekler': return '🍽️';
      case 'Pastalar': return '🧁';
      default: return '🍴';
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'İçecekler': return '#3b82f6';
      case 'Yiyecekler': return '#10b981';
      case 'Pastalar': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <Link href={`/product/${product.id}`} asChild>
      <TouchableOpacity style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
        overflow: 'hidden',
        transform: [{ scale: 1 }]
      }}>
        {/* Product Image */}
        <View style={{
          position: 'relative',
          backgroundColor: '#f8fafc'
        }}>
          <Image
            source={{ uri: product.image }}
            style={{
              width: '100%',
              height: 140,
              resizeMode: 'contain'
            }}
          />
          
          {/* Category Badge */}
          <View style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: getCategoryColor(product.category),
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 10, marginRight: 2 }}>
              {getCategoryIcon(product.category)}
            </Text>
            <Text style={{
              color: '#fff',
              fontSize: 10,
              fontWeight: 'bold'
            }}>
              {product.category}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={{ padding: 16 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: 4
          }}>
            {product.name}
          </Text>
          
          <Text style={{
            fontSize: 12,
            color: '#6b7280',
            marginBottom: 12,
            lineHeight: 16
          }} numberOfLines={2}>
            {product.description}
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#f59e0b'
            }}>
              {product.price}
            </Text>
            
            <View style={{
              backgroundColor: '#f59e0b',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20
            }}>
              <Text style={{
                color: '#fff',
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                Detay
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}