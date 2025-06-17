// src/libs/utils/fatsecret.util.js
const axios = require('axios');
const Logger = require('../logger/Logger');

class FatSecretUtil {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = 'https://platform.fatsecret.com/rest/server.api';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      const tokenUrl = 'https://oauth.fatsecret.com/connect/token';
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(tokenUrl, 
        'grant_type=client_credentials&scope=basic',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
      
      return this.accessToken;
    } catch (error) {
      Logger.error('Error getting FatSecret access token', {
        error: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      });
      throw error;
    }
  }

  async makeRequest(method, params = {}) {
    try {
      const token = await this.getAccessToken();
      
      const requestParams = {
        method,
        format: 'json',
        ...params
      };

      Logger.debug(`FatSecret API Request: ${method}`, requestParams);

      const response = await axios.get(this.baseUrl, {
        params: requestParams,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      Logger.debug(`FatSecret API Response for ${method}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      return response.data;
    } catch (error) {
      Logger.error('FatSecret API error', {
        method,
        params,
        error: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      });
      throw error;
    }
  }

  async searchFoods(query, page = 0, maxResults = 50) {
    try {
      // Pastikan query tidak kosong, gunakan 'a' sebagai default jika kosong
      const searchTerm = query || 'a';
      
      Logger.debug(`Searching foods with query: "${searchTerm}", page: ${page}, maxResults: ${maxResults}`);
      
      const result = await this.makeRequest('foods.search', {
        search_expression: searchTerm,
        page_number: page,
        max_results: maxResults
      });

      return this.formatFoodsResponse(result);
    } catch (error) {
      Logger.error(`Error searching foods with query: "${query}"`, error);
      return [];
    }
  }

  async getFood(foodId) {
    try {
      Logger.debug(`Getting food details for ID: ${foodId}`);
      
      const result = await this.makeRequest('food.get.v2', {
        food_id: foodId
      });

      return this.formatFoodResponse(result);
    } catch (error) {
      Logger.error(`Error getting food details for ID: ${foodId}`, error);
      return null;
    }
  }

  async getFoodByBarcode(barcode) {
    try {
      Logger.debug(`Getting food by barcode: ${barcode}`);
      
      const result = await this.makeRequest('food.find_id_for_barcode', {
        barcode
      });

      if (result.food_id) {
        return this.getFood(result.food_id.value);
      }

      return null;
    } catch (error) {
      Logger.error(`Error getting food by barcode: ${barcode}`, error);
      return null;
    }
  }

  // Fungsi baru untuk mendapatkan semua makanan dengan filter
  async getAllFoods(search = '', category = '', page = 0, maxResults = 50) {
    try {
      // Pastikan search tidak kosong, gunakan 'a' sebagai default jika kosong
      const searchTerm = search || 'a';
      
      const params = {
        page_number: page,
        max_results: maxResults,
        search_expression: searchTerm
      };
      
      if (category) {
        params.category_type = category;
      }
      
      Logger.debug('Making FatSecret foods.search request with params:', params);
      
      const result = await this.makeRequest('foods.search', params);
      
      Logger.debug('FatSecret foods.search raw result:', result);
      
      return this.formatFoodsResponse(result);
    } catch (error) {
      Logger.error('Error getting all foods', {
        search,
        category,
        error: error.message
      });
      return []; // Return empty array instead of throwing
    }
  }
  
  // Fungsi baru untuk auto-complete pencarian makanan
  async autoCompleteFood(query, maxResults = 10) {
    try {
      if (!query || query.length < 2) {
        return [];
      }
      
      Logger.debug(`Making FatSecret foods.autocomplete request with query: "${query}"`);
      
      const result = await this.makeRequest('foods.autocomplete', {
        expression: query,
        max_results: maxResults
      });
      
      Logger.debug('FatSecret foods.autocomplete raw result:', result);
      
      if (!result.suggestions || !result.suggestions.suggestion) {
        Logger.info('FatSecret returned no suggestions');
        return [];
      }
      
      const suggestions = Array.isArray(result.suggestions.suggestion)
        ? result.suggestions.suggestion
        : [result.suggestions.suggestion];
      
      return suggestions.map(suggestion => ({
        foodName: suggestion,
        query: suggestion
      }));
    } catch (error) {
      Logger.error(`Error auto completing food search with query: "${query}"`, {
        error: error.message
      });
      return []; // Return empty array instead of throwing
    }
  }

  formatFoodsResponse(data) {
    try {
      if (!data.foods) {
        Logger.warn('No foods property in FatSecret response');
        return [];
      }
      
      // FatSecret mengembalikan null jika tidak ada hasil
      if (data.foods.total_results === "0" || !data.foods.food) {
        Logger.info('FatSecret returned zero results');
        return [];
      }

      const foods = Array.isArray(data.foods.food) ? 
        data.foods.food : [data.foods.food];

      return foods.map(food => ({
        foodId: food.food_id,
        foodName: food.food_name,
        brandName: food.brand_name || null,
        foodType: food.food_type || null,
        foodUrl: food.food_url || null,
        description: food.food_description || null
      }));
    } catch (error) {
      Logger.error('Error formatting foods response', error);
      return [];
    }
  }

  formatFoodResponse(data) {
    try {
      if (!data.food) {
        Logger.warn('No food property in FatSecret response');
        return null;
      }

      const food = data.food;
      
      if (!food.servings || !food.servings.serving) {
        Logger.warn(`No servings found for food ID: ${food.food_id}`);
        return {
          foodId: food.food_id,
          foodName: food.food_name,
          brandName: food.brand_name || null,
          foodType: food.food_type || null,
          foodUrl: food.food_url || null,
          servings: []
        };
      }
      
      const servings = Array.isArray(food.servings.serving) 
        ? food.servings.serving 
        : [food.servings.serving];

      return {
        foodId: food.food_id,
        foodName: food.food_name,
        brandName: food.brand_name || null,
        foodType: food.food_type || null,
        foodUrl: food.food_url || null,
        servings: servings.map(serving => ({
          servingId: serving.serving_id,
          servingDescription: serving.serving_description || null,
          servingUrl: serving.serving_url || null,
          metricServingAmount: parseFloat(serving.metric_serving_amount || 0),
          metricServingUnit: serving.metric_serving_unit || null,
          numberOfUnits: parseFloat(serving.number_of_units || 1),
          measurementDescription: serving.measurement_description || null,
          nutrition: {
            calories: parseFloat(serving.calories || 0),
            carbohydrate: parseFloat(serving.carbohydrate || 0),
            protein: parseFloat(serving.protein || 0),
            fat: parseFloat(serving.fat || 0),
            saturatedFat: parseFloat(serving.saturated_fat || 0),
            polyunsaturatedFat: parseFloat(serving.polyunsaturated_fat || 0),
            monounsaturatedFat: parseFloat(serving.monounsaturated_fat || 0),
            cholesterol: parseFloat(serving.cholesterol || 0),
            sodium: parseFloat(serving.sodium || 0),
            potassium: parseFloat(serving.potassium || 0),
            fiber: parseFloat(serving.fiber || 0),
            sugar: parseFloat(serving.sugar || 0),
            vitaminA: parseFloat(serving.vitamin_a || 0),
            vitaminC: parseFloat(serving.vitamin_c || 0),
            calcium: parseFloat(serving.calcium || 0),
            iron: parseFloat(serving.iron || 0)
          }
        }))
      };
    } catch (error) {
      Logger.error('Error formatting food response', error);
      return null;
    }
  }

  calculateNutrition(serving, amount, unit) {
    try {
      const ratio = amount / serving.metricServingAmount;
      const nutrition = {};
      
      Object.keys(serving.nutrition).forEach(key => {
        nutrition[key] = serving.nutrition[key] * ratio;
      });
      
      return nutrition;
    } catch (error) {
      Logger.error('Error calculating nutrition', {
        serving,
        amount,
        unit,
        error: error.message
      });
      return serving.nutrition; // Return original nutrition as fallback
    }
  }
}

module.exports = FatSecretUtil;