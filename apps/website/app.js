const { connectDB } = require('./database/db');
const app = require('./server');

if (typeof (PhusionPassenger) !== 'undefined') {
    PhusionPassenger.configure({ autoInstall: false });
}

// Connect to MongoDB, then start
connectDB().then(() => {
    app.listen('passenger', () => {
        console.log('X DOT AI running via Passenger');
    });
});
