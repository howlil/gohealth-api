const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMealTypes() {
    try {
        const mealTypes = [
            {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Breakfast',
                orderIndex: 1
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440002',
                name: 'Lunch',
                orderIndex: 2
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440003',
                name: 'Dinner',
                orderIndex: 3
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440004',
                name: 'Snack',
                orderIndex: 4
            }
        ];

        for (const mealType of mealTypes) {
            await prisma.mealType.upsert({
                where: { id: mealType.id },
                update: mealType,
                create: mealType
            });
        }

        console.log('Meal types seeded successfully');
    } catch (error) {
        console.error('Error seeding meal types:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedMealTypes(); 