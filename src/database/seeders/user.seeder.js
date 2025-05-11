// src/database/seeders/user.seeder.js
const UserFactory = require('../factories/user.factory');
const Logger = require('../../libs/logger/Logger');

class UserSeeder {
  constructor() {
    this.numberOfUsers = 10;
  }

  async run(prisma) {
    try {
      Logger.info('Seeding users...');

      // Create test users
      const users = UserFactory.createMany(this.numberOfUsers);

      for (const userData of users) {
        const user = await prisma.user.create({
          data: userData
        });

        // Create BMI record for each user
        if (user.height && user.weight) {
          const bmi = user.weight / Math.pow(user.height / 100, 2);
          let status = 'NORMAL';
          
          if (bmi < 18.5) status = 'UNDERWEIGHT';
          else if (bmi >= 25 && bmi < 30) status = 'OVERWEIGHT';
          else if (bmi >= 30) status = 'OBESE';

          await prisma.bMIRecord.create({
            data: {
              userId: user.id,
              height: user.height,
              weight: user.weight,
              bmi: parseFloat(bmi.toFixed(1)),
              status
            }
          });
        }

        // Create a weight goal for some users
        if (Math.random() > 0.5) {
          const targetWeight = user.weight * (0.9 + Math.random() * 0.2); // -10% to +10%
          
          await prisma.weightGoal.create({
            data: {
              userId: user.id,
              startWeight: user.weight,
              targetWeight: parseFloat(targetWeight.toFixed(1)),
              startDate: new Date(),
              targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
              isActive: true
            }
          });
        }

        // Create daily nutrition target
        let tdeeMultiplier = 1.2; // Default sedentary
        if (user.activityLevel === 'LIGHTLY') tdeeMultiplier = 1.375;
        else if (user.activityLevel === 'MODERATELY_ACTIVE') tdeeMultiplier = 1.55;
        else if (user.activityLevel === 'VERY_ACTIVE') tdeeMultiplier = 1.725;
        else if (user.activityLevel === 'EXTRA_ACTIVE') tdeeMultiplier = 1.9;

        let bmr = user.gender === 'MALE' 
          ? (10 * user.weight) + (6.25 * user.height) - (5 * user.age) + 5
          : (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161;

        const tdee = bmr * tdeeMultiplier;
        
        await prisma.dailyNutritionTarget.create({
          data: {
            userId: user.id,
            calories: Math.round(tdee),
            protein: Math.round(tdee * 0.3 / 4), // 30% of calories, 4 cal/g
            carbohydrates: Math.round(tdee * 0.4 / 4), // 40% of calories, 4 cal/g
            fat: Math.round(tdee * 0.3 / 9), // 30% of calories, 9 cal/g
            fiber: 30, // Default 30g
            effectiveDate: new Date(),
            isActive: true
          }
        });
      }

      Logger.info(`Created ${this.numberOfUsers} users with related data`);
    } catch (error) {
      Logger.error('Error seeding users:', error);
      throw error;
    }
  }
}

module.exports = UserSeeder;