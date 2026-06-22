require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { connectDB, models } = require('@xdotai/database');

const app = express();
const PORT = process.env.PORT || 3001; // Admin on 3001 if run separately, or shared

// ─── View Engine ─────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middleware ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../../packages/shared/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Only use local session if running standalone
if (require.main === module) {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'xdotai-secret-key-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 24 * 60 * 60 * 1000 }
    }));
}

// Minimal middleware for admin locals
app.use((req, res, next) => {
    res.locals.isAdmin = req.session && req.session.isAdmin;
    res.locals.currentPath = req.path;
    next();
});


// ─── Routes ──────────────────────────────────────────────
const adminRoutes = require('./routes/admin');
app.use('/', adminRoutes);

// ─── Start Server ────────────────────────────────────────
if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`\n📋 X DOT AI Admin Panel running at http://localhost:${PORT}/admin`);
            console.log(`   Login: admin / xdotai2026\n`);
        });
    });
}

module.exports = app;
