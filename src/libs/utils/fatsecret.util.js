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
      Logger.error('Error getting FatSecret access token', error);
      throw error;
    }
  }

  async makeRequest(method, params = {}) {
    const token = await this.getAccessToken();
    
    const requestParams = {
      method,
      format: 'json',
      ...params
    };

    try {
      const response = await axios.get(this.baseUrl, {
        params: requestParams,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      Logger.error('FatSecret API error', error);
      throw error;
    }
  }

  async searchFoods(query, page = 0, maxResults = 50) {
    const result = await this.makeRequest('foods.search', {
      search_expression: query,
      page_number: page,
      max_results: maxResults
    });

    return this.formatFoodsResponse(result);
  }

  async getFood(foodId) {
    const result = await this.makeRequest('food.get.v2', {
      food_id: foodId
    });

    return this.formatFoodResponse(result);
  }

  async getFoodByBarcode(barcode) {
    const result = await this.makeRequest('food.find_id_for_barcode', {
      barcode
    });

    if (result.food_id) {
      return this.getFood(result.food_id.value);
    }

    return null;
  }

  formatFoodsResponse(data) {
    if (!data.foods || !data.foods.food) {
      return [];
    }

    const foods = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];

    return foods.map(food => ({
      foodId: food.food_id,
      foodName: food.food_name,
      brandName: food.brand_name || null,
      foodType: food.food_type,
      foodUrl: food.food_url,
      description: food.food_description
    }));
  }

  formatFoodResponse(data) {
    if (!data.food) {
      return null;
    }

    const food = data.food;
    const servings = Array.isArray(food.servings.serving) 
      ? food.servings.serving 
      : [food.servings.serving];

    return {
      foodId: food.food_id,
      foodName: food.food_name,
      brandName: food.brand_name || null,
      foodType: food.food_type,
      foodUrl: food.food_url,
      servings: servings.map(serving => ({
        servingId: serving.serving_id,
        servingDescription: serving.serving_description,
        servingUrl: serving.serving_url,
        metricServingAmount: parseFloat(serving.metric_serving_amount || 0),
        metricServingUnit: serving.metric_serving_unit,
        numberOfUnits: parseFloat(serving.number_of_units || 1),
        measurementDescription: serving.measurement_description,
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
  }

  calculateNutrition(serving, amount, unit) {
    const ratio = amount / serving.metricServingAmount;
    const nutrition = {};
    
    Object.keys(serving.nutrition).forEach(key => {
      nutrition[key] = serving.nutrition[key] * ratio;
    });
    
    return nutrition;
  }
}

module.exports = FatSecretUtil;