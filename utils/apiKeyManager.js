import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Fetches the OpenAI API key from Firebase collection
 * @returns {Promise<string>} The API key or null if not found
 */
export const getOpenAIAPIKey = async () => {
  try {
    // Reference to the API keys collection document
    const apiKeyDocRef = doc(db, 'apiKeysSpandan', 'openai');
    const apiKeyDoc = await getDoc(apiKeyDocRef);
    
    if (apiKeyDoc.exists()) {
      const data = apiKeyDoc.data();
      return data.key || null;
    } else {
      console.warn('OpenAI API key document not found in Firebase');
      return null;
    }
  } catch (error) {
    console.error('Error fetching OpenAI API key from Firebase:', error);
    return null;
  }
};

/**
 * Fetches API key from Firebase only
 * @returns {Promise<string>} The API key or "key not found" if not available
 */
export const getAPIKey = async () => {
  // Try to get from Firebase
  const firebaseKey = await getOpenAIAPIKey();
  if (firebaseKey) {
    return firebaseKey;
  }
  
  // No fallback - return error message
  console.error('API key not found in Firebase');
  return 'key not found';
};
