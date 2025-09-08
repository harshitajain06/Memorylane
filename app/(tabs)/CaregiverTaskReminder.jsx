import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { addDoc, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../../config/firebase';

export default function CaregiverTaskReminder() {
  const navigation = useNavigation();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patients, setPatients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);

  useEffect(() => {
    loadPatients();
    loadTasks();
  }, []);

  const loadPatients = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const patientIds = userData.patients || [];

      if (patientIds.length === 0) {
        setPatients([]);
        setLoading(false);
        return;
      }

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
    } catch (error) {
      console.error('Error loading patients:', error);
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('caregiverId', '==', user.uid));
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
    }
  };

  const addTask = async () => {
    if (!taskTitle.trim() || !taskDescription.trim() || !selectedPatient) {
      Alert.alert('Error', 'Please fill in all fields and select a patient');
      return;
    }

    setAddingTask(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to add tasks');
        return;
      }

      const taskData = {
        caregiverId: user.uid,
        patientId: selectedPatient,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        completed: false,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'tasks'), taskData);
      
      Alert.alert('Success', 'Task added successfully!');
      setTaskTitle('');
      setTaskDescription('');
      setSelectedPatient('');
      loadTasks(); // Reload tasks
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    } finally {
      setAddingTask(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Task Management</Text>
          <Text style={styles.subtitle}>Add tasks for your patients</Text>
        </View>

        {/* Add Task Section */}
        <View style={styles.addTaskSection}>
          <Text style={styles.sectionTitle}>Add New Task</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Select Patient</Text>
            <View style={styles.patientSelector}>
              {patients.length === 0 ? (
                <Text style={styles.noPatientsText}>No patients found. Invite patients first.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {patients.map((patient) => (
                    <TouchableOpacity
                      key={patient.id}
                      style={[
                        styles.patientOption,
                        selectedPatient === patient.id && styles.selectedPatient
                      ]}
                      onPress={() => setSelectedPatient(patient.id)}
                    >
                      <Text style={[
                        styles.patientText,
                        selectedPatient === patient.id && styles.selectedPatientText
                      ]}>
                        {patient.email}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Task Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter task title..."
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholderTextColor="#95a5a6"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Task Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter task description..."
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor="#95a5a6"
            />
          </View>

          <TouchableOpacity 
            style={[styles.addButton, addingTask && styles.addButtonDisabled]} 
            onPress={addTask}
            disabled={addingTask || patients.length === 0}
          >
            {addingTask ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.addButtonText}>Add Task</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Tasks List */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Assigned Tasks</Text>
          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={50} color="#bdc3c7" />
              <Text style={styles.emptyText}>No tasks assigned yet</Text>
              <Text style={styles.emptySubtext}>Add your first task above</Text>
            </View>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={[styles.statusBadge, task.completed && styles.completedBadge]}>
                    <Text style={[styles.statusText, task.completed && styles.completedText]}>
                      {task.completed ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.taskDescription}>{task.description}</Text>
                <View style={styles.taskFooter}>
                  <Text style={styles.taskDate}>
                    {new Date(task.createdAt.seconds * 1000).toLocaleDateString()}
                  </Text>
                  <Text style={styles.patientEmail}>
                    For: {patients.find(p => p.id === task.patientId)?.email || 'Unknown'}
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
  addTaskSection: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  patientSelector: {
    minHeight: 50,
  },
  patientOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    marginRight: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  selectedPatient: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  patientText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  selectedPatientText: {
    color: '#fff',
  },
  noPatientsText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  addButton: {
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
  addButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tasksSection: {
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
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fff3cd',
  },
  completedBadge: {
    backgroundColor: '#d4edda',
  },
  statusText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  completedText: {
    color: '#155724',
  },
  taskDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  patientEmail: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
});
