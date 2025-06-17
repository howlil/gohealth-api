module.exports = {
    apps: [
        {
            name: 'gohealth-api', // Nama aplikasi
            script: 'server.js',    // Ganti dengan file utama aplikasi Express.js Anda

            env: {
                NODE_ENV: process.env.NODE_ENV || 'production',
                PORT: process.env.PORT || 3000,
                API_PREFIX: process.env.API_PREFIX || '/api/v1',
                DATABASE_URL: process.env.DATABASE_URL || 'your-default-database-url',
                JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret',
                JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
                JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
                GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID || 'your-web-client-id',
                GOOGLE_WEB_CLIENT_SECRET: process.env.GOOGLE_WEB_CLIENT_SECRET || 'your-web-client-secret',
                GOOGLE_WEB_REDIRECT_URI: process.env.GOOGLE_WEB_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
                GOOGLE_ANDROID_CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID || 'your-android-client-id',
                GOOGLE_IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID || 'your-ios-client-id',
                FOOD_DATA_FILE_PATH: process.env.FOOD_DATA_FILE_PATH || 'data.json',
                CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
                RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100,
                UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads/',
                MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 5242880,
                LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
                SERVER_IP: process.env.SERVER_IP || 'your-server-ip',
            },
            log_file: '/var/logs/combined.log',
            error_file: '/var/logs/error.log',

        },
    ],
};
