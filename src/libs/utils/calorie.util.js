// src/libs/utils/calorie.util.js
const { GENDER, ACTIVITYLEVEL, BMI } = require('../../generated/prisma');

class CalorieUtil {
  // Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
  calculateBMR(weight, height, age, gender) {
    let bmr;
    
    if (gender === GENDER.MALE) {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
    
    return Math.round(bmr);
  }
  
  // Calculate Total Daily Energy Expenditure (TDEE)
  calculateTDEE(bmr, activityLevel) {
    const activityMultipliers = {
      [ACTIVITYLEVEL.SEDENTARY]: 1.2,
      [ACTIVITYLEVEL.LIGHTLY]: 1.375,
      [ACTIVITYLEVEL.MODERATELY_ACTIVE]: 1.55,
      [ACTIVITYLEVEL.VERY_ACTIVE]: 1.725,
      [ACTIVITYLEVEL.EXTRA_ACTIVE]: 1.9
    };
    
    const multiplier = activityMultipliers[activityLevel] || 1.2;
    return Math.round(bmr * multiplier);
  }
  
  // Calculate calories burned from activity using MET values
  calculateActivityCalories(metValue, weight, durationInMinutes) {
    const durationInHours = durationInMinutes / 60;
    const calories = metValue * weight * durationInHours;
    return Math.round(calories);
  }
  
  // Calculate BMI
  calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  
  // Get BMI status
  getBMIStatus(bmi) {
    if (bmi < 18.5) return BMI.UNDERWEIGHT;
    if (bmi < 25) return BMI.NORMAL;
    if (bmi < 30) return BMI.OVERWEIGHT;
    return BMI.OBESE;
  }
  
  // Calculate recommended daily calorie target
  calculateDailyCalorieTarget(tdee, currentWeight, targetWeight, targetDate, gender) {
    const today = new Date();
    const target = new Date(targetDate);
    const daysToTarget = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    
    if (daysToTarget <= 0) return tdee;
    
    const weightDifference = currentWeight - targetWeight;
    const totalCaloriesDeficit = weightDifference * 7700; // 1kg = 7700 calories
    const dailyCalorieDeficit = totalCaloriesDeficit / daysToTarget;
    
    let recommendedCalories = tdee - dailyCalorieDeficit;
    
    // Safety limits
    const minCalories = gender === GENDER.MALE ? 1500 : 1200;
    const maxDeficit = 1000;
    
    recommendedCalories = Math.max(recommendedCalories, minCalories);
    recommendedCalories = Math.max(recommendedCalories, tdee - maxDeficit);
    
    return Math.round(recommendedCalories);
  }
  
  // Calculate macronutrient distribution
  calculateMacros(totalCalories, proteinRatio = 0.3, carbRatio = 0.4, fatRatio = 0.3) {
    return {
      protein: Math.round((totalCalories * proteinRatio) / 4), // 4 cal per gram
      carbohydrates: Math.round((totalCalories * carbRatio) / 4), // 4 cal per gram
      fat: Math.round((totalCalories * fatRatio) / 9) // 9 cal per gram
    };
  }
}

module.exports = CalorieUtil;