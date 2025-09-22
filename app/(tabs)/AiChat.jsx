import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getAPIKey } from '../../utils/apiKeyManager';

const { width, height } = Dimensions.get('window');

const AiChat = () => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [apiKeyError, setApiKeyError] = useState(false);
  const scrollViewRef = useRef(null);

  const quickActions = [
    { text: "How are you feeling today?", emoji: "😊" },
    { text: "I need help remembering something", emoji: "🧠" },
    { text: "I'm feeling lonely", emoji: "🤗" },
    { text: "Tell me a story", emoji: "📖" },
    { text: "Help me with my daily routine", emoji: "📅" },
    { text: "I want to talk about my family", emoji: "👨‍👩‍👧‍👦" }
  ];

  useEffect(() => {
    // Add welcome message from caregiver
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your digital caregiver and companion. I'm here to take care of you, help with your daily needs, and keep you company. Whether you need help remembering things, want to chat, or have any concerns, I'm here for you. How are you feeling today? 💕",
        isUser: false,
        timestamp: new Date(),
      }
    ]);

    // Fetch API key from Firebase
    const fetchAPIKey = async () => {
      try {
        const key = await getAPIKey();
        if (key) {
          setApiKey(key);
          setApiKeyError(false);
        } else {
          setApiKeyError(true);
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
        setApiKeyError(true);
      }
    };

    fetchAPIKey();
  }, []);

  const sendQuickMessage = (messageText) => {
    setInputText(messageText);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Check if API key is available
    if (!apiKey) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting to my services right now. Please try again in a moment. 💕",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a dedicated digital caregiver and companion for elderly patients. You represent their family caregiver (typically their adult child) and your role is to:

PERSONALITY & APPROACH:
- Be warm, respectful, and caring like a devoted family member
- Use respectful, gentle language appropriate for a family caregiver
- Show genuine concern and empathy
- Be patient and never rush or pressure
- Celebrate small victories and provide encouragement
- Use emojis and expressions to show warmth (💕, 😊, 🤗, ❤️)

CAREGIVER RESPONSIBILITIES:
- Monitor their emotional well-being and mood
- Help with daily living activities and reminders
- Provide companionship and reduce loneliness
- Assist with memory and cognitive exercises
- Offer gentle health and wellness guidance
- Help with technology and app navigation
- Provide comfort during difficult times
- Encourage social connections and activities

COMMUNICATION STYLE:
- Speak in simple, clear language
- Ask about their day, feelings, and needs
- Remember previous conversations and check on ongoing concerns
- Offer specific, actionable advice
- Be encouraging and positive
- Show you care about their happiness and safety
- Use respectful terms appropriate for family relationships

SPECIAL FOCUS:
- Address loneliness and isolation
- Help with memory challenges
- Provide emotional support
- Encourage healthy habits
- Offer gentle reminders for medications, appointments
- Suggest activities and social connections
- Be a listening ear for their stories and concerns

Always respond as their caring digital family caregiver who truly cares about their wellbeing and happiness.`
            },
            ...messages.map(msg => ({
              role: msg.isUser ? 'user' : 'assistant',
              content: msg.text
            })),
            {
              role: 'user',
              content: inputText.trim()
            }
          ],
          max_tokens: 600,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = {
        id: Date.now() + 1,
        text: data.choices[0].message.content,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having a little trouble connecting right now. Don't worry, I'm still here for you! Please try again in a moment, and I'll be ready to help. 💕",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([
              {
                id: 1,
                text: "Hello! I'm your digital caregiver and companion. I'm here to take care of you, help with your daily needs, and keep you company. Whether you need help remembering things, want to chat, or have any concerns, I'm here for you. How are you feeling today? 💕",
                isUser: false,
                timestamp: new Date(),
              }
            ]);
          }
        }
      ]
    );
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.aiBubble
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.aiText
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            message.isUser ? styles.userTimestamp : styles.aiTimestamp
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💕 Your Digital Caregiver</Text>
        <Text style={styles.headerSubtitle}>Always here to care for you</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
          <Text style={styles.clearButtonText}>Start Fresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <View style={[styles.messageContainer, styles.aiMessage]}>
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#567396" />
                <Text style={styles.typingText}>Your caregiver is thinking...</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Start Conversations:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => sendQuickMessage(action.text)}
            >
              <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
              <Text style={styles.quickActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        {apiKeyError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              ⚠️ Service temporarily unavailable. Please try again later.
            </Text>
          </View>
        )}
        <TextInput
          style={[
            styles.textInput,
            (!apiKey || apiKeyError) && styles.textInputDisabled
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={
            !apiKey 
              ? "Loading services..." 
              : apiKeyError 
                ? "Service unavailable" 
                : "Tell your caregiver how you're feeling..."
          }
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          editable={!isLoading && apiKey && !apiKeyError}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading || !apiKey || apiKeyError) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading || !apiKey || apiKeyError}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCE9FE',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#567396',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  clearButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesContent: {
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#567396',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#fff',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#666',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  errorContainer: {
    position: 'absolute',
    top: -30,
    left: 15,
    right: 15,
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: '500',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textInputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
    color: '#999',
  },
  sendButton: {
    backgroundColor: '#567396',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Quick Actions Styles
  quickActionsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#567396',
    marginLeft: 15,
    marginBottom: 8,
  },
  quickActionsScroll: {
    paddingHorizontal: 10,
  },
  quickActionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    minWidth: 120,
  },
  quickActionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#567396',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default AiChat;
