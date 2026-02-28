const { connectDB, models } = require('./packages/database');
const bcrypt = require('bcryptjs');

async function createUser() {
    await connectDB();
    const { AdminUser } = models;

    const username = 'antigravity_admin';
    const password = 'password123';

    // Check if user exists
    const existing = await AdminUser.findOne({ username });
    if (existing) {
        console.log(`User ${username} already exists.`);
    } else {
        const hashedPassword = bcrypt.hashSync(password, 10);
        await AdminUser.create({ username, password: hashedPassword });
        console.log(`Successfully created user: ${username} / ${password}`);
    }

    process.exit(0);
}

createUser().catch(err => {
    console.error(err);
    process.exit(1);
});
