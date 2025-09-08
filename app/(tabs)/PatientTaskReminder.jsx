import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../../config/firebase';

export default function PatientTaskReminder() {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('patientId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const tasksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by creation date (newest first)
      const sortedTasks = tasksData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed: !currentStatus
      });
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: !currentStatus }
          : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

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
          <Text style={styles.title}>My Tasks</Text>
          <Text style={styles.subtitle}>Tasks assigned by your caregiver</Text>
        </View>

        {/* Task Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{pendingTasks.length}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{completedTasks.length}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{tasks.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={60} color="#bdc3c7" />
            <Text style={styles.emptyText}>No tasks assigned yet</Text>
            <Text style={styles.emptySubtext}>
              Your caregiver hasn't assigned any tasks yet. Check back later!
            </Text>
          </View>
        ) : (
          <View style={styles.tasksContainer}>
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <View style={styles.taskSection}>
                <Text style={styles.sectionTitle}>Pending Tasks</Text>
                {pendingTasks.map((task) => (
                  <View key={task.id} style={styles.taskCard}>
                    <TouchableOpacity
                      style={styles.taskContent}
                      onPress={() => toggleTaskCompletion(task.id, task.completed)}
                    >
                      <View style={styles.taskHeader}>
                        <View style={[styles.checkbox, task.completed && styles.checkedBox]}>
                          {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </View>
                        <View style={styles.taskInfo}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <Text style={styles.taskDescription}>{task.description}</Text>
                          <Text style={styles.taskDate}>
                            {new Date(task.createdAt.seconds * 1000).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <View style={styles.taskSection}>
                <Text style={styles.sectionTitle}>Completed Tasks</Text>
                {completedTasks.map((task) => (
                  <View key={task.id} style={[styles.taskCard, styles.completedTaskCard]}>
                    <TouchableOpacity
                      style={styles.taskContent}
                      onPress={() => toggleTaskCompletion(task.id, task.completed)}
                    >
                      <View style={styles.taskHeader}>
                        <View style={[styles.checkbox, task.completed && styles.checkedBox]}>
                          {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </View>
                        <View style={styles.taskInfo}>
                          <Text style={[styles.taskTitle, styles.completedTaskTitle]}>{task.title}</Text>
                          <Text style={[styles.taskDescription, styles.completedTaskDescription]}>{task.description}</Text>
                          <Text style={styles.taskDate}>
                            {new Date(task.createdAt.seconds * 1000).toLocaleDateString()}
        </Text>
      </View>
    </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
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
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
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
  tasksContainer: {
    gap: 20,
  },
  taskSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  completedTaskCard: {
    opacity: 0.7,
  },
  taskContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#7f8c8d',
  },
  taskDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 8,
  },
  completedTaskDescription: {
    color: '#95a5a6',
  },
  taskDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
});
