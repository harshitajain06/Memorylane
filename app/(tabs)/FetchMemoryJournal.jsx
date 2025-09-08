import { useNavigation } from '@react-navigation/native';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../config/firebase';

const FetchMemoryJournal = () => {
  const navigation = useNavigation();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredJournals, setFilteredJournals] = useState([]);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, mood
  const [moodFilter, setMoodFilter] = useState('all');

  const moods = ['😊 Happy', '😢 Sad', '😌 Calm', '😤 Angry', '😰 Anxious', '😍 Excited', '😴 Tired', '🤔 Thoughtful'];

  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    filterAndSortJournals();
  }, [journals, searchQuery, sortBy, moodFilter]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJournals();
    setRefreshing(false);
  };

  const filterAndSortJournals = () => {
    let filtered = journals;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(journal =>
        journal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        journal.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by mood
    if (moodFilter !== 'all') {
      filtered = filtered.filter(journal => journal.mood === moodFilter);
    }

    // Sort journals
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'mood':
          return a.mood.localeCompare(b.mood);
        default:
          return 0;
      }
    });

    setFilteredJournals(filtered);
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

  const handleViewJournal = (journal) => {
    setSelectedJournal(journal);
    setModalVisible(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderJournalItem = ({ item }) => (
    <TouchableOpacity
      style={styles.journalItem}
      onPress={() => handleViewJournal(item)}
    >
      <View style={styles.journalHeader}>
        <Text style={styles.journalTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.journalDate}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <Text style={styles.journalMood}>{item.mood}</Text>
      <Text style={styles.journalContent} numberOfLines={3}>
        {item.content}
      </Text>
      <View style={styles.journalActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleViewJournal(item)}
        >
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Journal Entries</Text>
      <Text style={styles.emptyStateText}>
        Start creating your memory journal entries to see them here.
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateMemoryJournal')}
      >
        <Text style={styles.createButtonText}>Create First Entry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search journals..."
          placeholderTextColor="#999"
        />
      </View>
      
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodFilterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, moodFilter === 'all' && styles.activeFilter]}
            onPress={() => setMoodFilter('all')}
          >
            <Text style={[styles.filterButtonText, moodFilter === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          {moods.map((mood, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.filterButton, moodFilter === mood && styles.activeFilter]}
              onPress={() => setMoodFilter(mood)}
            >
              <Text style={[styles.filterButtonText, moodFilter === mood && styles.activeFilterText]}>
                {mood}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          {['newest', 'oldest', 'mood'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.sortButton, sortBy === option && styles.activeSort]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[styles.sortButtonText, sortBy === option && styles.activeSortText]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Memory Journals</Text>
        <Text style={styles.headerSubtitle}>
          {filteredJournals.length} {filteredJournals.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>

      {renderFilters()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#567396" />
          <Text style={styles.loadingText}>Loading journals...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredJournals}
          renderItem={renderJournalItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedJournal?.title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDate}>
                {selectedJournal && formatDate(selectedJournal.createdAt)}
              </Text>
              <Text style={styles.modalMood}>{selectedJournal?.mood}</Text>
              <Text style={styles.modalContent}>
                {selectedJournal?.content}
              </Text>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={() => {
                  setModalVisible(false);
                  handleDelete(selectedJournal?.id);
                }}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeModalButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCE9FE',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#567396',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#567396',
    textAlign: 'center',
    marginTop: 5,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  filterRow: {
    marginBottom: 15,
  },
  moodFilterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  activeFilter: {
    backgroundColor: '#567396',
    borderColor: '#567396',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#567396',
    marginRight: 10,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  activeSort: {
    backgroundColor: '#567396',
    borderColor: '#567396',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#333',
  },
  activeSortText: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  journalItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 15,
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
    marginBottom: 8,
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#567396',
    flex: 1,
  },
  journalDate: {
    fontSize: 12,
    color: '#999',
  },
  journalMood: {
    fontSize: 16,
    marginBottom: 10,
  },
  journalContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 15,
  },
  journalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
  },
  viewButton: {
    backgroundColor: '#567396',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#567396',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#567396',
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#567396',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  createButton: {
    backgroundColor: '#567396',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#567396',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#999',
  },
  modalBody: {
    maxHeight: 400,
  },
  modalDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  modalMood: {
    fontSize: 16,
    marginBottom: 15,
  },
  modalContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
  },
  deleteModalButton: {
    backgroundColor: '#F44336',
  },
  closeModalButton: {
    backgroundColor: '#567396',
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default FetchMemoryJournal;
