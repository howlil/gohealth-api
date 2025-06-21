# GoHealth API

A comprehensive health and nutrition tracking API built with Node.js, Express, and Prisma ORM.

## Features

- User authentication and profile management
- Meal tracking with nutritional information
- Physical activity tracking
- BMI calculation and tracking
- Weight goals management
- Nutrition targets
- Push notifications via Firebase Cloud Messaging (FCM)

## Tech Stack

- Node.js
- Express.js
- Prisma ORM
- MySQL
- JWT Authentication
- Firebase Cloud Messaging

## Food Data Source

The application uses a local JSON file (`data.json`) for food nutritional data. This file should be placed in the root directory of the project.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/db_gohealth"
   JWT_SECRET="your-secret-key"
   GOOGLE_WEB_CLIENT_ID="your-google-client-id"
   GOOGLE_WEB_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_WEB_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
   FOOD_DATA_FILE_PATH="data.json"
   FIREBASE_SERVICE_ACCOUNT_PATH="./service_account.json"
   ```
4. Set up Firebase:
   - Create a Firebase project
   - Generate a service account key from Firebase Console
   - Save the service account JSON file as `service_account.json` in the project root
5. Run database migrations:
   ```
   npx prisma migrate dev
   ```
6. Start the server:
   ```
   npm start
   ```

## API Documentation

API documentation is available via Swagger at `/api-docs` when the server is running.

## Push Notifications

The API supports push notifications for:
- Daily calory goal achievements (90-110% of target)
- Meal reminders
- Weight goal progress updates

### FCM Endpoints:
- `PUT /api/users/fcm-token` - Update FCM token
- `DELETE /api/users/fcm-token` - Remove FCM token

## Recent Changes

- Added Firebase Cloud Messaging integration for push notifications
- Added FCM token storage in user model
- Implemented automatic notification when user achieves daily calory needs
- Replaced FatSecret API integration with local JSON food database
- Updated meal-related endpoints to use local food data
- Renamed `fatSecretFoodId` to `foodId` in the database schema 