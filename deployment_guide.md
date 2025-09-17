# MoodSync Deployment Guide

## Issues Fixed

### 🚨 Security Issues Resolved
- ✅ Removed hardcoded API key from server.js
- ✅ Added environment variable validation
- ✅ Created secure environment configuration files
- ✅ Updated CORS settings for production

### 🔄 Backend Issues Fixed
- ✅ Fixed duplicate socket event handlers
- ✅ Separated match messages from mood chat messages
- ✅ Improved WebSocket configuration for Firebase hosting
- ✅ Added proper error handling and timeouts

### 📱 Frontend Configuration
- ✅ Created centralized app configuration
- ✅ Updated API service to use dynamic URLs
- ✅ Added environment-based URL switching

## Deployment Steps

### 1. Backend Deployment (Google Cloud Run)

1. **Set Environment Variables in Cloud Run:**
   ```bash
   gcloud run deploy moodsync-backend \
     --set-env-vars GEMINI_API_KEY=your_actual_api_key_here \
     --set-env-vars NODE_ENV=production \
     --set-env-vars PORT=8080
   ```

2. **Update CORS Origins:**
   - Replace `your-firebase-app.web.app` and `your-firebase-app.firebaseapp.com` in server.js with your actual Firebase hosting URLs

### 2. Frontend Deployment (Firebase Hosting)

1. **Update App Configuration:**
   - Edit `lib/config/app_config.dart`
   - Replace `https://your-cloud-run-url.run.app` with your actual Cloud Run URL

2. **Build and Deploy:**
   ```bash
   flutter build web --release
   firebase deploy --only hosting
   ```

### 3. Environment Variables Setup

**For Development (.env):**
```
GEMINI_API_KEY=your_api_key_here
NODE_ENV=development
PORT=3000
```

**For Production (Cloud Run Environment Variables):**
```
GEMINI_API_KEY=your_api_key_here
NODE_ENV=production
PORT=8080
```

## Why Matchmaking Wasn't Working

### Root Causes Identified:

1. **WebSocket Connection Issues:**
   - Firebase hosting has limitations with WebSocket connections
   - Your app uses Supabase for matchmaking, not the Node.js server
   - The real-time features may not work properly on Firebase hosting

2. **CORS Configuration:**
   - Too permissive CORS settings caused issues
   - Missing proper origin validation

3. **Environment Configuration:**
   - Hardcoded localhost URLs in production
   - No environment-based URL switching

4. **Duplicate Event Handlers:**
   - `send_message` event was handled twice, causing conflicts

## Recommended Architecture

Since your Flutter app uses **Supabase** for matchmaking (not the Node.js server), consider this architecture:

1. **Supabase**: Handle user profiles, matches, and real-time messaging
2. **Node.js Server**: Handle AI services only (mood chat, wellness coach, AI girlfriend)
3. **Firebase Hosting**: Host the Flutter web app

## Testing Steps

1. **Test Backend Connection:**
   ```bash
   curl https://your-cloud-run-url.run.app/health
   ```

2. **Test Frontend:**
   - Open your Firebase hosted app
   - Check browser console for connection errors
   - Test matchmaking functionality

## Security Notes

- ✅ API keys are now properly secured
- ✅ CORS is configured for production
- ✅ Environment variables are separated
- ✅ No sensitive data in source code

## Next Steps

1. Update the Cloud Run URL in `app_config.dart`
2. Update Firebase hosting URLs in `server.js`
3. Deploy both backend and frontend
4. Test the matchmaking functionality

The matchmaking should now work properly with these fixes!
