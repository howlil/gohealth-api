// src/database/seeders/index.js
const Database = require('../prisma');
const MealTypeSeeder = require('./mealType.seeder');
const ActivityTypeSeeder = require('./activityType.seeder');
const UserSeeder = require('./user.seeder');
const FoodSeeder = require('./food.seeder');
const Logger = require('../../libs/logger/Logger');

class DatabaseSeeder {
  constructor() {
    this.prisma = Database.getClient();
    this.seeders = [
      new MealTypeSeeder(),
      new ActivityTypeSeeder(),
      new UserSeeder(),
      new FoodSeeder()
    ];
  }

  async seed() {
    try {
      Logger.info('Starting database seeding...');

      for (const seeder of this.seeders) {
        await seeder.run(this.prisma);
      }

      Logger.info('Database seeding completed successfully');
    } catch (error) {
      Logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  async clean() {
    try {
      Logger.info('Cleaning database...');

      // Delete in reverse order to respect foreign key constraints
      await this.prisma.userActivity.deleteMany();
      await this.prisma.userMeal.deleteMany();
      await this.prisma.dailyNutritionTarget.deleteMany();
      await this.prisma.weightGoal.deleteMany();
      await this.prisma.bMIRecord.deleteMany();
      await this.prisma.favoriteFood.deleteMany();
      await this.prisma.user.deleteMany();
      await this.prisma.activityType.deleteMany();
      await this.prisma.mealType.deleteMany();

      Logger.info('Database cleaned successfully');
    } catch (error) {
      Logger.error('Database cleaning failed:', error);
      throw error;
    }
  }
}

// Run seeder if called directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();

  const command = process.argv[2];

  switch (command) {
    case 'seed':
      seeder.seed()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'clean':
      seeder.clean()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'reset':
      seeder.clean()
        .then(() => seeder.seed())
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    default:
      console.log('Usage: node seeder.js [seed|clean|reset]');
      process.exit(1);
  }
}

module.exports = DatabaseSeeder;