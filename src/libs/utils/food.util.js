const fs = require('fs');
const path = require('path');
const Logger = require('../logger/Logger');
const AppConfig = require('../../config/app.config');

class FoodDataUtil {
    constructor(jsonFilePath) {
        this.jsonFilePath = jsonFilePath || path.join(process.cwd(), AppConfig.foodData.filePath);
        this.foods = [];
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            Logger.info(`Loading food data from ${this.jsonFilePath}`);

            // Check if file exists
            if (!fs.existsSync(this.jsonFilePath)) {
                Logger.warn(`Food data file not found at path: ${this.jsonFilePath}, using default data`);
                Logger.info(`Current working directory: ${process.cwd()}`);
                Logger.info(`Using ${AppConfig.foodData.defaultData.length} default food items`);

                this.foods = AppConfig.foodData.defaultData;
                this.initialized = true;
                return;
            }

            // Read and parse JSON file
            const data = fs.readFileSync(this.jsonFilePath, 'utf8');
            if (!data || data.trim() === '') {
                Logger.warn(`Food data file is empty, using default data`);
                this.foods = AppConfig.foodData.defaultData;
                this.initialized = true;
                return;
            }

            const jsonData = JSON.parse(data);

            if (Array.isArray(jsonData)) {
                this.foods = jsonData;
                Logger.info(`Loaded ${this.foods.length} food items from ${this.jsonFilePath}`);
            } else if (jsonData.foods && Array.isArray(jsonData.foods)) {
                this.foods = jsonData.foods;
                Logger.info(`Loaded ${this.foods.length} food items from ${this.jsonFilePath} (foods property)`);
            } else {
                Logger.warn(`Invalid food data format in ${this.jsonFilePath}, using default data`);
                this.foods = AppConfig.foodData.defaultData;
            }

            this.initialized = true;
        } catch (error) {
            Logger.error('Error loading food data, using default data', {
                error: error.message,
                stack: error.stack,
                path: this.jsonFilePath
            });
            // Initialize with default data
            this.foods = AppConfig.foodData.defaultData;
            this.initialized = true;
        }
    }

    async searchFoods(query, page = 0, maxResults = 50) {
        await this.initialize();

        try {
            Logger.debug(`Searching foods with query: "${query}", page: ${page}, maxResults: ${maxResults}`);

            const searchTerm = query?.toLowerCase() || '';
            const startIndex = page * maxResults;

            const filteredFoods = this.foods
                .filter(food =>
                    food.description?.toLowerCase().includes(searchTerm) ||
                    food.foodCategory?.toLowerCase().includes(searchTerm)
                )
                .slice(startIndex, startIndex + maxResults)
                .map(food => this.formatFoodBasic(food));

            Logger.debug(`Found ${filteredFoods.length} foods matching query "${query}"`);
            return filteredFoods;
        } catch (error) {
            Logger.error(`Error searching foods with query: "${query}"`, {
                error: error.message,
                stack: error.stack
            });
            return [];
        }
    }

    async getFoodDetails(foodId) {
        await this.initialize();

        try {
            Logger.debug(`Getting food details for ID: ${foodId}`);

            const food = this.foods.find(f => f.fdcId.toString() === foodId);

            if (!food) {
                Logger.warn(`Food not found with ID: ${foodId}`);
                return null;
            }

            Logger.debug(`Found food: ${food.description}`);
            return this.formatFoodDetailed(food);
        } catch (error) {
            Logger.error(`Error getting food details for ID: ${foodId}`, {
                error: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    async getAllFoods(search = '', category = '', page = 0, maxResults = 50) {
        await this.initialize();

        try {
            Logger.debug(`Getting all foods with search: "${search}", category: "${category}", page: ${page}, maxResults: ${maxResults}`);

            const searchTerm = search?.toLowerCase() || '';
            const categoryTerm = category?.toLowerCase() || '';
            const startIndex = page * maxResults;

            const filteredFoods = this.foods
                .filter(food => {
                    const matchesSearch = !searchTerm ||
                        food.description?.toLowerCase().includes(searchTerm);

                    const matchesCategory = !categoryTerm ||
                        food.foodCategory?.toLowerCase().includes(categoryTerm);

                    return matchesSearch && matchesCategory;
                })
                .slice(startIndex, startIndex + maxResults)
                .map(food => this.formatFoodBasic(food));

            Logger.debug(`Found ${filteredFoods.length} foods matching criteria`);
            return filteredFoods;
        } catch (error) {
            Logger.error('Error getting all foods', {
                error: error.message,
                stack: error.stack,
                search,
                category
            });
            return [];
        }
    }

    async autoCompleteFood(query, maxResults = 10) {
        await this.initialize();

        try {
            if (!query || query.length < 2) {
                return [];
            }

            Logger.debug(`Auto-completing food search with query: "${query}"`);

            const searchTerm = query.toLowerCase();

            const suggestions = this.foods
                .filter(food => food.description?.toLowerCase().includes(searchTerm))
                .slice(0, maxResults)
                .map(food => ({
                    foodName: food.description,
                    query: food.description
                }));

            Logger.debug(`Found ${suggestions.length} suggestions for query "${query}"`);
            return suggestions;
        } catch (error) {
            Logger.error(`Error auto-completing food search with query: "${query}"`, {
                error: error.message,
                stack: error.stack
            });
            return [];
        }
    }

    formatFoodBasic(food) {
        return {
            foodId: food.fdcId.toString(),
            foodName: food.description,
            brandName: null,
            foodType: food.foodCategory || null,
            foodUrl: null,
            description: food.description || null
        };
    }

    formatFoodDetailed(food) {
        // Extract nutrition data
        const nutrients = food.foodNutrients?.map(nutrient => ({
            id: nutrient.nutrient?.id,
            name: nutrient.nutrient?.name,
            amount: nutrient.amount,
            unitName: nutrient.nutrient?.unitName
        })) || [];

        // Find common nutrients
        const findNutrient = (name) => {
            const nutrient = nutrients.find(n => n.name?.toLowerCase().includes(name.toLowerCase()));
            return nutrient ? nutrient.amount : 0;
        };

        // Create servings
        const servings = [
            {
                servingId: "1",
                servingName: "100g",
                servingDescription: "100 grams",
                metricServingAmount: 100,
                metricServingUnit: "g",
                calories: findNutrient("energy"),
                carbohydrate: findNutrient("carbohydrate"),
                protein: findNutrient("protein"),
                fat: findNutrient("fat"),
                saturatedFat: findNutrient("saturated"),
                cholesterol: findNutrient("cholesterol"),
                sodium: findNutrient("sodium"),
                potassium: findNutrient("potassium"),
                fiber: findNutrient("fiber"),
                sugar: findNutrient("sugar")
            }
        ];

        return {
            foodId: food.fdcId.toString(),
            foodName: food.description,
            brandName: null,
            foodType: food.foodCategory || null,
            servings: servings,
            nutrients: nutrients
        };
    }

    calculateNutrition(serving, quantity, unit) {
        try {
            // Convert quantity to grams if needed
            let grams = quantity;
            if (unit !== 'g') {
                // For now, we only support grams
                // In a real app, you would convert other units to grams
                grams = quantity * 100; // Assuming 100g per serving
            }

            // Calculate ratio based on serving size
            const ratio = grams / 100; // Our serving is based on 100g

            // Calculate nutrition values based on ratio
            return {
                calories: serving.calories * ratio,
                protein: serving.protein * ratio,
                carbohydrates: serving.carbohydrate * ratio,
                fat: serving.fat * ratio,
                saturatedFat: serving.saturatedFat * ratio,
                cholesterol: serving.cholesterol * ratio,
                sodium: serving.sodium * ratio,
                potassium: serving.potassium * ratio,
                fiber: serving.fiber * ratio,
                sugar: serving.sugar * ratio
            };
        } catch (error) {
            Logger.error('Error calculating nutrition', {
                error: error.message,
                stack: error.stack,
                serving,
                quantity,
                unit
            });
            return {
                calories: 0,
                protein: 0,
                carbohydrates: 0,
                fat: 0,
                fiber: 0
            };
        }
    }
}

module.exports = FoodDataUtil; 