const express = require('express');
const session = require('express-session');
const path = require('path');
const { connectDB, models } = require('@xdotai/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── View Engine ─────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middleware ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../../packages/shared/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'xdotai-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Make session data available to all EJS templates
app.use(async (req, res, next) => {
    res.locals.isAdmin = req.session && req.session.isAdmin;
    res.locals.currentPath = req.path;

    try {
        const { NavLink, ClientLogo, Setting } = models;
        const allNavLinks = await NavLink.find({ is_visible: 1 }).sort({ sort_order: 1 }).lean();
        const topLinks = allNavLinks.filter(n => !n.parent_id);
        const navTree = topLinks.map(parent => ({
            ...parent,
            id: parent._id,
            children: allNavLinks.filter(c => c.parent_id && c.parent_id.toString() === parent._id.toString()).map(c => ({ ...c, id: c._id }))
        }));
        res.locals.navTree = navTree;
        res.locals.clientLogos = (await ClientLogo.find({ is_active: 1 }).sort({ sort_order: 1 }).lean()).map(l => ({ ...l, id: l._id }));
        const settingsRows = await Setting.find({ key: { $in: ['favicon_url', 'logo_url'] } }).lean();
        for (const r of settingsRows) res.locals[r.key] = r.value;
    } catch { res.locals.navTree = []; res.locals.clientLogos = []; }

    next();
});

// ─── Routes ──────────────────────────────────────────────
const pageRoutes = require('./routes/pages');
app.use('/', pageRoutes);

// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render('pages/404', {
        page: { title: 'Page Not Found — X DOT AI', meta_description: 'The page you are looking for does not exist.' },
        currentPath: req.path
    });
});

// ─── Start Server ────────────────────────────────────────
if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`\n🚀 X DOT AI Website running at http://localhost:${PORT}`);
        });
    });
}

module.exports = app;
