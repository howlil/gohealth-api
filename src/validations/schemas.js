// src/validations/schemas.js
const BaseJoi = require('joi');
const { parseDate } = require('../libs/utils/date');

const Joi = BaseJoi.extend((joi) => ({
    base: joi.date(),
    type: 'date',
    messages: {
        'date.format': 'Invalid date format. Please use DD-MM-YYYY'
    },
    coerce(value, helpers) {
        if (typeof value === 'string') {
            const parsed = parseDate(value);
            if (parsed) {
                return { value: parsed };
            }
            return { errors: helpers.error('date.format') };
        }
        return { value };
    }
}));

const schemas = {
    // Auth schemas
    register: Joi.object({
        body: Joi.object({
            email: Joi.string().email().required().messages({
                'string.email': 'Invalid email format',
                'any.required': 'Email is required'
            }),
            password: Joi.string()
                .min(8)
                .pattern(/[A-Z]/)
                .pattern(/[a-z]/)
                .pattern(/[0-9]/)
                .pattern(/[^a-zA-Z0-9]/)
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters',
                    'string.pattern.base': 'Password must contain at least one uppercase letter, lowercase letter, number, and special character',
                    'any.required': 'Password is required'
                }),
            name: Joi.string().trim().min(2).max(50).required().messages({
                'string.min': 'Name must be at least 2 characters',
                'string.max': 'Name cannot exceed 50 characters',
                'any.required': 'Name is required'
            }),
            age: Joi.number().integer().min(1).max(120),
            gender: Joi.string().valid('MALE', 'FEMALE')
        })
    }),

    login: Joi.object({
        body: Joi.object({
            email: Joi.string().email().required().messages({
                'string.email': 'Invalid email format',
                'any.required': 'Email is required'
            }),
            password: Joi.string().required().messages({
                'any.required': 'Password is required'
            })
        })
    }),

    googleAuth: Joi.object({
        body: Joi.object({
            idToken: Joi.string().required().messages({
                'any.required': 'Google ID token is required'
            })
        })
    }),

    refreshToken: Joi.object({
        body: Joi.object({
            refreshToken: Joi.string().required().messages({
                'any.required': 'Refresh token is required'
            })
        })
    }),

    // User schemas
    updateProfile: Joi.object({
        body: Joi.object({
            name: Joi.string().trim().min(2).max(50),
            age: Joi.number().integer().min(1).max(120),
            gender: Joi.string().valid('MALE', 'FEMALE'),
            height: Joi.number().min(50).max(300),
            weight: Joi.number().min(20).max(500),
            activityLevel: Joi.string().valid('SEDENTARY', 'LIGHTLY', 'ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE')
        })
    }),

    // Meal schemas
    createMeal: Joi.object({
        body: Joi.object({
            foodId: Joi.string().required(),
            mealType: Joi.string().valid('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK').required(),
            date: Joi.date().required(),
            quantity: Joi.number().min(0.1).default(1),
            unit: Joi.string().default('porsi')
        })
    }),

    updateMeal: Joi.object({
        quantity: Joi.number().min(0.1),
        unit: Joi.string(),
        mealType: Joi.string().valid('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')
    }),

    // Activity schemas
    createActivity: Joi.object({
        body: Joi.object({
            activityTypeId: Joi.string().uuid().required(),
            date: Joi.date().required(),
            duration: Joi.number().positive().required().messages({
                'any.required': 'Duration in minutes is required'
            }),
            intensity: Joi.string().valid('LOW', 'MODERATE', 'HIGH').allow(null),
            notes: Joi.string().max(500).allow(null),
            startTime: Joi.date().allow(null),
            endTime: Joi.date().allow(null)
        })
    }),

    updateActivity: Joi.object({
        params: Joi.object({
            activityTypeId: Joi.string().uuid().required()
        }),
        body: Joi.object({
            duration: Joi.number().positive(),
            intensity: Joi.string().valid('LOW', 'MODERATE', 'HIGH').allow(null),
            notes: Joi.string().max(500).allow(null)
        })
    }),

    // BMI schemas
    calculateBMI: Joi.object({
        body: Joi.object({
            height: Joi.number().min(50).max(300).required().messages({
                'any.required': 'Height in cm is required'
            }),
            weight: Joi.number().min(20).max(500).required().messages({
                'any.required': 'Weight in kg is required'
            })
        })
    }),

    updateBMI: Joi.object({
        params: Joi.object({
            bmiId: Joi.string().uuid().required().messages({
                'any.required': 'BMI ID is required'
            })
        }),
        body: Joi.object({
            height: Joi.number().min(50).max(300).required().messages({
                'any.required': 'Height in cm is required'
            }),
            weight: Joi.number().min(20).max(500).required().messages({
                'any.required': 'Weight in kg is required'
            })
        })
    }),

    // Weight Goal schemas
    createWeightGoal: Joi.object({
        body: Joi.object({
            startWeight: Joi.number().min(20).max(500).required(),
            targetWeight: Joi.number().min(20).max(500).required(),
            startDate: Joi.date().required(),
            targetDate: Joi.date().greater(Joi.ref('startDate')).allow(null)
        })
    }),

    updateWeightGoal: Joi.object({
        params: Joi.object({
            goalId: Joi.string().uuid().required().messages({
                'any.required': 'Goal ID is required'
            })
        }),
        body: Joi.object({
            targetWeight: Joi.number().min(20).max(500),
            targetDate: Joi.date()
        })
    }),

    // Nutrition Target schemas
    createNutritionTarget: Joi.object({
        body: Joi.object({
            calories: Joi.number().min(800).max(10000).required(),
            protein: Joi.number().min(0).required(),
            carbohydrates: Joi.number().min(0).required(),
            fat: Joi.number().min(0).required(),
            fiber: Joi.number().min(0).required(),
            effectiveDate: Joi.date().required()
        })
    }),

    // Common schemas
    pagination: Joi.object({
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            search: Joi.string().max(100),
            category: Joi.string().max(50),
            date: Joi.date(),
            mealType: Joi.string().valid('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')
        })
    }),

    dateRange: Joi.object({
        query: Joi.object({
            startDate: Joi.date().required(),
            endDate: Joi.date().greater(Joi.ref('startDate')).required()
        })
    }),

    date: Joi.object({
        query: Joi.object({
            date: Joi.date().default(() => new Date())
        })
    }),

    // New schemas
    userRegistration: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    }),

    userLogin: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    userProfileUpdate: Joi.object({
        name: Joi.string().min(2).max(100),
        age: Joi.number().integer().min(1).max(150),
        gender: Joi.string().valid('MALE', 'FEMALE'),
        height: Joi.number().min(50).max(300),
        weight: Joi.number().min(20).max(500),
        activityLevel: Joi.string().valid('SEDENTARY', 'LIGHTLY', 'ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE')
    }),

    createBMIRecord: Joi.object({
        height: Joi.number().min(50).max(300).required(),
        weight: Joi.number().min(20).max(500).required(),
        nutritionSummary: Joi.object({
            totalCalories: Joi.number().min(0),
            totalProtein: Joi.number().min(0),
            totalFat: Joi.number().min(0),
            totalCarbs: Joi.number().min(0),
            mealsCount: Joi.number().integer().min(0)
        })
    }),

    updateBMIRecord: Joi.object({
        height: Joi.number().min(50).max(300),
        weight: Joi.number().min(20).max(500),
        nutritionSummary: Joi.object({
            totalCalories: Joi.number().min(0),
            totalProtein: Joi.number().min(0),
            totalFat: Joi.number().min(0),
            totalCarbs: Joi.number().min(0),
            mealsCount: Joi.number().integer().min(0)
        })
    }),

    createActivityType: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        category: Joi.string().valid('CARDIO', 'STRENGTH', 'FLEXIBILITY', 'SPORTS', 'DAILY').required(),
        metValue: Joi.number().min(0.5).max(20).required(),
        description: Joi.string().max(500)
    }),

    createUserActivity: Joi.object({
        body: Joi.object({
            activityTypeId: Joi.string().required(),
            date: Joi.date().required(),
            duration: Joi.number().min(1).max(1440).required(),
            intensity: Joi.string().valid('LOW', 'MODERATE', 'HIGH'),
            notes: Joi.string().max(500),
            startTime: Joi.date(),
            endTime: Joi.date()
        })
    }),

    createActivityPlan: Joi.object({
        body: Joi.object({
            name: Joi.string().min(2).max(100).required(),
            description: Joi.string().max(500),
            startDate: Joi.date().required(),
            endDate: Joi.date().greater(Joi.ref('startDate'))
        })
    }),

    createPlannedActivity: Joi.object({
        activityPlanId: Joi.string().required(),
        activityTypeId: Joi.string().required(),
        dayOfWeek: Joi.number().integer().min(0).max(6).required(),
        scheduledTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        plannedDuration: Joi.number().min(1).max(1440).required(),
        notes: Joi.string().max(500)
    }),

    uuid: Joi.object({
        id: Joi.string().uuid().required()
    })
};

module.exports = schemas;