// src/database/seeders/activityType.seeder.js
const { ACTIVITY_TYPE } = require('../../generated/prisma');
const Logger = require('../../libs/logger/Logger');

class ActivityTypeSeeder {
  constructor() {
    this.activityTypes = [
      // Cardio
      { name: 'Berjalan Santai', category: ACTIVITY_TYPE.CARDIO, metValue: 3.5, description: 'Berjalan dengan kecepatan normal' },
      { name: 'Berjalan Cepat', category: ACTIVITY_TYPE.CARDIO, metValue: 4.3, description: 'Berjalan dengan kecepatan tinggi' },
      { name: 'Jogging', category: ACTIVITY_TYPE.CARDIO, metValue: 7.0, description: 'Lari dengan kecepatan sedang' },
      { name: 'Berlari', category: ACTIVITY_TYPE.CARDIO, metValue: 9.8, description: 'Lari dengan kecepatan tinggi' },
      { name: 'Bersepeda Santai', category: ACTIVITY_TYPE.CARDIO, metValue: 4.0, description: 'Bersepeda dengan kecepatan rendah' },
      { name: 'Bersepeda Cepat', category: ACTIVITY_TYPE.CARDIO, metValue: 8.0, description: 'Bersepeda dengan kecepatan tinggi' },
      { name: 'Berenang', category: ACTIVITY_TYPE.CARDIO, metValue: 6.0, description: 'Berenang dengan kecepatan sedang' },
      { name: 'Aerobik', category: ACTIVITY_TYPE.CARDIO, metValue: 6.5, description: 'Senam aerobik' },
      
      // Strength
      { name: 'Angkat Beban Ringan', category: ACTIVITY_TYPE.STRENGTH, metValue: 3.5, description: 'Latihan beban dengan intensitas ringan' },
      { name: 'Angkat Beban Berat', category: ACTIVITY_TYPE.STRENGTH, metValue: 6.0, description: 'Latihan beban dengan intensitas tinggi' },
      { name: 'Push Up', category: ACTIVITY_TYPE.STRENGTH, metValue: 8.0, description: 'Push up' },
      { name: 'Sit Up', category: ACTIVITY_TYPE.STRENGTH, metValue: 8.0, description: 'Sit up' },
      { name: 'Plank', category: ACTIVITY_TYPE.STRENGTH, metValue: 4.0, description: 'Plank' },
      
      // Flexibility
      { name: 'Yoga', category: ACTIVITY_TYPE.FLEXIBILITY, metValue: 2.5, description: 'Yoga ringan' },
      { name: 'Pilates', category: ACTIVITY_TYPE.FLEXIBILITY, metValue: 3.0, description: 'Pilates' },
      { name: 'Stretching', category: ACTIVITY_TYPE.FLEXIBILITY, metValue: 2.5, description: 'Peregangan' },
      
      // Sports
      { name: 'Badminton', category: ACTIVITY_TYPE.SPORTS, metValue: 5.5, description: 'Bermain badminton' },
      { name: 'Sepak Bola', category: ACTIVITY_TYPE.SPORTS, metValue: 7.0, description: 'Bermain sepak bola' },
      { name: 'Basket', category: ACTIVITY_TYPE.SPORTS, metValue: 6.5, description: 'Bermain basket' },
      { name: 'Tenis', category: ACTIVITY_TYPE.SPORTS, metValue: 7.3, description: 'Bermain tenis' },
      { name: 'Voli', category: ACTIVITY_TYPE.SPORTS, metValue: 4.0, description: 'Bermain voli' },
      
      // Daily Activities
      { name: 'Bersih-bersih Rumah', category: ACTIVITY_TYPE.DAILY, metValue: 3.5, description: 'Membersihkan rumah' },
      { name: 'Berkebun', category: ACTIVITY_TYPE.DAILY, metValue: 4.0, description: 'Aktivitas berkebun' },
      { name: 'Naik Tangga', category: ACTIVITY_TYPE.DAILY, metValue: 8.0, description: 'Naik tangga' },
      { name: 'Belanja', category: ACTIVITY_TYPE.DAILY, metValue: 2.3, description: 'Berjalan sambil belanja' },
      { name: 'Memasak', category: ACTIVITY_TYPE.DAILY, metValue: 2.5, description: 'Memasak' },
      { name: 'Mencuci Piring', category: ACTIVITY_TYPE.DAILY, metValue: 2.3, description: 'Mencuci piring' },
      { name: 'Menyapu', category: ACTIVITY_TYPE.DAILY, metValue: 3.3, description: 'Menyapu lantai' },
      { name: 'Mengepel', category: ACTIVITY_TYPE.DAILY, metValue: 3.5, description: 'Mengepel lantai' }
    ];
  }

  async run(prisma) {
    try {
      Logger.info('Seeding activity types...');

      for (const activityType of this.activityTypes) {
        await prisma.activityType.upsert({
          where: { name: activityType.name },
          update: {},
          create: activityType
        });
      }

      Logger.info(`Created ${this.activityTypes.length} activity types`);
    } catch (error) {
      Logger.error('Error seeding activity types:', error);
      throw error;
    }
  }
}

module.exports = ActivityTypeSeeder;