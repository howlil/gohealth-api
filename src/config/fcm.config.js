const admin = require('firebase-admin');
const Logger = require('../libs/logger/Logger');
const path = require('path');

class FCMConfig {
    constructor() {
        this.initialized = false;
    }

    initialize() {
        try {
            if (this.initialized) return;

            // Path ke service_account.json di root directory proyek
            const serviceAccountPath = path.join(process.cwd(), 'service_account.json');

            const serviceAccount = require(serviceAccountPath);

            if (!serviceAccount) {
                Logger.warn('Firebase service account not found. Push notifications disabled.');
                return;
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });

            this.initialized = true;
            Logger.info('Firebase Admin SDK initialized successfully');
            Logger.info(`Service account loaded from: ${serviceAccountPath}`);
        } catch (error) {
            Logger.error('Failed to initialize Firebase Admin SDK:', error);
            Logger.error(`Attempted to load service account from: ${path.join(process.cwd(), 'service_account.json')}`);
        }
    }

    getMessaging() {
        if (!this.initialized) {
            Logger.warn('Firebase Admin SDK not initialized. Cannot send push notifications.');
            return null;
        }
        return admin.messaging();
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = new FCMConfig(); 