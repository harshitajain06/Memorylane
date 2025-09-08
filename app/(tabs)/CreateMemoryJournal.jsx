import { useNavigation } from '@react-navigation/native';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../config/firebase';

const CreateMemoryJournal = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showJournalList, setShowJournalList] = useState(false);

  const moods = ['😊 Happy', '😢 Sad', '😌 Calm', '😤 Angry', '😰 Anxious', '😍 Excited', '😴 Tired', '🤔 Thoughtful'];

  useEffect(() => {
    // Test Firebase connection first
    testFirebaseConnection();
    fetchJournals();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firebase connection...');
      console.log('Firebase app:', db.app);
      console.log('Auth instance:', auth);
      
      // Try to read a simple document to test connection
      const testRef = collection(db, 'test');
      console.log('Test collection reference created');
    } catch (error) {
      console.error('Firebase connection test failed:', error);
    }
  };

  const fetchJournals = async () => {
    console.log('Fetching journals...');
    console.log('Current user:', auth.currentUser);
    
    if (!auth.currentUser) {
      console.log('No user authenticated');
      Toast.show({
        type: 'error',
        text1: 'Authentication Required',
        text2: 'Please log in to view your journals'
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log('User ID:', auth.currentUser.uid);
      const journalsRef = collection(db, 'memoryJournals');
      const q = query(
        journalsRef,
        where('userId', '==', auth.currentUser.uid)
        // Temporarily removed orderBy to avoid index requirement
        // orderBy('createdAt', 'desc')
      );
      console.log('Executing query...');
      const querySnapshot = await getDocs(q);
      console.log('Query executed, docs count:', querySnapshot.docs.length);
      
      const journalsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt in descending order (newest first)
      journalsData.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      
      console.log('Journals data:', journalsData);
      setJournals(journalsData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Found ${journalsData.length} journal entries`
      });
    } catch (error) {
      console.error('Error fetching journals:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to fetch journals';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your login status.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'Please log in to save journal entries');
      return;
    }

    setLoading(true);
    try {
      console.log('Saving journal...');
      console.log('User ID:', auth.currentUser.uid);
      
      const journalData = {
        title: title.trim(),
        content: content.trim(),
        mood: mood || '😊 Happy',
        date: date,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Journal data:', journalData);

      if (isEditing && editingId) {
        // Update existing journal
        console.log('Updating journal:', editingId);
        const journalRef = doc(db, 'memoryJournals', editingId);
        await updateDoc(journalRef, {
          ...journalData,
          updatedAt: new Date()
        });
        console.log('Journal updated successfully');
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Journal updated successfully'
        });
      } else {
        // Create new journal
        console.log('Creating new journal...');
        const docRef = await addDoc(collection(db, 'memoryJournals'), journalData);
        console.log('Journal created with ID:', docRef.id);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Journal saved successfully'
        });
      }

      // Reset form
      setTitle('');
      setContent('');
      setMood('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsEditing(false);
      setEditingId(null);
      
      // Refresh journals list
      fetchJournals();
    } catch (error) {
      console.error('Error saving journal:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to save journal';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your login status.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (journal) => {
    setTitle(journal.title);
    setContent(journal.content);
    setMood(journal.mood);
    setDate(journal.date);
    setIsEditing(true);
    setEditingId(journal.id);
    setShowJournalList(false);
  };

  const handleDelete = (journalId) => {
    Alert.alert(
      'Delete Journal',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'memoryJournals', journalId));
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Journal deleted successfully'
              });
              fetchJournals();
            } catch (error) {
              console.error('Error deleting journal:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete journal'
              });
            }
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setMood('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsEditing(false);
    setEditingId(null);
  };

  const renderJournalItem = ({ item }) => (
    <View style={styles.journalItem}>
      <View style={styles.journalHeader}>
        <Text style={styles.journalTitle}>{item.title}</Text>
        <Text style={styles.journalDate}>{item.date}</Text>
      </View>
      <Text style={styles.journalMood}>{item.mood}</Text>
      <Text style={styles.journalContent} numberOfLines={3}>
        {item.content}
      </Text>
      <View style={styles.journalActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Memory Journal' : 'Create Memory Journal'}
          </Text>
          <TouchableOpacity
            style={styles.viewJournalsButton}
            onPress={() => setShowJournalList(!showJournalList)}
          >
            <Text style={styles.viewJournalsButtonText}>
              {showJournalList ? 'Hide Journals' : 'View My Journals'}
            </Text>
          </TouchableOpacity>
        </View>

        {showJournalList && (
          <View style={styles.journalListContainer}>
            <Text style={styles.journalListTitle}>My Journal Entries</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#567396" />
            ) : (
              <FlatList
                data={journals}
                renderItem={renderJournalItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.journalList}
              />
            )}
          </View>
        )}

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter journal title"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>How are you feeling?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodContainer}>
              {moods.map((moodOption, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.moodButton,
                    mood === moodOption && styles.selectedMood
                  ]}
                  onPress={() => setMood(moodOption)}
                >
                  <Text style={[
                    styles.moodText,
                    mood === moodOption && styles.selectedMoodText
                  ]}>
                    {moodOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Journal Content *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Write about your day, thoughts, memories..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Journal' : 'Save Journal'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCE9FE',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#567396',
    textAlign: 'center',
    marginBottom: 10,
  },
  viewJournalsButton: {
    backgroundColor: '#567396',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
  },
  viewJournalsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  journalListContainer: {
    marginBottom: 20,
  },
  journalListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#567396',
    marginBottom: 10,
  },
  journalList: {
    maxHeight: 300,
  },
  journalItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#567396',
    flex: 1,
  },
  journalDate: {
    fontSize: 12,
    color: '#999',
  },
  journalMood: {
    fontSize: 14,
    marginBottom: 8,
  },
  journalContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  journalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#567396',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 120,
  },
  moodContainer: {
    flexDirection: 'row',
  },
  moodButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  selectedMood: {
    backgroundColor: '#567396',
    borderColor: '#567396',
  },
  moodText: {
    fontSize: 14,
    color: '#333',
  },
  selectedMoodText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#567396',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#567396',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateMemoryJournal;
