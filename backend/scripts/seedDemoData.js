/**
 * Demo Data Seeder
 * Generates 30+ days of realistic financial data for testing ML features
 *
 * Usage: node scripts/seedDemoData.js <userId>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('../models/transaction.model');
const Budget = require('../models/budget.model');
const Goal = require('../models/goal.model');
const Category = require('../models/category.model');
const Account = require('../models/account.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => {
    console.error('✗ MongoDB connection error:', err);
    process.exit(1);
  });

// Demo data configuration
const DEMO_CONFIG = {
  days: 60, // Generate 60 days of data (2 full months)
  monthlyIncome: 5000,
  categories: {
    // Category: [minAmount, maxAmount, frequency per month]
    'Groceries': [30, 120, 18],  // Increased frequency
    'Dining': [15, 60, 15],      // Increased frequency
    'Transportation': [5, 50, 20], // Increased frequency
    'Entertainment': [20, 100, 8],
    'Shopping': [25, 200, 6],
    'Healthcare': [30, 150, 3],
    'Utilities': [80, 120, 1],
    'Rent': [1200, 1200, 1], // Fixed monthly
    'Subscriptions': [15, 50, 5],
    'Fitness': [40, 60, 6],
  }
};

/**
 * Get random number between min and max
 */
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random element from array
 */
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a date in the past
 */
