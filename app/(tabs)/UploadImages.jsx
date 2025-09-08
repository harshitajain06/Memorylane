import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db, storage } from '../../config/firebase';

export default function UploadImages() {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images!');
      }
    }
  };

  const loadMemories = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const memoriesRef = collection(db, 'memories');
      const q = query(memoriesRef, where('caregiverId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const memoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by creation date (newest first)
      const sortedMemories = memoriesData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setMemories(sortedMemories);
    } catch (error) {
      console.error('Error loading memories:', error);
      Alert.alert('Error', 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async () => {
    if (!selectedImage || !description.trim()) {
      Alert.alert('Error', 'Please select an image and add a description');
      return;
    }

    setUploading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to upload images');
        return;
      }

      // Upload image to Firebase Storage
      const response = await fetch(selectedImage.uri);
      const blob = await response.blob();
      const imageName = `memories/${user.uid}/${Date.now()}.jpg`;
      const imageRef = ref(storage, imageName);
      
      await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(imageRef);

      // Save memory data to Firestore
      const memoryData = {
        caregiverId: user.uid,
        imageUrl,
        description: description.trim(),
        createdAt: new Date(),
        imageName
      };

      await addDoc(collection(db, 'memories'), memoryData);
      
      Alert.alert('Success', 'Memory uploaded successfully!');
      setSelectedImage(null);
      setDescription('');
      loadMemories(); // Reload memories
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading memories...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Share Memories</Text>
          <Text style={styles.subtitle}>Upload photos and descriptions to share with your patients</Text>
        </View>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color="#4A90E2" />
                <Text style={styles.placeholderText}>Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe this memory..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor="#95a5a6"
          />

          <TouchableOpacity 
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]} 
            onPress={uploadImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.uploadButtonText}>Upload Memory</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Memories List */}
        <View style={styles.memoriesSection}>
          <Text style={styles.sectionTitle}>Your Shared Memories</Text>
          {memories.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="images" size={50} color="#bdc3c7" />
              <Text style={styles.emptyText}>No memories shared yet</Text>
              <Text style={styles.emptySubtext}>Upload your first memory above</Text>
            </View>
          ) : (
            memories.map((memory) => (
              <View key={memory.id} style={styles.memoryCard}>
                <Image source={{ uri: memory.imageUrl }} style={styles.memoryImage} />
                <View style={styles.memoryContent}>
                  <Text style={styles.memoryDescription}>{memory.description}</Text>
                  <Text style={styles.memoryDate}>
                    {new Date(memory.createdAt.seconds * 1000).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  uploadSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    borderStyle: 'dashed',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 80,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
        },
      },
    }),
  },
  uploadButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonIcon: {
    marginRight: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  memoriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 10,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 5,
  },
  memoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  memoryImage: {
    width: '100%',
    height: 200,
  },
  memoryContent: {
    padding: 16,
  },
  memoryDescription: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 22,
    marginBottom: 8,
  },
  memoryDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});
