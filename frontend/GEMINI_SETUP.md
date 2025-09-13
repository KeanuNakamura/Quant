# Gemini AI Integration Setup

## Getting Your Gemini API Key

1. **Visit Google AI Studio**: Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

2. **Create an API Key**: 
   - Sign in with your Google account
   - Click "Create API Key"
   - Choose an existing project or create a new one
   - Copy the generated API key

3. **Configure the Environment**:
   - Open the `.env` file in your frontend directory
   - Replace the placeholder with your actual API key:
   ```
   REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Restart the Development Server**:
   ```bash
   npm start
   ```

## How It Works

The LLMConversation component now:

- **Connects to Gemini AI** to have natural conversations with users
- **Automatically extracts** investment profile data from user responses
- **Adapts questions** based on the conversation flow
- **Handles errors gracefully** with fallback messages
- **Validates data** and provides helpful error messages

## Features

- ✅ **Natural Language Processing**: Users can respond in their own words
- ✅ **Intelligent Data Extraction**: Automatically parses risk scores, amounts, timeframes
- ✅ **Conversational Flow**: AI adapts questions based on previous responses  
- ✅ **Error Handling**: Graceful fallbacks when API is unavailable
- ✅ **Real-time Feedback**: Loading states and typing indicators
- ✅ **Data Validation**: Ensures collected data meets requirements

## API Usage

The integration uses:
- **Model**: `gemini-pro` 
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 200 (concise responses)
- **Safety**: Built-in content filtering

## Privacy & Security

- API key is stored in environment variables
- No conversation data is stored permanently
- All communication is encrypted via HTTPS
- User data is only processed locally