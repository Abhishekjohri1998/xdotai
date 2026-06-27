const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://abhishekjohri659_db_user:EhVc42jcN2bjVKyv@cluster0.a2n4jqk.mongodb.net/xdotai?retryWrites=true&w=majority';

console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ Success!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fail:', err);
    process.exit(1);
  });
