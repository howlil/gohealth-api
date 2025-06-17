const path = require('path');
const fs = require('fs');
const database = require('../prisma');

class FoodSeeder {
    constructor() {
        this.prisma = database.getClient();
    }

    async seed() {
        try {
            console.log('🌱 Starting food database seeding...');

            const dataPath = path.join(__dirname, '../../../data.json');
            const foodData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

            const categorySlugMap = {
                'Daging': 'daging',
                'Buah': 'buah',
                'Ikan & Seafood': 'ikan-seafood',
                'Sayuran': 'sayuran',
                'Roti & Sereal': 'roti-sereal',
                'Keju & Susu': 'keju-susu',
                'Telur': 'telur'
            };

            for (const category of foodData.data) {
                console.log(`📂 Creating category: ${category.category}`);

                const foodCategory = await this.prisma.foodCategory.upsert({
                    where: {
                        name: category.category
                    },
                    update: {},
                    create: {
                        name: category.category,
                        slug: categorySlugMap[category.category] || category.category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                        description: `Kategori makanan ${category.category}`
                    }
                });

                console.log(`🍽️  Processing ${category.product.length} foods in ${category.category}`);

                for (const product of category.product) {
                    await this.prisma.food.upsert({
                        where: {
                            id: product.id
                        },
                        update: {
                            name: product.meal,
                            protein: product.nutrients.protein,
                            fat: product.nutrients.fat,
                            carbohydrate: product.nutrients.carbohydrate,
                            calory: product.nutrients.calory
                        },
                        create: {
                            id: product.id,
                            name: product.meal,
                            categoryId: foodCategory.id,
                            protein: product.nutrients.protein,
                            fat: product.nutrients.fat,
                            carbohydrate: product.nutrients.carbohydrate,
                            calory: product.nutrients.calory,
                            isActive: true
                        }
                    });
                }
            }

            const totalCategories = await this.prisma.foodCategory.count();
            const totalFoods = await this.prisma.food.count();

            console.log('✅ Food seeding completed successfully!');
            console.log(`📊 Summary:`);
            console.log(`   - Categories: ${totalCategories}`);
            console.log(`   - Foods: ${totalFoods}`);

        } catch (error) {
            console.error('❌ Error seeding food data:', error);
            throw error;
        }
    }

    async clear() {
        try {
            console.log('🧹 Clearing existing food data...');

            await this.prisma.food.deleteMany({});
            await this.prisma.foodCategory.deleteMany({});

            console.log('✅ Food data cleared successfully!');
        } catch (error) {
            console.error('❌ Error clearing food data:', error);
            throw error;
        }
    }
}

module.exports = FoodSeeder; 