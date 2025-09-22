import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../../config/firebase';

export default function PatientDashboard({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    recentJournals: [],
    sharedMemories: [],
    tasks: [],
    recentMessages: [],
    gameStats: {
      totalGames: 0,
      averageScore: 0,
      lastPlayed: null
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Load all dashboard data in parallel
      const [
        journalsData,
        memoriesData,
        tasksData
      ] = await Promise.all([
        loadRecentJournals(),
        loadSharedMemories(),
        loadTasks()
      ]);

      setDashboardData({
        recentJournals: journalsData,
        sharedMemories: memoriesData,
        tasks: tasksData,
        recentMessages: [
          {
            id: 1,
            text: "Hello! I'm your digital caregiver and companion. I'm here to take care of you, help with your daily needs, and keep you company. How are you feeling today? 💕",
            timestamp: new Date(),
            isUser: false
          }
        ],
        gameStats: {
          totalGames: 0,
          averageScore: 0,
          lastPlayed: null
        }
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRecentJournals = async () => {
    try {
      const journalsRef = collection(db, 'memoryJournals');
      const q = query(
        journalsRef,
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const journalsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by creation date and take only recent 3
      return journalsData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
    } catch (error) {
      console.error('Error loading journals:', error);
      return [];
    }
  };

  const loadSharedMemories = async () => {
    try {
      // Get user's caregiver ID
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)));
      if (userDoc.empty) return [];

      const userData = userDoc.docs[0].data();
      const caregiverId = userData.caregiverId;

      if (!caregiverId) return [];

      // Fetch recent memories from caregiver
      const memoriesRef = collection(db, 'memories');
      const q = query(memoriesRef, where('caregiverId', '==', caregiverId));
      const querySnapshot = await getDocs(q);
      
      const memoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by creation date and take only recent 3
      return memoriesData
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        })
        .slice(0, 3);
    } catch (error) {
      console.error('Error loading memories:', error);
      return [];
    }
  };

  const loadTasks = async () => {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('patientId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const tasksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return tasksData;
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatDate = (date) => {
    if (date?.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const getMoodEmoji = (mood) => {
    if (mood?.includes('😊')) return '😊';
    if (mood?.includes('😢')) return '😢';
    if (mood?.includes('😌')) return '😌';
    if (mood?.includes('😤')) return '😤';
    if (mood?.includes('😰')) return '😰';
    if (mood?.includes('😍')) return '😍';
    if (mood?.includes('😴')) return '😴';
    if (mood?.includes('🤔')) return '🤔';
    return '😊';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  const pendingTasks = dashboardData.tasks.filter(task => !task.completed);
  const completedTasks = dashboardData.tasks.filter(task => task.completed);

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
          <Text style={styles.title}>Welcome Back! 👋</Text>
          <Text style={styles.subtitle}>Your personalized care dashboard</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="book" size={24} color="#4A90E2" />
            <Text style={styles.statNumber}>{dashboardData.recentJournals.length}</Text>
            <Text style={styles.statLabel}>Recent Journals</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="images" size={24} color="#4A90E2" />
            <Text style={styles.statNumber}>{dashboardData.sharedMemories.length}</Text>
            <Text style={styles.statLabel}>Shared Memories</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#4A90E2" />
            <Text style={styles.statNumber}>{pendingTasks.length}</Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
          </View>
        </View>

        {/* AI Chat Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles" size={20} color="#567396" />
            <Text style={styles.sectionTitle}>AI Caregiver Chat</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('AiChat')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chatSummary}>
            <Text style={styles.chatMessage}>
              "Hello! I'm your digital caregiver and companion. I'm here to take care of you, help with your daily needs, and keep you company. How are you feeling today? 💕"
            </Text>
            <TouchableOpacity
              style={styles.quickChatButton}
              onPress={() => navigation.navigate('AiChat')}
            >
              <Text style={styles.quickChatText}>Start Chatting</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Memory Journals Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={20} color="#567396" />
            <Text style={styles.sectionTitle}>Recent Memory Journals</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('FetchMemoryJournal')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {dashboardData.recentJournals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No journal entries yet</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateMemoryJournal')}
              >
                <Text style={styles.createButtonText}>Create First Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.journalsList}>
              {dashboardData.recentJournals.map((journal) => (
                <View key={journal.id} style={styles.journalItem}>
                  <View style={styles.journalHeader}>
                    <Text style={styles.journalTitle} numberOfLines={1}>{journal.title}</Text>
                    <Text style={styles.journalMood}>{getMoodEmoji(journal.mood)}</Text>
                  </View>
                  <Text style={styles.journalContent} numberOfLines={2}>
                    {journal.content}
                  </Text>
                  <Text style={styles.journalDate}>{formatDate(journal.createdAt)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Shared Memories Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images" size={20} color="#567396" />
            <Text style={styles.sectionTitle}>Shared Memories</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('FetchImages')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {dashboardData.sharedMemories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No memories shared yet</Text>
              <Text style={styles.emptySubtext}>Your caregiver will share memories with you soon!</Text>
            </View>
          ) : (
            <View style={styles.memoriesList}>
              {dashboardData.sharedMemories.map((memory) => (
                <View key={memory.id} style={styles.memoryItem}>
                  <Text style={styles.memoryDescription} numberOfLines={2}>
                    {memory.description}
                  </Text>
                  <Text style={styles.memoryDate}>{formatDate(memory.createdAt)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tasks Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-done" size={20} color="#567396" />
            <Text style={styles.sectionTitle}>My Tasks</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('PatientTaskReminder')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tasksSummary}>
            <View style={styles.taskStats}>
              <View style={styles.taskStat}>
                <Text style={styles.taskStatNumber}>{pendingTasks.length}</Text>
                <Text style={styles.taskStatLabel}>Pending</Text>
              </View>
              <View style={styles.taskStat}>
                <Text style={styles.taskStatNumber}>{completedTasks.length}</Text>
                <Text style={styles.taskStatLabel}>Completed</Text>
              </View>
            </View>
            {pendingTasks.length > 0 && (
              <View style={styles.pendingTasks}>
                <Text style={styles.pendingTitle}>Recent Tasks:</Text>
                {pendingTasks.slice(0, 2).map((task) => (
                  <View key={task.id} style={styles.taskItem}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <Text style={styles.taskDate}>{formatDate(task.createdAt)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Game Zone Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="game-controller" size={20} color="#567396" />
            <Text style={styles.sectionTitle}>Memory Games</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('GameZone')}
            >
              <Text style={styles.viewAllText}>Play Now</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gameSummary}>
            <Text style={styles.gameDescription}>
              Keep your mind sharp with fun memory games and puzzles!
            </Text>
            <View style={styles.gameFeatures}>
              <Text style={styles.gameFeature}>🃏 Memory Cards</Text>
              <Text style={styles.gameFeature}>🔍 Word Search</Text>
              <Text style={styles.gameFeature}>🔢 Number Sequence</Text>
            </View>
          </View>
        </View>


      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCE9FE',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCE9FE',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#567396',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#567396',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#567396',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#567396',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#567396',
    marginLeft: 8,
    flex: 1,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
  },
  viewAllText: {
    fontSize: 12,
    color: '#567396',
    fontWeight: '600',
  },
  chatSummary: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
  },
  chatMessage: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  quickChatButton: {
    backgroundColor: '#567396',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  quickChatText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 15,
  },
  createButton: {
    backgroundColor: '#567396',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  journalsList: {
    gap: 10,
  },
  journalItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  journalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#567396',
    flex: 1,
  },
  journalMood: {
    fontSize: 16,
  },
  journalContent: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 5,
  },
  journalDate: {
    fontSize: 11,
    color: '#999',
  },
  memoriesList: {
    gap: 10,
  },
  memoryItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  memoryDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  memoryDate: {
    fontSize: 11,
    color: '#999',
  },
  tasksSummary: {
    gap: 12,
  },
  taskStats: {
    flexDirection: 'row',
    gap: 20,
  },
  taskStat: {
    alignItems: 'center',
  },
  taskStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#567396',
  },
  taskStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  pendingTasks: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#567396',
    marginBottom: 8,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  taskTitle: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  taskDate: {
    fontSize: 11,
    color: '#999',
  },
  gameSummary: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  gameFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gameFeature: {
    fontSize: 12,
    color: '#567396',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