function getDateInPast(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Main seeding function
 */
async function seedDemoData(userId) {
  try {
    console.log('\n🌱 Starting demo data generation...\n');

    // Verify user exists
    const User = require('../models/user.model');
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    console.log(`✓ Found user: ${user.name} (${user.email})`);

    // Get or create default account
    let account = await Account.findOne({ user: userId, isDefault: true });
    if (!account) {
      account = await Account.create({
        user: userId,
        name: 'Main Account',
        type: 'checking',
        balance: 0,
        currency: 'USD',
        isDefault: true
      });
      console.log('✓ Created default account');
    }

    // Get or create categories (user-specific)
    const categoryMap = {};
    const categoryIcons = {
      'Groceries': '🛒',
      'Dining': '🍽️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Healthcare': '⚕️',
      'Utilities': '💡',
      'Rent': '🏠',
      'Subscriptions': '📺',
      'Fitness': '💪'
    };

    for (const catName of Object.keys(DEMO_CONFIG.categories)) {
      let category = await Category.findOne({ name: catName, user: userId });
      if (!category) {
        category = await Category.create({
          name: catName,
          type: 'expense',
          icon: categoryIcons[catName] || '💰',
          color: '#' + Math.floor(Math.random()*16777215).toString(16),
          user: userId
        });
      }
      categoryMap[catName] = category._id;
    }

    // Create income category
    let salaryCategory = await Category.findOne({ name: 'Salary', user: userId });
    if (!salaryCategory) {
      salaryCategory = await Category.create({
        name: 'Salary',
        type: 'income',
        icon: '💵',
        color: '#10b981',
        user: userId
      });
    }
    console.log(`✓ Categories ready (${Object.keys(categoryMap).length} expense + 1 income)`);

    // Clear existing demo data for this user (optional)
    const clearExisting = true;
    if (clearExisting) {
      await Transaction.deleteMany({ user: userId });
      await Budget.deleteMany({ user: userId });
      await Goal.deleteMany({ user: userId });
      console.log('✓ Cleared existing data');
    }

    // Generate transactions
    const transactions = [];
    const transactionDescriptions = {
      'Groceries': ['Whole Foods', 'Trader Joes', 'Safeway', 'Local Market', 'Farmers Market'],
      'Dining': ['Chipotle', 'Local Restaurant', 'Pizza Place', 'Thai Food', 'Coffee Shop', 'Sushi Bar'],
      'Transportation': ['Uber', 'Gas Station', 'Public Transit', 'Parking', 'Lyft'],
      'Entertainment': ['Movie Theater', 'Concert', 'Streaming Service', 'Gaming', 'Books'],
      'Shopping': ['Amazon', 'Target', 'Online Store', 'Clothing Store', 'Electronics'],
      'Healthcare': ['Pharmacy', 'Doctor Visit', 'Dental Checkup', 'Health Insurance'],
      'Utilities': ['Electric Bill', 'Internet', 'Water Bill', 'Phone Bill'],
      'Rent': ['Monthly Rent'],
      'Subscriptions': ['Netflix', 'Spotify', 'Adobe', 'Cloud Storage', 'Gym Membership'],
      'Fitness': ['Gym', 'Yoga Class', 'Sports Equipment', 'Running Gear']
    };

    // Generate monthly salary (on 1st and 15th of each month)
    const salaryDates = [];
    for (let day = DEMO_CONFIG.days; day >= 0; day--) {
      const date = getDateInPast(day);
      if (date.getDate() === 1 || date.getDate() === 15) {
        salaryDates.push(day);
      }
    }

    for (const day of salaryDates) {
      transactions.push({
        user: userId,
        account: account._id,
        category: salaryCategory._id,
        type: 'income',
        amount: DEMO_CONFIG.monthlyIncome / 2, // Bi-weekly
        description: 'Salary Payment',
        date: getDateInPast(day),
        status: 'completed'
      });
    }
    console.log(`✓ Generated ${salaryDates.length} salary transactions`);

    // Generate expense transactions
    let expenseCount = 0;
    for (let day = DEMO_CONFIG.days; day >= 0; day--) {
      const date = getDateInPast(day);

      // For each category, decide if transaction happens today
      for (const [catName, [minAmount, maxAmount, monthlyFreq]] of Object.entries(DEMO_CONFIG.categories)) {
        // Calculate probability of transaction today
        const dailyProbability = monthlyFreq / 30;

        if (Math.random() < dailyProbability) {
          const amount = random(minAmount, maxAmount);
          const descriptions = transactionDescriptions[catName] || [catName];

          transactions.push({
            user: userId,
            account: account._id,
            category: categoryMap[catName],
            type: 'expense',
            amount: amount,
            description: randomChoice(descriptions),
            date: date,
            status: 'completed'
          });
          expenseCount++;
        }
      }
    }
    console.log(`✓ Generated ${expenseCount} expense transactions`);

    // Bulk insert transactions
    await Transaction.insertMany(transactions);
    console.log(`✓ Inserted ${transactions.length} total transactions`);

    // Update account balance
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    account.balance = totalIncome - totalExpenses;
    await account.save();
    console.log(`✓ Updated account balance: $${account.balance.toFixed(2)}`);

    // Create budgets
    const budgets = [
      { name: 'Groceries Budget', category: categoryMap['Groceries'], amount: 400, period: 'monthly' },
      { name: 'Dining Budget', category: categoryMap['Dining'], amount: 300, period: 'monthly' },
      { name: 'Transportation Budget', category: categoryMap['Transportation'], amount: 200, period: 'monthly' },
      { name: 'Entertainment Budget', category: categoryMap['Entertainment'], amount: 250, period: 'monthly' },
      { name: 'Shopping Budget', category: categoryMap['Shopping'], amount: 300, period: 'monthly' },
    ];

    for (const budgetData of budgets) {
      await Budget.create({
        user: userId,
        name: budgetData.name,
        category: budgetData.category,
        amount: budgetData.amount,
        period: budgetData.period,
        startDate: getDateInPast(30),
        endDate: new Date(new Date().setDate(new Date().getDate() + 30))
      });
    }
    console.log(`✓ Created ${budgets.length} budgets`);

    // Create financial goals
    const goals = [
      {
        title: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 3500,
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 12)),
        category: 'savings'
      },
      {
        title: 'Vacation to Europe',
        targetAmount: 5000,
        currentAmount: 1200,
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 8)),
        category: 'savings'
      },
      {
        title: 'New Laptop',
        targetAmount: 2000,
        currentAmount: 800,
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 4)),
        category: 'savings'
      }
    ];

    for (const goalData of goals) {
      await Goal.create({
        user: userId,
        ...goalData,
        status: 'active'
      });
    }
    console.log(`✓ Created ${goals.length} financial goals`);

    // Summary
    console.log('\n📊 Demo Data Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Period: ${DEMO_CONFIG.days} days`);
    console.log(`Total Transactions: ${transactions.length}`);
    console.log(`  - Income: ${transactions.filter(t => t.type === 'income').length} ($${totalIncome.toFixed(2)})`);
    console.log(`  - Expenses: ${transactions.filter(t => t.type === 'expense').length} ($${totalExpenses.toFixed(2)})`);
    console.log(`Net Balance: $${(totalIncome - totalExpenses).toFixed(2)}`);
    console.log(`Budgets: ${budgets.length}`);
    console.log(`Goals: ${goals.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Demo data generation completed!\n');
    console.log('You can now:');
    console.log('  - View insights on the Insights page');
    console.log('  - Test ML predictions on AI Insights page');
    console.log('  - Analyze spending patterns');
    console.log('  - View forecasts and anomalies\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
}

// Get userId from command line
const userId = process.argv[2];

if (!userId) {
  console.error('\n❌ Error: User ID required\n');
  console.log('Usage: node scripts/seedDemoData.js <userId>\n');
  console.log('To get your user ID:');
  console.log('  1. Log into your app');
  console.log('  2. Open browser console');
  console.log('  3. Run: localStorage.getItem("user")');
  console.log('  4. Copy the "_id" field\n');
  process.exit(1);
}

// Validate userId format
if (!mongoose.Types.ObjectId.isValid(userId)) {
  console.error(`\n❌ Error: Invalid user ID format: ${userId}\n`);
  process.exit(1);
}

// Run the seeder
seedDemoData(userId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
