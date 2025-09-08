import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import uuid from "react-native-uuid";
import { auth, db } from "../../config/firebase";

export default function CaregiverDashboard() {
  const navigation = useNavigation();
  const [inviteCode, setInviteCode] = useState(null);
  const [patients, setPatients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Load patients
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const patientIds = userData.patients || [];

        const patientsData = [];
        for (const patientId of patientIds) {
          const patientDoc = await getDoc(doc(db, 'users', patientId));
          if (patientDoc.exists()) {
            patientsData.push({
              id: patientId,
              email: patientDoc.data().email,
            });
          }
        }
        setPatients(patientsData);
      }

      // Load tasks
      const tasksRef = collection(db, 'tasks');
      const tasksQuery = query(tasksRef, where('caregiverId', '==', user.uid));
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);

      // Load memories
      const memoriesRef = collection(db, 'memories');
      const memoriesQuery = query(memoriesRef, where('caregiverId', '==', user.uid));
      const memoriesSnapshot = await getDocs(memoriesQuery);
      const memoriesData = memoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMemories(memoriesData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateInvite = async () => {
    try {
    const code = uuid.v4().slice(0, 6); // short random code
    await setDoc(doc(db, "invites", code), {
      caregiverId: auth.currentUser.uid,
      createdAt: Date.now(),
    });
    setInviteCode(code);
    } catch (error) {
      console.error('Error generating invite:', error);
      Alert.alert('Error', 'Failed to generate invite code');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("LandingScreen");
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Here's your caregiving overview</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#4A90E2" />
            <Text style={styles.statNumber}>{patients.length}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
            <Text style={styles.statNumber}>{completedTasks.length}</Text>
            <Text style={styles.statLabel}>Completed Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#f39c12" />
            <Text style={styles.statNumber}>{pendingTasks.length}</Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="images" size={24} color="#9b59b6" />
            <Text style={styles.statNumber}>{memories.length}</Text>
            <Text style={styles.statLabel}>Memories Shared</Text>
          </View>
        </View>

        {/* Invite Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite New Patient</Text>
          <View style={styles.inviteSection}>
            <TouchableOpacity style={styles.inviteButton} onPress={generateInvite}>
              <Ionicons name="person-add" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.inviteButtonText}>Generate Invite Code</Text>
      </TouchableOpacity>
            {inviteCode && (
              <View style={styles.inviteCodeContainer}>
                <Text style={styles.inviteCodeLabel}>Share this code with your patient:</Text>
                <View style={styles.inviteCodeBox}>
                  <Text style={styles.inviteCode}>{inviteCode}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {/* Recent Tasks */}
          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#4A90E2" />
              <Text style={styles.activityTitle}>Recent Tasks</Text>
            </View>
            {tasks.length === 0 ? (
              <Text style={styles.emptyText}>No tasks assigned yet</Text>
            ) : (
              tasks.slice(0, 3).map((task) => (
                <View key={task.id} style={styles.activityItem}>
                  <View style={[styles.taskIndicator, task.completed && styles.completedIndicator]} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{task.title}</Text>
                    <Text style={styles.activitySubtext}>
                      For: {patients.find(p => p.id === task.patientId)?.email || 'Unknown'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Recent Memories */}
          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Ionicons name="images" size={20} color="#9b59b6" />
              <Text style={styles.activityTitle}>Recent Memories</Text>
            </View>
            {memories.length === 0 ? (
              <Text style={styles.emptyText}>No memories shared yet</Text>
            ) : (
              memories.slice(0, 3).map((memory) => (
                <View key={memory.id} style={styles.activityItem}>
                  <View style={styles.memoryIndicator} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText} numberOfLines={1}>
                      {memory.description}
                    </Text>
                    <Text style={styles.activitySubtext}>
                      {new Date(memory.createdAt.seconds * 1000).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('CaregiverTaskReminder')}
            >
              <Ionicons name="add-circle" size={24} color="#4A90E2" />
              <Text style={styles.actionText}>Add Task</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('UploadImages')}
            >
              <Ionicons name="camera" size={24} color="#9b59b6" />
              <Text style={styles.actionText}>Share Memory</Text>
            </TouchableOpacity>
      <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('InviteScreen')}
            >
              <Ionicons name="people" size={24} color="#27ae60" />
              <Text style={styles.actionText}>Manage Patients</Text>
      </TouchableOpacity>
    </View>
        </View>
      </View>
    </ScrollView>
  );
}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  logoutButton: {
    padding: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  inviteSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  buttonIcon: {
    marginRight: 8,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteCodeContainer: {
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
    textAlign: 'center',
  },
  inviteCodeBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
    letterSpacing: 2,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f39c12',
    marginRight: 12,
  },
  completedIndicator: {
    backgroundColor: '#27ae60',
  },
  memoryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9b59b6',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 2,
  },
  activitySubtext: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      },
    }),
  },
  actionText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});
