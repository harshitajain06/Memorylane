# API Key Setup for AI Chat

This document explains how to set up the OpenAI API key in Firebase for the AI Chat feature.

## Firebase Collection Setup

1. **Create a collection called `apiKeys`** in your Firebase Firestore database
2. **Add a document with ID `openai`** in the `apiKeys` collection
3. **Add a field called `key`** with your OpenAI API key as the value

### Example Document Structure

```
Collection: apiKeys
Document ID: openai
Fields:
  - key: "your-openai-api-key-here"
```

## Security Rules

Make sure to set up proper Firestore security rules to protect your API keys:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to apiKeys collection for authenticated users
    match /apiKeys/{document} {
      allow read: if request.auth != null;
    }
  }
}
```

## Fallback Options

The system includes fallback mechanisms:

1. **Primary**: Firebase collection (`apiKeys/openai`)
2. **Secondary**: Environment variable (`EXPO_PUBLIC_OPENAI_API_KEY`)
3. **Tertiary**: Hardcoded fallback (for development only)

## Environment Variable Setup (Alternative)

If you prefer to use environment variables instead of Firebase:

1. Create a `.env` file in your project root
2. Add: `EXPO_PUBLIC_OPENAI_API_KEY=your-api-key-here`
3. The system will automatically use this as a fallback

## Testing

After setting up the API key in Firebase:

1. The AI Chat page will show "Loading services..." while fetching the key
2. Once loaded, the input field will be enabled
3. If there's an error, you'll see "Service temporarily unavailable"

## Troubleshooting

- **"Service temporarily unavailable"**: Check if the API key is correctly set in Firebase
- **"Loading services..." persists**: Check your internet connection and Firebase configuration
- **API calls fail**: Verify the API key is valid and has sufficient credits
