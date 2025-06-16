// src/config/swagger.config.js
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'GoHealth API Documentation',
            version: '1.0.0',
            description: 'API documentation for GoHealth application',
            contact: {
                name: 'GoHealth Team'
            }
        },
        servers: [
            {
                url: '/api',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440000'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
                        },
                        name: {
                            type: 'string',
                            example: 'John Doe'
                        },
                        age: {
                            type: 'integer',
                            example: 30
                        },
                        gender: {
                            type: 'string',
                            enum: ['MALE', 'FEMALE'],
                            example: 'MALE'
                        },
                        height: {
                            type: 'number',
                            format: 'float',
                            example: 175.5
                        },
                        weight: {
                            type: 'number',
                            format: 'float',
                            example: 70.2
                        },
                        activityLevel: {
                            type: 'string',
                            enum: ['SEDENTARY', 'LIGHTLY', 'ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'],
                            example: 'ACTIVE'
                        },
                        profileImage: {
                            type: 'string',
                            nullable: true,
                            example: 'https://example.com/profile.jpg'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date',
                            example: '01-01-2023'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date',
                            example: '01-01-2023'
                        }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'Authentication successful'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    $ref: '#/components/schemas/User'
                                },
                                accessToken: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                },
                                refreshToken: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                },
                                tokenType: {
                                    type: 'string',
                                    example: 'Bearer'
                                },
                                expiresIn: {
                                    type: 'string',
                                    example: '1h'
                                }
                            }
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Error message'
                        },
                        error: {
                            type: 'object',
                            properties: {
                                status: {
                                    type: 'integer',
                                    example: 400
                                },
                                name: {
                                    type: 'string',
                                    example: 'BadRequestError'
                                }
                            }
                        }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['email', 'password', 'name'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 8,
                            example: 'Password123!'
                        },
                        name: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 50,
                            example: 'John Doe'
                        },
                        age: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 120,
                            example: 30
                        },
                        gender: {
                            type: 'string',
                            enum: ['MALE', 'FEMALE'],
                            example: 'MALE'
                        }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'Password123!'
                        }
                    }
                },
                GoogleAuthRequest: {
                    type: 'object',
                    required: ['idToken'],
                    properties: {
                        idToken: {
                            type: 'string',
                            example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...'
                        }
                    }
                },
                RefreshTokenRequest: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        }
                    }
                },
                BMIRecord: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440000'
                        },
                        height: {
                            type: 'number',
                            format: 'float',
                            example: 175.5
                        },
                        weight: {
                            type: 'number',
                            format: 'float',
                            example: 70.2
                        },
                        bmi: {
                            type: 'number',
                            format: 'float',
                            example: 22.8
                        },
                        status: {
                            type: 'string',
                            enum: ['UNDERWEIGHT', 'NORMAL', 'OVERWEIGHT', 'OBESE'],
                            example: 'NORMAL'
                        },
                        recordedAt: {
                            type: 'string',
                            format: 'date',
                            example: '01-01-2023'
                        }
                    }
                },
                CalculateBMIRequest: {
                    type: 'object',
                    required: ['height', 'weight'],
                    properties: {
                        height: {
                            type: 'number',
                            minimum: 50,
                            maximum: 300,
                            example: 175.5
                        },
                        weight: {
                            type: 'number',
                            minimum: 20,
                            maximum: 500,
                            example: 70.2
                        }
                    }
                },
                WeightGoal: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440000'
                        },
                        startWeight: {
                            type: 'number',
                            format: 'float',
                            example: 75.0
                        },
                        targetWeight: {
                            type: 'number',
                            format: 'float',
                            example: 70.0
                        },
                        startDate: {
                            type: 'string',
                            format: 'date',
                            example: '01-01-2023'
                        },
                        targetDate: {
                            type: 'string',
                            format: 'date',
                            example: '31-12-2023'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        }
                    }
                },
                NutritionTarget: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440000'
                        },
                        calories: {
                            type: 'number',
                            format: 'float',
                            example: 2000
                        },
                        protein: {
                            type: 'number',
                            format: 'float',
                            example: 150
                        },
                        carbohydrates: {
                            type: 'number',
                            format: 'float',
                            example: 200
                        },
                        fat: {
                            type: 'number',
                            format: 'float',
                            example: 65
                        },
                        fiber: {
                            type: 'number',
                            format: 'float',
                            example: 25
                        },
                        effectiveDate: {
                            type: 'string',
                            format: 'date',
                            example: '01-01-2023'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        }
                    }
                },
                Meal: {
                    type: 'object',
                    properties: {
                        userId: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440000'
                        },
                        mealTypeId: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440001'
                        },
                        fatSecretFoodId: {
                            type: 'string',
                            example: '33691'
                        },
                        foodName: {
                            type: 'string',
                            example: 'Chicken Breast'
                        },
                        brandName: {
                            type: 'string',
                            nullable: true,
                            example: 'Tyson'
                        },
                        date: {
                            type: 'string',
                            format: 'date',
                            example: '01-01-2023'
                        },
                        quantity: {
                            type: 'number',
                            format: 'float',
                            example: 100
                        },
                        unit: {
                            type: 'string',
                            example: 'g'
                        },
                        nutritionData: {
                            type: 'object',
                            example: {
                                calories: 165,
                                protein: 31,
                                carbohydrates: 0,
                                fat: 3.6,
                                fiber: 0
                            }
                        }
                    }
                },
                Activity: {
                    type: 'object',
                    properties: {
                        userId: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440000'
                        },
                        activityTypeId: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440001'
                        },
                        date: {
                            type: 'string',
                            format: 'date',
                            example: '01-01-2023'
                        },
                        duration: {
                            type: 'number',
                            format: 'float',
                            example: 30
                        },
                        caloriesBurned: {
                            type: 'number',
                            format: 'float',
                            example: 150
                        },
                        intensity: {
                            type: 'string',
                            enum: ['LOW', 'MODERATE', 'HIGH'],
                            example: 'MODERATE'
                        },
                        notes: {
                            type: 'string',
                            nullable: true,
                            example: 'Morning run'
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [
        path.resolve(__dirname, '../routes/*.js'),
        path.resolve(__dirname, '../controllers/*.js')
    ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 