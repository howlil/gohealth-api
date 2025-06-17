# GoHealth API

A comprehensive health and nutrition tracking API built with Node.js, Express, and Prisma ORM.

## Features

- User authentication and profile management
- Meal tracking with nutritional information
- Physical activity tracking
- BMI calculation and tracking
- Weight goals management
- Nutrition targets

## Tech Stack

- Node.js
- Express.js
- Prisma ORM
- MySQL
- JWT Authentication

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
   ```
4. Run database migrations:
   ```
   npx prisma migrate dev
   ```
5. Start the server:
   ```
   npm start
   ```

## API Documentation

API documentation is available via Swagger at `/api-docs` when the server is running.

## Recent Changes

- Replaced FatSecret API integration with local JSON food database
- Updated meal-related endpoints to use local food data
- Renamed `fatSecretFoodId` to `foodId` in the database schema 