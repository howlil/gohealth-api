// docs/oauth-setup.md
# OAuth Setup for Cross-Platform (Android, iOS, Web)

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google Sign-In API

## Web Client Setup

1. Go to Credentials page
2. Create OAuth client ID → Web application
3. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `https://your-domain.com/auth/google/callback`

## Android Setup

1. Create OAuth client ID → Android
2. Enter package name: `com.yourcompany.gohealth`
3. Enter SHA-1 certificate fingerprint:
   ```bash
   # Debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Release keystore
   keytool -list -v -keystore path/to/release.keystore -alias your-alias
   ```
4. Save the client ID

## iOS Setup

1. Create OAuth client ID → iOS
2. Enter Bundle ID: `com.yourcompany.gohealth`
3. Save the client ID
4. Download `GoogleService-Info.plist`

## Environment Variables

```env
# Web Client
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_SECRET=your-web-client-secret

# Android Client
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com

# iOS Client
GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
```

## Flutter Implementation

```dart
// pubspec.yaml
dependencies:
  google_sign_in: ^6.1.5
  http: ^1.1.0

// lib/services/auth_service.dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      // Send ID token to your backend
      final response = await http.post(
        Uri.parse('https://your-api.com/api/v1/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'idToken': googleAuth.idToken}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      
      return null;
    } catch (error) {
      print('Google sign in error: $error');
      return null;
    }
  }

  Future<void> signOut() async {
    await _googleSignIn.signOut();
  }
}
```

## Android Configuration

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET"/>
```

```gradle
// android/app/build.gradle
android {
    defaultConfig {
        applicationId "com.yourcompany.gohealth"
        // ... other config
    }
}
```

## iOS Configuration

1. Add `GoogleService-Info.plist` to iOS project
2. Configure `Info.plist`:

```xml
<!-- ios/Runner/Info.plist -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <!-- Replace with your REVERSED_CLIENT_ID -->
            <string>com.googleusercontent.apps.your-ios-client-id</string>
        </array>
    </dict>
</array>
```

## API Implementation

```javascript
// Backend verification
const { OAuth2Client } = require('google-auth-library');

async function verifyGoogleToken(idToken) {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: [
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID
    ],
  });
  
  const payload = ticket.getPayload();
  return payload;
}
```

## Security Considerations

1. Never expose client secrets in mobile apps
2. Always verify ID tokens on the backend
3. Use HTTPS in production
4. Implement token refresh mechanism
5. Add rate limiting for auth endpoints