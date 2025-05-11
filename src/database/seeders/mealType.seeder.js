// src/database/seeders/mealType.seeder.js
const Logger = require('../../libs/logger/Logger');

class MealTypeSeeder {
  constructor() {
    this.mealTypes = [
      { name: 'Sarapan', orderIndex: 1 },
      { name: 'Makan Siang', orderIndex: 2 },
      { name: 'Makan Malam', orderIndex: 3 },
      { name: 'Camilan', orderIndex: 4 }
    ];
  }

  async run(prisma) {
    try {
      Logger.info('Seeding meal types...');

      for (const mealType of this.mealTypes) {
        await prisma.mealType.upsert({
          where: { name: mealType.name },
          update: {},
          create: mealType
        });
      }

      Logger.info(`Created ${this.mealTypes.length} meal types`);
    } catch (error) {
      Logger.error('Error seeding meal types:', error);
      throw error;
    }
  }
}

module.exports = MealTypeSeeder;