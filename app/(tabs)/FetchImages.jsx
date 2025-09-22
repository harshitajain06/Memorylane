import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../config/firebase';

const { width } = Dimensions.get('window');

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
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading shared memories...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we fetch your precious moments</Text>
        </View>
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
          <View style={styles.headerIcon}>
            <Ionicons name="heart" size={32} color="#667eea" />
          </View>
          <Text style={styles.title}>Shared Memories</Text>
          <Text style={styles.subtitle}>Precious moments shared by your caregiver</Text>
          {memories.length > 0 && (
            <View style={styles.memoryCount}>
              <Text style={styles.memoryCountText}>{memories.length} {memories.length === 1 ? 'memory' : 'memories'}</Text>
            </View>
          )}
        </View>

        {/* Memories List */}
        {memories.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="heart-outline" size={80} color="#667eea" />
            </View>
            <Text style={styles.emptyText}>No memories shared yet</Text>
            <Text style={styles.emptySubtext}>
              Your caregiver hasn't shared any precious moments yet.{'\n'}Check back later for new memories!
            </Text>
            <View style={styles.emptyAction}>
              <Ionicons name="refresh" size={20} color="#667eea" />
              <Text style={styles.emptyActionText}>Pull down to refresh</Text>
            </View>
          </View>
        ) : (
          <View style={styles.memoriesGrid}>
            {memories.map((memory, index) => (
              <TouchableOpacity key={memory.id} style={styles.memoryCard} activeOpacity={0.8}>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: memory.imageUrl }} style={styles.memoryImage} />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="eye" size={20} color="#fff" />
                  </View>
                </View>
                <View style={styles.memoryContent}>
                  <Text style={styles.memoryDescription} numberOfLines={3}>
                    {memory.description}
                  </Text>
                  <View style={styles.memoryFooter}>
                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar" size={14} color="#667eea" />
                      <Text style={styles.memoryDate}>
                        {new Date(memory.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={styles.memoryBadge}>
                      <Text style={styles.badgeText}>#{index + 1}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
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
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    minHeight: '100%',
    ...Platform.select({
      web: {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
    textAlign: 'center',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  memoryCount: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  memoryCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginTop: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 24,
    color: '#2d3748',
    marginBottom: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyActionText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  memoriesGrid: {
    gap: 20,
    alignItems: 'center',
    width: '100%',
  },
  memoryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 420,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  memoryImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
    ...Platform.select({
      web: {
        transition: 'opacity 0.2s ease',
      },
    }),
  },
  memoryContent: {
    padding: 20,
  },
  memoryDescription: {
    fontSize: 16,
    color: '#2d3748',
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '500',
  },
  memoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryDate: {
    fontSize: 13,
    color: '#718096',
    marginLeft: 6,
    fontWeight: '500',
  },
  memoryBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
