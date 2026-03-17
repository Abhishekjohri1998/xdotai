const express = require('express');
const { connectDB, models } = require('@xdotai/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Heartbeat / Health-check
app.get('/api/health', (req, res) => {
    res.json({ status: 'X DOT AI Backend is Online' });
});

// We can move common API routes here later if needed
// For now, this satisfies the requirement of a separate backend folder

if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`\n🚀 X DOT AI Backend running at http://localhost:${PORT}`);
        });
    });
}

module.exports = app;
