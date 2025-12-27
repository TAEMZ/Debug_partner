# Capacitor Native App Setup

This project is configured with Capacitor for native mobile app deployment.

## Initial Setup

After exporting to GitHub and cloning locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize Capacitor:**
   ```bash
   npx cap init
   ```
   
   When prompted, use these values:
   - App ID: ``
   - App Name: `debug-partner`

3. **Build the web app:**
   ```bash
   npm run build
   ```

4. **Add platforms:**
   
   For iOS (requires macOS with Xcode):
   ```bash
   npx cap add ios
   npx cap update ios
   ```
   
   For Android (requires Android Studio):
   ```bash
   npx cap add android
   npx cap update android
   ```

5. **Sync changes:**
   ```bash
   npx cap sync
   ```

## Running on Devices/Emulators

**iOS:**
```bash
npx cap run ios
```

**Android:**
```bash
npx cap run android
```

## Development Workflow
sandbox. When testing:

1
2. Export to GitHub
3. Git pull changes locally
4. Run `npx cap sync` to update native projects
5. Restart the native app

## Push Notifications Setup

The app includes push notification support. To enable:

1. **iOS:** Configure push notifications in Xcode and Apple Developer Portal
2. **Android:** Set up Firebase Cloud Messaging (FCM) in Google Console

## Configuration

The `capacitor.config.ts` file is pre-configured with:

- Push notification presentation options
- Proper app ID and name

## Production Build

When ready for production:

1. Remove or comment out the `server.url` in `capacitor.config.ts`
2. Build the app: `npm run build`
3. Sync: `npx cap sync`
4. Open in native IDE and build for release

For more info, visit: https://capacitorjs.com/docs
