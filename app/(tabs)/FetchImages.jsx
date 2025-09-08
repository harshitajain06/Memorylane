import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { auth, db } from '../../config/firebase';

export default function FetchImages() {
  const navigation = useNavigation();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get user's caregiver ID
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      if (userDoc.empty) return;

      const userData = userDoc.docs[0].data();
      const caregiverId = userData.caregiverId;

      if (!caregiverId) {
        setMemories([]);
        setLoading(false);
        return;
      }

      // Fetch memories from caregiver
      const memoriesRef = collection(db, 'memories');
      const q = query(memoriesRef, where('caregiverId', '==', caregiverId));
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMemories();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading shared memories...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Shared Memories</Text>
          <Text style={styles.subtitle}>Memories shared by your caregiver</Text>
        </View>

        {/* Memories List */}
        {memories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images" size={60} color="#bdc3c7" />
            <Text style={styles.emptyText}>No memories shared yet</Text>
            <Text style={styles.emptySubtext}>
              Your caregiver hasn't shared any memories yet. Check back later!
            </Text>
          </View>
        ) : (
          <View style={styles.memoriesGrid}>
            {memories.map((memory) => (
              <View key={memory.id} style={styles.memoryCard}>
                <Image source={{ uri: memory.imageUrl }} style={styles.memoryImage} />
                <View style={styles.memoryContent}>
                  <Text style={styles.memoryDescription}>{memory.description}</Text>
                  <View style={styles.memoryFooter}>
                    <Ionicons name="calendar" size={14} color="#7f8c8d" />
                    <Text style={styles.memoryDate}>
                      {new Date(memory.createdAt.seconds * 1000).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
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
  emptyState: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  emptyText: {
    fontSize: 20,
    color: '#7f8c8d',
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  memoriesGrid: {
    gap: 16,
  },
  memoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
    marginBottom: 12,
  },
  memoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 6,
  },
});
