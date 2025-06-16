// src/validations/schemas.js
const yup = require('yup');
const { GENDER, ACTIVITYLEVEL, USER_ACTIVITY, BMI } = require('../generated/prisma');
const { parseDate } = require('../libs/utils/date');

const dateSchema = yup.string().test('is-valid-date', 'Invalid date format. Use DD-MM-YYYY', function (value) {
    if (!value) return true;
    const date = parseDate(value);
    return date !== null;
});

const schemas = {
    // Auth schemas
    register: yup.object({
        body: yup.object({
            email: yup.string().email('Invalid email format').required('Email is required'),
            password: yup.string().min(8, 'Password must be at least 8 characters')
                .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
                .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
                .matches(/[0-9]/, 'Password must contain at least one number')
                .matches(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
                .required('Password is required'),
            name: yup.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters').required('Name is required'),
            age: yup.number().integer().min(1).max(120),
            gender: yup.string().oneOf(Object.values(GENDER))
        })
    }),

    login: yup.object({
        body: yup.object({
            email: yup.string().email('Invalid email format').required('Email is required'),
            password: yup.string().required('Password is required')
        })
    }),

    googleAuth: yup.object({
        body: yup.object({
            idToken: yup.string().required('Google ID token is required')
        })
    }),

    refreshToken: yup.object({
        body: yup.object({
            refreshToken: yup.string().required('Refresh token is required')
        })
    }),

    // User schemas
    updateProfile: yup.object({
        body: yup.object({
            name: yup.string().trim().min(2).max(50),
            age: yup.number().integer().min(1).max(120),
            gender: yup.string().oneOf(Object.values(GENDER)),
            height: yup.number().min(50).max(300),
            weight: yup.number().min(20).max(500),
            activityLevel: yup.string().oneOf(Object.values(ACTIVITYLEVEL))
        })
    }),

    // Meal schemas
    createMeal: yup.object().shape({
        mealType: yup
            .string()
            .oneOf(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'], 'Invalid meal type')
            .required('Meal type is required'),
        fatSecretFoodId: yup
            .string()
            .nullable()
            .test('fatSecretOrNutrition', 'Either fatSecretFoodId or nutritionData must be provided', function (value) {
                const { nutritionData } = this.parent;
                return value || nutritionData;
            }),
        servingId: yup
            .string()
            .nullable()
            .when('fatSecretFoodId', {
                is: (val) => val != null,
                then: (schema) => schema.required('Serving ID is required when using FatSecret food')
            }),
        foodName: yup
            .string()
            .required('Food name is required'),
        brandName: yup
            .string()
            .nullable(),
        date: dateSchema.required('Date is required'),
        quantity: yup
            .number()
            .positive('Quantity must be positive')
            .required('Quantity is required'),
        unit: yup
            .string()
            .required('Unit is required'),
        nutritionData: yup
            .object()
            .when('fatSecretFoodId', {
                is: (val) => !val,
                then: (schema) => schema.shape({
                    calories: yup.number().required('Calories are required'),
                    protein: yup.number().required('Protein is required'),
                    carbohydrates: yup.number().required('Carbohydrates are required'),
                    fat: yup.number().required('Fat is required'),
                    fiber: yup.number().required('Fiber is required')
                }).required('Nutrition data is required when not using FatSecret food')
            })
    }),

    updateMeal: yup.object({
        params: yup.object({
            mealType: yup.string().oneOf(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']).required()
        }),
        body: yup.object({
            quantity: yup.number().positive(),
            unit: yup.string(),
            servingId: yup.string()
        })
    }),

    // Activity schemas
    createActivity: yup.object({
        body: yup.object({
            activityTypeId: yup.string().uuid().required(),
            date: dateSchema.required(),
            duration: yup.number().positive().required('Duration in minutes is required'),
            intensity: yup.string().oneOf(Object.values(USER_ACTIVITY)).nullable(),
            notes: yup.string().max(500).nullable(),
            startTime: yup.date().nullable(),
            endTime: yup.date().nullable()
        })
    }),

    updateActivity: yup.object({
        params: yup.object({
            activityTypeId: yup.string().uuid().required()
        }),
        body: yup.object({
            duration: yup.number().positive(),
            intensity: yup.string().oneOf(Object.values(USER_ACTIVITY)).nullable(),
            notes: yup.string().max(500).nullable()
        })
    }),

    // BMI schemas
    calculateBMI: yup.object({
        body: yup.object({
            height: yup.number().min(50).max(300).required('Height in cm is required'),
            weight: yup.number().min(20).max(500).required('Weight in kg is required')
        })
    }),

    // Weight Goal schemas
    createWeightGoal: yup.object({
        body: yup.object({
            startWeight: yup.number().min(20).max(500).required(),
            targetWeight: yup.number().min(20).max(500).required(),
            startDate: dateSchema.required(),
            targetDate: dateSchema.min(yup.ref('startDate')).nullable()
        })
    }),

    // Nutrition Target schemas
    createNutritionTarget: yup.object({
        body: yup.object({
            calories: yup.number().min(800).max(10000).required(),
            protein: yup.number().min(0).required(),
            carbohydrates: yup.number().min(0).required(),
            fat: yup.number().min(0).required(),
            fiber: yup.number().min(0).required(),
            effectiveDate: dateSchema.required()
        })
    }),

    // Common schemas
    pagination: yup.object({
        query: yup.object({
            startDate: dateSchema.required(),
            endDate: dateSchema.min(yup.ref('startDate')).required(),
            category: yup.string().nullable(),
            search: yup.string().nullable(),
            limit: yup.number().integer().min(1).max(100).default(10),
            offset: yup.number().integer().min(0).default(0)
        })
    }),

    dateRange: yup.object({
        query: yup.object({
            startDate: dateSchema.required(),
            endDate: dateSchema.min(yup.ref('startDate')).required()
        })
    }),

    date: yup.object({
        query: yup.object({
            date: dateSchema.default(() => parseDate(new Date().toISOString().split('T')[0]))
        })
    })
};

module.exports = schemas;