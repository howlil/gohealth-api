// src/database/factories/activity.factory.js
const { faker } = require('@faker-js/faker');
const { USER_ACTIVITY } = require('../../generated/prisma');

class ActivityFactory {
  static create(userId, activityTypeId, overrides = {}) {
    const duration = faker.number.int({ min: 15, max: 120 });
    const caloriesBurned = faker.number.int({ min: 50, max: 800 });
    const intensity = faker.helpers.arrayElement(Object.values(USER_ACTIVITY));

    return {
      userId,
      activityTypeId,
      date: faker.date.recent(),
      duration,
      caloriesBurned,
      intensity,
      notes: faker.lorem.sentence(),
      startTime: faker.date.recent(),
      endTime: faker.date.recent(),
      ...overrides
    };
  }

  static createMany(count, userId, activityTypeId, overrides = {}) {
    return Array.from({ length: count }, () => 
      this.create(userId, activityTypeId, overrides)
    );
  }
}

module.exports = ActivityFactory;