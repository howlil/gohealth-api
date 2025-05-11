// src/database/factories/user.factory.js
const { faker } = require('@faker-js/faker');
const { GENDER, ACTIVITYLEVEL } = require('../../generated/prisma');

class UserFactory {
  static create(overrides = {}) {
    const gender = faker.helpers.arrayElement(Object.values(GENDER));
    const activityLevel = faker.helpers.arrayElement(Object.values(ACTIVITYLEVEL));

    return {
      googleId: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      age: faker.number.int({ min: 18, max: 80 }),
      gender,
      height: faker.number.float({ min: 150, max: 200, precision: 0.1 }),
      weight: faker.number.float({ min: 45, max: 120, precision: 0.1 }),
      activityLevel,
      profileImage: faker.image.avatar(),
      ...overrides
    };
  }

  static createMany(count, overrides = {}) {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

module.exports = UserFactory;