import { View, Text, StyleSheet, Platform, Image } from "react-native";
import { Link } from "expo-router";
import { useState } from "react";

export default function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false);

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

  // Gelişmiş görsel komponenti
  const ProductImage = ({ uri }) => {
    if (!uri || imageError) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>
            {getCategoryIcon(product.category)}
          </Text>
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <img 
          src={uri} 
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={() => {
            console.log("❌ Görsel yükleme hatası:", uri);
            setImageError(true);
          }}
        />
      );
    }
    
    // Native için
    return (
      <Image 
        source={{ uri }} 
        style={styles.image}
        onError={(e) => {
          console.log("❌ Görsel yükleme hatası:", e.nativeEvent.error);
          setImageError(true);
        }}
      />
    );
  };

  return (
    <Link href={`/product/${product.id}`} asChild>
      <View style={styles.card}>
        {/* Product Image Container */}
        <View style={styles.imageContainer}>
          <ProductImage uri={product.image} />
          
          {/* Category Badge */}
          <View style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(product.category) }
          ]}>
            <Text style={styles.categoryIcon}>
              {getCategoryIcon(product.category)}
            </Text>
            <Text style={styles.categoryText}>
              {product.category}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description}
          </Text>
          
          <View style={styles.footer}>
            <Text style={styles.price}>
              {product.price}
            </Text>
          </View>
        </View>
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 6,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    maxWidth: '48%'
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#f8fafc',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6'
  },
  placeholderIcon: {
    fontSize: 50
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  categoryIcon: {
    fontSize: 11,
    marginRight: 3
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  infoContainer: {
    padding: 14
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6
  },
  productDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 17,
    minHeight: 34
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b'
  }
});