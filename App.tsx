// App.tsx - Main React Native App
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface NutritionResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  healthScore: number;
  breakdown: Array<{
    name: string;
    value: number;
    unit: string;
    color: string;
  }>;
}

// Replace with your actual API URL
const API_URL = 'https://nutrisnap-web.vercel.app';

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);

  const pickImage = async (useCamera: boolean) => {
    const { status } = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('Sorry, we need permissions to access your photos!');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async (imageUri: string) => {
    setAnalyzing(true);

    try {
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Call API
      const apiResponse = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!apiResponse.ok) throw new Error('Analysis failed');

      const data = await apiResponse.json();
      setResult(data);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze image. Please try again.');
      reset();
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
    setAnalyzing(false);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // Home Screen
  if (!selectedImage && !result) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.homeContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="camera" size={50} color="#667eea" />
            </View>

            <Text style={styles.title}>NutriSnap</Text>
            <Text style={styles.subtitle}>
              Snap a photo of your food and get instant nutrition insights
            </Text>

            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => pickImage(true)}
            >
              <Ionicons name="camera" size={60} color="#667eea" />
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage(false)}
            >
              <Ionicons name="images" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Upload from Gallery</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Analyzing Screen
  if (analyzing) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.analyzingContent}>
            <View style={styles.imagePreview}>
              <Image
                source={{ uri: selectedImage! }}
                style={styles.previewImage}
              />
            </View>

            <ActivityIndicator size="large" color="white" style={styles.loader} />

            <Text style={styles.analyzingTitle}>Analyzing your food...</Text>
            <Text style={styles.analyzingSubtitle}>
              Calculating nutritional values
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Results Screen
  if (result) {
    return (
      <View style={styles.resultsContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.resultsHeader}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={reset} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              <Text style={styles.resultTitle}>{result.foodName}</Text>
              <Text style={styles.resultSubtitle}>Nutritional Analysis</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={styles.resultsScroll}>
          {/* Health Score Card */}
          <View style={styles.card}>
            <View
              style={[
                styles.scoreCircle,
                {
                  borderColor: getHealthScoreColor(result.healthScore),
                  borderWidth: 10,
                },
              ]}
            >
              <Text
                style={[
                  styles.scoreNumber,
                  { color: getHealthScoreColor(result.healthScore) },
                ]}
              >
                {result.healthScore}
              </Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>

            <Text style={styles.cardTitle}>Health Score</Text>
            <Text style={styles.cardSubtitle}>
              {result.healthScore >= 80
                ? 'Excellent choice!'
                : result.healthScore >= 60
                ? 'Good choice'
                : 'Consider healthier alternatives'}
            </Text>
          </View>

          {/* Calories Card */}
          <View style={styles.card}>
            <Ionicons
              name="trending-up"
              size={40}
              color="#667eea"
              style={styles.caloriesIcon}
            />
            <Text style={styles.caloriesNumber}>{result.calories}</Text>
            <Text style={styles.caloriesLabel}>Total Calories</Text>
          </View>

          {/* Macronutrients */}
          <View style={styles.card}>
            <Text style={styles.breakdownTitle}>Nutritional Breakdown</Text>

            {result.breakdown.map((nutrient, index) => (
              <View key={index} style={styles.nutrientRow}>
                <View style={styles.nutrientHeader}>
                  <Text style={styles.nutrientName}>{nutrient.name}</Text>
                  <Text style={[styles.nutrientValue, { color: nutrient.color }]}>
                    {nutrient.value}
                    {nutrient.unit}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min((nutrient.value / 50) * 100, 100)}%`,
                        backgroundColor: nutrient.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={reset}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.analyzeAgainButton}
            >
              <Text style={styles.analyzeAgainText}>Analyze Another Meal</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  homeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 50,
    maxWidth: 300,
  },
  cameraButton: {
    width: 200,
    height: 200,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  buttonText: {
    marginTop: 15,
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePreview: {
    width: 300,
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  loader: {
    marginBottom: 20,
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  analyzingSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  resultsHeader: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  backText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  resultSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  resultsScroll: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  caloriesIcon: {
    marginBottom: 15,
  },
  caloriesNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  nutrientRow: {
    width: '100%',
    marginBottom: 20,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutrientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  nutrientValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
  },
  analyzeAgainButton: {
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  analyzeAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});