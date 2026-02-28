const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const { models } = require('@xdotai/database');
const { AdminUser, Page, Section, Setting, PortfolioCategory, Media, HeroBanner, BlogPost, BlogCategory, NavLink, ClientLogo, HomeSection } = models;
const { requireAuth } = require('@xdotai/shared/backend/middleware/auth');
const upload = require('@xdotai/shared/backend/middleware/upload');

// ─── Login ───────────────────────────────────────────────
router.get('/login', (req, res) => {
    if (req.session && req.session.isAdmin) return res.redirect('./');
    res.render('login', { error: null, title: 'Admin Login — X DOT AI' });
});


router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await AdminUser.findOne({ username }).lean();
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.isAdmin = true;
        req.session.adminUser = username;
        return res.redirect('./');
    }
    res.render('login', { error: 'Invalid credentials', title: 'Admin Login — X DOT AI' });
});


router.get('/logout', (req, res) => { req.session.destroy(); res.redirect('./login'); });


// ─── Dashboard ───────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
    const pages = await Page.find().sort({ nav_order: 1 }).lean();
    const sectionCounts = {};
    for (const p of pages) {
        sectionCounts[p.slug] = await Section.countDocuments({ page_id: p._id });
        p.id = p._id;
    }
    const settings = {};
    (await Setting.find().lean()).forEach(r => settings[r.key] = r.value);
    const mediaCount = await Media.countDocuments();

    res.render('dashboard', {
        title: 'Admin Dashboard — X DOT AI', pages, sectionCounts, settings, mediaCount,
        adminUser: req.session.adminUser, saved: req.query.saved, pwError: null, pwSuccess: null
    });
});

// ─── Page Builder (Edit Page) ────────────────────────────
router.get('/page/:slug', requireAuth, async (req, res) => {
    const page = await Page.findOne({ slug: req.params.slug }).lean();
    if (!page) return res.redirect('/');
    page.id = page._id;

    if (page.template === 'blog') return res.redirect('./blog');


    const sections = await Section.find({ page_id: page._id }).sort({ type: 1, sort_order: 1 }).lean();
    const grouped = {};
    for (const s of sections) {
        s.id = s._id;
        if (!grouped[s.type]) grouped[s.type] = [];
        try { s.extra = JSON.parse(s.extra_json || '{}'); } catch { s.extra = {}; }
        grouped[s.type].push(s);
    }

    let portfolioCategories = [];
    if (page.slug === 'portfolio') {
        portfolioCategories = await PortfolioCategory.find().sort({ sort_order: 1 }).lean();
        portfolioCategories.forEach(c => c.id = c._id);
    }

    const allPages = await Page.find().select('slug title nav_order').sort({ nav_order: 1 }).lean();
    const media = await Media.find().sort({ uploaded_at: -1 }).limit(50).lean();
    media.forEach(m => m.id = m._id);

    const heroBanners = await HeroBanner.find({ page_id: page._id }).sort({ sort_order: 1 }).lean();
    heroBanners.forEach(b => b.id = b._id);

    const settings = {};
    (await Setting.find().lean()).forEach(r => settings[r.key] = r.value);

    let pageFaqs = [];
    try { pageFaqs = JSON.parse(page.faq_json || '[]'); } catch { pageFaqs = []; }

    res.render('page-builder', {
        title: `Edit ${page.title} — Admin`, page, sections: grouped, allSections: sections,
        success: req.query.saved === '1', portfolioCategories, allPages, media, heroBanners, settings, pageFaqs
    });
});

// ─── Home Manager ────────────────────────────────────────
router.get('/home-manager', requireAuth, async (req, res) => {
    const homeSections = (await HomeSection.find().sort({ sort_order: 1 }).lean()).map(s => {
        try { s.config = JSON.parse(s.config_json || '{}'); } catch { s.config = {}; }
        s.id = s._id;
        return s;
    });
    const settings = {};
    (await Setting.find().lean()).forEach(r => settings[r.key] = r.value);
    const pages = await Page.find().select('slug').sort({ nav_order: 1, title: 1 }).lean();
    res.render('home-manager', {
        title: 'Home Page Manager — Admin', homeSections, settings, pages,
        adminUser: req.session.adminUser, saved: req.query.saved
    });
});

router.post('/home-sections/:id', requireAuth, async (req, res) => {
    const { heading, subtitle, label, config_json } = req.body;
    let configStr = config_json || '{}';
    if (!config_json || config_json === '{}') {
        const config = {};
        Object.keys(req.body).forEach(k => {
            if (k.startsWith('cfg_')) config[k.replace('cfg_', '')] = req.body[k];
        });
        if (Object.keys(config).length) configStr = JSON.stringify(config);
    }
    await HomeSection.findByIdAndUpdate(req.params.id, {
        heading: heading || '', subtitle: subtitle || '', config_json: configStr,
        ...(label ? { label } : {})
    });
    res.redirect('/admin/home-manager?saved=1');
});

router.post('/home-sections/:id/toggle', requireAuth, async (req, res) => {
    const hs = await HomeSection.findById(req.params.id);
    if (hs) { hs.is_visible = hs.is_visible ? 0 : 1; await hs.save(); }
    res.json({ ok: true });
});

router.post('/home-sections/reorder', requireAuth, async (req, res) => {
    const { order } = req.body;
    if (Array.isArray(order)) {
        for (let i = 0; i < order.length; i++) {
            await HomeSection.findByIdAndUpdate(order[i], { sort_order: i + 1 });
        }
    }
    res.json({ ok: true });
});

// ─── Visual Builder ──────────────────────────────────────
router.get('/visual-builder/:slug', requireAuth, async (req, res) => {
    const page = await Page.findOne({ slug: req.params.slug }).lean();
    if (!page) return res.redirect('./');

    page.id = page._id;
    res.render('visual-builder', { title: `Visual Builder: ${page.title} — Admin`, page });
});

// ─── Create New Page ─────────────────────────────────────
router.get('/page-create', requireAuth, (req, res) => {
    res.render('page-create', { title: 'Create New Page — Admin', error: null });
});

router.post('/page-create', requireAuth, async (req, res) => {
    const { slug, title, meta_description, hero_title, hero_subtitle, template } = req.body;
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/(^-|-$)/g, '');
    if (!cleanSlug || !title) {
        return res.render('admin/page-create', { title: 'Create New Page — Admin', error: 'Slug and title are required' });
    }
    const existing = await Page.findOne({ slug: cleanSlug });
    if (existing) {
        return res.render('admin/page-create', { title: 'Create New Page — Admin', error: `A page with slug "${cleanSlug}" already exists` });
    }
    const maxPage = await Page.findOne().sort({ nav_order: -1 }).lean();
    const maxOrder = maxPage ? maxPage.nav_order : 0;
    await Page.create({ slug: cleanSlug, title, meta_description: meta_description || '', hero_title: hero_title || '', hero_subtitle: hero_subtitle || '', hero_label: '', nav_order: maxOrder + 1, template: template || 'default' });
    res.redirect(`/admin/page/${cleanSlug}?saved=1`);
});

// ─── Update Page Meta ────────────────────────────────────
router.post('/page/:slug', requireAuth, async (req, res) => {
    const { title, meta_description, hero_title, hero_subtitle, hero_label, nav_order, is_visible, template, schema_type, schema_json, faq_json } = req.body;
    await Page.findOneAndUpdate({ slug: req.params.slug }, {
        title, meta_description, hero_title, hero_subtitle, hero_label: hero_label || '',
        nav_order: parseInt(nav_order) || 99, is_visible: is_visible === 'on' ? 1 : 0, template: template || 'default',
        schema_type: schema_type || 'WebPage', schema_json: schema_json || '', faq_json: faq_json || '[]', updated_at: new Date()
    });
    res.redirect(`/admin/page/${req.params.slug}?saved=1`);
});

// ─── Delete Page ─────────────────────────────────────────
router.post('/page/:slug/delete', requireAuth, async (req, res) => {
    if (['home'].includes(req.params.slug)) return res.redirect('./?error=cannot-delete-home');
    const page = await Page.findOne({ slug: req.params.slug });
    if (page) {
        await Section.deleteMany({ page_id: page._id });
        await Page.findByIdAndDelete(page._id);
    }
    res.redirect('./?saved=1');
});


// ─── Duplicate Page ──────────────────────────────────────
router.post('/page/:slug/duplicate', requireAuth, async (req, res) => {
    const page = await Page.findOne({ slug: req.params.slug }).lean();
    if (!page) return res.redirect('./');

    const newSlug = `${page.slug}-copy-${Date.now()}`;
    const maxPage = await Page.findOne().sort({ nav_order: -1 }).lean();
    const maxOrder = maxPage ? maxPage.nav_order : 0;

    const newPage = await Page.create({
        slug: newSlug, title: `${page.title} (Copy)`, meta_description: page.meta_description,
        hero_title: page.hero_title, hero_subtitle: page.hero_subtitle, hero_label: page.hero_label,
        nav_order: maxOrder + 1, template: page.template
    });

    const sections = await Section.find({ page_id: page._id }).lean();
    for (const s of sections) {
        await Section.create({ page_id: newPage._id, type: s.type, title: s.title, description: s.description, content_html: s.content_html || '', image_url: s.image_url || '', video_url: s.video_url || '', icon: s.icon, icon_type: s.icon_type || 'emoji', icon_image_url: s.icon_image_url || '', tag: s.tag, sort_order: s.sort_order, extra_json: s.extra_json });
    }
    const banners = await HeroBanner.find({ page_id: page._id }).lean();
    for (const b of banners) {
        await HeroBanner.create({ page_id: newPage._id, image_url: b.image_url, overlay_title: b.overlay_title, overlay_subtitle: b.overlay_subtitle, overlay_position: b.overlay_position, sort_order: b.sort_order, is_active: b.is_active, alt_text: b.alt_text, seo_title: b.seo_title });
    }
    res.redirect(`/admin/page/${newSlug}?saved=1`);
});

// ─── Update Section ──────────────────────────────────────
router.post('/section/:id', requireAuth, async (req, res) => {
    const { title, description, content_html, image_url, video_url, icon, icon_type, icon_image_url, tag, sort_order, youtube_url } = req.body;
    let { extra_json } = req.body;
    const section = await Section.findById(req.params.id).lean();
    if (!section) return res.redirect('./');

    const page = await Page.findById(section.page_id).lean();

    if (youtube_url !== undefined) {
        try { const e = JSON.parse(extra_json || '{}'); e.youtube_url = youtube_url; extra_json = JSON.stringify(e); } catch { extra_json = JSON.stringify({ youtube_url }); }
    }
    if (section.type === 'portfolio') {
        const ifh = req.body.is_featured_home;
        try { const e = JSON.parse(extra_json || '{}'); e.is_featured_home = ifh === 'on'; extra_json = JSON.stringify(e); } catch { extra_json = JSON.stringify({ is_featured_home: ifh === 'on' }); }
    }

    await Section.findByIdAndUpdate(req.params.id, {
        title, description, content_html: content_html || '', image_url: image_url || '', video_url: video_url || '',
        icon: icon || '', icon_type: icon_type || 'emoji', icon_image_url: icon_image_url || '',
        tag: tag || '', sort_order: parseInt(sort_order) || 0, extra_json: extra_json || '{}'
    });
    res.redirect(`/admin/page/${page.slug}?saved=1`);
});

// ─── Add Section ─────────────────────────────────────────
router.post('/page/:slug/add-section', requireAuth, async (req, res) => {
    const page = await Page.findOne({ slug: req.params.slug });
    if (!page) return res.redirect('./');

    const { type, title, description, content_html, image_url, video_url, icon, icon_type, icon_image_url, tag, sort_order, youtube_url } = req.body;
    let { extra_json } = req.body;
    if (youtube_url) { try { const e = JSON.parse(extra_json || '{}'); e.youtube_url = youtube_url; extra_json = JSON.stringify(e); } catch { extra_json = JSON.stringify({ youtube_url }); } }
    if (type === 'portfolio') { const ifh = req.body.is_featured_home; try { const e = JSON.parse(extra_json || '{}'); e.is_featured_home = ifh === 'on'; extra_json = JSON.stringify(e); } catch { extra_json = JSON.stringify({ is_featured_home: ifh === 'on' }); } }

    await Section.create({ page_id: page._id, type, title, description, content_html: content_html || '', image_url: image_url || '', video_url: video_url || '', icon: icon || '', icon_type: icon_type || 'emoji', icon_image_url: icon_image_url || '', tag: tag || '', sort_order: parseInt(sort_order) || 0, extra_json: extra_json || '{}' });
    res.redirect(`/admin/page/${req.params.slug}?saved=1`);
});

// ─── Delete Section ──────────────────────────────────────
router.post('/section/:id/delete', requireAuth, async (req, res) => {
    const section = await Section.findById(req.params.id).lean();
    if (!section) return res.redirect('./');

    const page = await Page.findById(section.page_id).lean();
    await Section.findByIdAndDelete(req.params.id);
    res.redirect(`/admin/page/${page.slug}?saved=1`);
});

// ─── Save Page Blocks (Visual Builder) ───────────────────
router.post('/api/save-blocks', requireAuth, express.json(), async (req, res) => {
    const { slug, blocks } = req.body;
    if (!slug || !Array.isArray(blocks)) return res.status(400).json({ error: 'Invalid data' });
    try {
        await Page.findOneAndUpdate({ slug }, { page_blocks: JSON.stringify(blocks), updated_at: new Date() });
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/reorder-sections', requireAuth, express.json(), async (req, res) => {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.json({ error: 'Invalid payload' });
    for (const item of order) {
        await Section.findByIdAndUpdate(item.id, { sort_order: parseInt(item.sort_order) });
    }
    res.json({ success: true });
});

// ─── Update Settings ─────────────────────────────────────
router.post('/settings', requireAuth, async (req, res) => {
    for (const [key, value] of Object.entries(req.body)) {
        await Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true });
    }
    res.redirect('/admin?saved=1');
});

// ─── Branding Upload ─────────────────────────────────────
router.post('/branding', requireAuth, upload.fields([{ name: 'favicon', maxCount: 1 }, { name: 'site_logo', maxCount: 1 }]), async (req, res) => {
    if (req.files && req.files.favicon && req.files.favicon[0]) {
        const file = req.files.favicon[0];
        const ext = path.extname(file.originalname).toLowerCase();
        const destName = 'favicon' + ext;
        const destPath = path.join(__dirname, '..', 'public', destName);
        fs.copyFileSync(file.path, destPath);
        await Setting.findOneAndUpdate({ key: 'favicon_url' }, { key: 'favicon_url', value: '/' + destName }, { upsert: true });
    }
    if (req.files && req.files.site_logo && req.files.site_logo[0]) {
        const file = req.files.site_logo[0];
        await Setting.findOneAndUpdate({ key: 'logo_url' }, { key: 'logo_url', value: '/uploads/' + file.filename }, { upsert: true });
    }
    res.redirect('/admin?saved=1');
});

// ─── Change Admin Password ───────────────────────────────
router.post('/change-password', requireAuth, async (req, res) => {
    const { current_password, new_password, confirm_password } = req.body;
    const user = await AdminUser.findOne({ username: req.session.adminUser }).lean();

    const renderDashboard = async (error, success) => {
        const pages = await Page.find().sort({ nav_order: 1 }).lean();
        const sectionCounts = {};
        for (const p of pages) { sectionCounts[p.slug] = await Section.countDocuments({ page_id: p._id }); p.id = p._id; }
        const settings = {};
        (await Setting.find().lean()).forEach(r => settings[r.key] = r.value);
        const mediaCount = await Media.countDocuments();
        res.render('dashboard', { title: 'Admin Dashboard — X DOT AI', pages, sectionCounts, settings, mediaCount, adminUser: req.session.adminUser, saved: null, pwError: error || null, pwSuccess: success || null });
    };

    if (!user || !bcrypt.compareSync(current_password, user.password)) return renderDashboard('Current password is incorrect.');
    if (new_password !== confirm_password) return renderDashboard('New passwords do not match.');
    if (new_password.length < 6) return renderDashboard('New password must be at least 6 characters.');
    const hashed = bcrypt.hashSync(new_password, 10);
    await AdminUser.findOneAndUpdate({ username: req.session.adminUser }, { password: hashed });
    renderDashboard(null, true);
});

// ─── Portfolio Categories CRUD ───────────────────────────
router.post('/category', requireAuth, async (req, res) => {
    const { name, description, sort_order } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    try { await PortfolioCategory.create({ name, slug, description: description || '', sort_order: parseInt(sort_order) || 0 }); } catch { }
    res.redirect('/admin/page/portfolio?saved=1');
});

router.post('/category/:id', requireAuth, async (req, res) => {
    const { name, description, sort_order } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await PortfolioCategory.findByIdAndUpdate(req.params.id, { name, slug, description: description || '', sort_order: parseInt(sort_order) || 0 });
    res.redirect('/admin/page/portfolio?saved=1');
});

router.post('/category/:id/delete', requireAuth, async (req, res) => {
    await PortfolioCategory.findByIdAndDelete(req.params.id);
    res.redirect('/admin/page/portfolio?saved=1');
});

// ═══════════════════════ MEDIA API ═══════════════════════

router.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { originalname, filename, mimetype, size } = req.file;
    const m = await Media.create({ filename, original_name: originalname, mime_type: mimetype, size, alt_text: req.body.alt_text || '', seo_title: req.body.seo_title || '', seo_caption: req.body.seo_caption || '' });
    res.json({ success: true, media: { ...m.toObject(), id: m._id, url: `/uploads/${filename}` } });
});

router.get('/api/media', requireAuth, async (req, res) => {
    const media = await Media.find().sort({ uploaded_at: -1 }).lean();
    res.json(media.map(m => ({ ...m, id: m._id, url: `/uploads/${m.filename}` })));
});

router.post('/api/media/:id/update', requireAuth, express.json(), async (req, res) => {
    const { alt_text, seo_title, seo_caption } = req.body;
    const m = await Media.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Not found' });
    await Media.findByIdAndUpdate(req.params.id, { alt_text: alt_text || '', seo_title: seo_title || '', seo_caption: seo_caption || '' });
    res.json({ success: true });
});

router.post('/api/media/:id/delete', requireAuth, async (req, res) => {
    const m = await Media.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Not found' });
    const filePath = path.join(__dirname, '..', 'public', 'uploads', m.filename);
    try { fs.unlinkSync(filePath); } catch { }
    await Media.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// ═══════════════════════ HERO BANNER CRUD ═══════════════════════

router.post('/page/:slug/hero-banner', requireAuth, upload.single('banner_image'), async (req, res) => {
    const page = await Page.findOne({ slug: req.params.slug });
    if (!page) return res.redirect('/admin');
    let imageUrl = req.body.image_url || '';
    if (req.file) {
        await Media.create({ filename: req.file.filename, original_name: req.file.originalname, mime_type: req.file.mimetype, size: req.file.size, alt_text: req.body.alt_text || '', seo_title: req.body.seo_title || '' });
        imageUrl = `/uploads/${req.file.filename}`;
    }
    if (!imageUrl) return res.redirect(`/admin/page/${req.params.slug}?saved=0`);
    const maxBanner = await HeroBanner.findOne({ page_id: page._id }).sort({ sort_order: -1 }).lean();
    const maxOrder = maxBanner ? maxBanner.sort_order : 0;
    await HeroBanner.create({ page_id: page._id, image_url: imageUrl, overlay_title: req.body.overlay_title || '', overlay_subtitle: req.body.overlay_subtitle || '', overlay_position: req.body.overlay_position || 'center', sort_order: maxOrder + 1, is_active: 1, alt_text: req.body.alt_text || '', seo_title: req.body.seo_title || '' });
    res.redirect(`/admin/page/${req.params.slug}?saved=1`);
});

router.post('/hero-banner/:id', requireAuth, upload.single('banner_image'), async (req, res) => {
    const banner = await HeroBanner.findById(req.params.id).lean();
    if (!banner) return res.redirect('/admin');
    const page = await Page.findById(banner.page_id).lean();
    let imageUrl = req.body.image_url || banner.image_url;
    if (req.file) {
        await Media.create({ filename: req.file.filename, original_name: req.file.originalname, mime_type: req.file.mimetype, size: req.file.size, alt_text: req.body.alt_text || '', seo_title: req.body.seo_title || '' });
        imageUrl = `/uploads/${req.file.filename}`;
    }
    await HeroBanner.findByIdAndUpdate(req.params.id, { image_url: imageUrl, overlay_title: req.body.overlay_title || '', overlay_subtitle: req.body.overlay_subtitle || '', overlay_position: req.body.overlay_position || 'center', sort_order: parseInt(req.body.sort_order) || 0, is_active: req.body.is_active === 'on' ? 1 : 0, alt_text: req.body.alt_text || '', seo_title: req.body.seo_title || '' });
    res.redirect(`/admin/page/${page.slug}?saved=1`);
});

router.post('/hero-banner/:id/delete', requireAuth, async (req, res) => {
    const banner = await HeroBanner.findById(req.params.id).lean();
    if (!banner) return res.redirect('/admin');
    const page = await Page.findById(banner.page_id).lean();
    await HeroBanner.findByIdAndDelete(req.params.id);
    res.redirect(`/admin/page/${page.slug}?saved=1`);
});

// ═══════════════════════ AI API ENDPOINTS ═══════════════════════

router.post('/api/ai/generate', requireAuth, express.json(), async (req, res) => {
    const { prompt, context } = req.body;
    const apiKeySetting = await Setting.findOne({ key: 'openai_api_key' }).lean();
    if (!apiKeySetting || !apiKeySetting.value) return res.status(400).json({ error: 'OpenAI API key not configured.' });
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeySetting.value}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are an expert web content writer for X DOT AI. Write engaging, SEO-optimized content. Use rich HTML formatting. Output ONLY the HTML content.' }, { role: 'user', content: context ? `Context: ${context}\n\nTask: ${prompt}` : prompt }], max_tokens: 1500, temperature: 0.7 })
        });
        if (!response.ok) { const err = await response.json().catch(() => ({})); return res.status(response.status).json({ error: err.error?.message || 'AI API error' }); }
        const data = await response.json();
        res.json({ success: true, content: data.choices?.[0]?.message?.content || '' });
    } catch { res.status(500).json({ error: 'Failed to connect to AI service' }); }
});

router.post('/api/ai/seo', requireAuth, express.json(), async (req, res) => {
    const { pageTitle, pageContent } = req.body;
    const apiKeySetting = await Setting.findOne({ key: 'openai_api_key' }).lean();
    if (!apiKeySetting || !apiKeySetting.value) return res.status(400).json({ error: 'OpenAI API key not configured' });
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeySetting.value}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are an SEO expert for X DOT AI. Generate optimized SEO metadata. Respond ONLY with valid JSON.' }, { role: 'user', content: `Generate SEO metadata for this page:\nTitle: ${pageTitle}\nContent: ${pageContent?.substring(0, 1000)}\n\nRespond with JSON: {"title":"optimized title","meta_description":"description","keywords":["k1","k2"],"score":85,"suggestions":["s1","s2"]}` }], max_tokens: 500, temperature: 0.5 })
        });
        if (!response.ok) throw new Error('AI API error');
        const data = await response.json();
        const cleaned = (data.choices?.[0]?.message?.content || '{}').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        res.json({ success: true, seo: JSON.parse(cleaned) });
    } catch { res.status(500).json({ error: 'Failed to generate SEO suggestions' }); }
});

router.post('/api/ai/rewrite', requireAuth, express.json(), async (req, res) => {
    const { text, action } = req.body;
    const apiKeySetting = await Setting.findOne({ key: 'openai_api_key' }).lean();
    if (!apiKeySetting || !apiKeySetting.value) return res.status(400).json({ error: 'OpenAI API key not configured' });
    const actionPrompts = { expand: 'Expand this text.', summarize: 'Summarize this text.', professional: 'Rewrite professionally.', casual: 'Rewrite casually.', persuasive: 'Rewrite persuasively.', seo: 'Rewrite for SEO.' };
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeySetting.value}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Expert content editor for X DOT AI. Output ONLY the rewritten HTML content.' }, { role: 'user', content: `${actionPrompts[action] || actionPrompts.professional} Output HTML.\n\nOriginal:\n${text}` }], max_tokens: 1000, temperature: 0.6 })
        });
        if (!response.ok) throw new Error('AI API error');
        const data = await response.json();
        res.json({ success: true, content: data.choices?.[0]?.message?.content || '' });
    } catch { res.status(500).json({ error: 'Failed to rewrite content' }); }
});

router.get('/api/youtube-info', requireAuth, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.json({ error: 'No URL provided' });
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);
        if (!response.ok) return res.json({ error: 'Could not fetch YouTube info' });
        const data = await response.json();
        res.json({ title: data.title || '', author: data.author_name || '', thumbnail: data.thumbnail_url || '' });
    } catch { res.json({ error: 'Failed to fetch YouTube metadata' }); }
});

// ═══════════════════════ BLOG CMS ═══════════════════════

router.get('/blog', requireAuth, async (req, res) => {
    const posts = await BlogPost.find().sort({ created_at: -1 }).lean();
    posts.forEach(p => p.id = p._id);
    const categories = await BlogCategory.find().sort({ sort_order: 1 }).lean();
    categories.forEach(c => c.id = c._id);
    const stats = { total: posts.length, published: posts.filter(p => p.status === 'published').length, drafts: posts.filter(p => p.status === 'draft').length, featured: posts.filter(p => p.is_featured).length };
    res.render('blog-list', { title: 'Blog Manager — Admin', posts, categories, stats });
});

router.get('/blog/new', requireAuth, async (req, res) => {
    const categories = await BlogCategory.find().sort({ sort_order: 1 }).lean();
    const media = await Media.find().sort({ uploaded_at: -1 }).limit(50).lean();
    const settings = {};
    (await Setting.find().lean()).forEach(r => settings[r.key] = r.value);
    res.render('blog-editor', { title: 'New Blog Post — Admin', post: null, categories, media, settings, isNew: true });
});

router.get('/blog/:slug/edit', requireAuth, async (req, res) => {
    const post = await BlogPost.findOne({ slug: req.params.slug }).lean();
    if (!post) return res.redirect('/admin/blog');
    post.id = post._id;
    const categories = await BlogCategory.find().sort({ sort_order: 1 }).lean();
    const media = await Media.find().sort({ uploaded_at: -1 }).limit(50).lean();
    const settings = {};
    (await Setting.find().lean()).forEach(r => settings[r.key] = r.value);
    res.render('blog-editor', { title: `Edit: ${post.title} — Admin`, post, categories, media, settings, isNew: false });
});

function calcReadingTime(html) {
    const text = (html || '').replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    return Math.max(1, Math.ceil(words / 200));
}

router.post('/blog/new', requireAuth, upload.single('featured_image_file'), async (req, res) => {
    const { title, slug, excerpt, content_html, category, tags, meta_title, meta_description, og_image, status, is_featured, author, published_at, featured_image, featured_image_alt, faq_json } = req.body;
    const cleanSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await BlogPost.findOne({ slug: cleanSlug });
    if (existing) return res.redirect('/admin/blog/new?error=slug-exists');
    let imageUrl = featured_image || '';
    if (req.file) {
        await Media.create({ filename: req.file.filename, original_name: req.file.originalname, mime_type: req.file.mimetype, size: req.file.size, alt_text: featured_image_alt || '' });
        imageUrl = `/uploads/${req.file.filename}`;
    }
    const readingTime = calcReadingTime(content_html);
    const pubDate = status === 'published' ? (published_at || new Date().toISOString()) : null;
    await BlogPost.create({ slug: cleanSlug, title, excerpt: excerpt || '', content_html: content_html || '', featured_image: imageUrl, featured_image_alt: featured_image_alt || '', category: category || '', tags: tags || '', meta_title: meta_title || title, meta_description: meta_description || excerpt || '', og_image: og_image || imageUrl, reading_time: readingTime, status: status || 'draft', is_featured: is_featured === 'on' ? 1 : 0, author: author || 'Admin', published_at: pubDate, faq_json: faq_json || '[]' });
    res.redirect(`/admin/blog/${cleanSlug}/edit?saved=1`);
});

router.post('/blog/:slug', requireAuth, upload.single('featured_image_file'), async (req, res) => {
    const post = await BlogPost.findOne({ slug: req.params.slug });
    if (!post) return res.redirect('/admin/blog');
    const { title, excerpt, content_html, category, tags, meta_title, meta_description, og_image, status, is_featured, author, published_at, featured_image, featured_image_alt, faq_json } = req.body;
    let imageUrl = featured_image || post.featured_image;
    if (req.file) {
        await Media.create({ filename: req.file.filename, original_name: req.file.originalname, mime_type: req.file.mimetype, size: req.file.size, alt_text: featured_image_alt || '' });
        imageUrl = `/uploads/${req.file.filename}`;
    }
    const readingTime = calcReadingTime(content_html);
    let pubDate = published_at || post.published_at;
    if (status === 'published' && !pubDate) pubDate = new Date().toISOString();
    await BlogPost.findOneAndUpdate({ slug: req.params.slug }, { title, excerpt: excerpt || '', content_html: content_html || '', featured_image: imageUrl, featured_image_alt: featured_image_alt || '', category: category || '', tags: tags || '', meta_title: meta_title || title, meta_description: meta_description || excerpt || '', og_image: og_image || imageUrl, reading_time: readingTime, status: status || 'draft', is_featured: is_featured === 'on' ? 1 : 0, author: author || 'Admin', published_at: pubDate, faq_json: faq_json || '[]', updated_at: new Date() });
    res.redirect(`/admin/blog/${req.params.slug}/edit?saved=1`);
});

router.post('/blog/:slug/delete', requireAuth, async (req, res) => {
    await BlogPost.findOneAndDelete({ slug: req.params.slug });
    res.redirect('/admin/blog');
});

router.post('/api/blog/toggle-featured/:id', requireAuth, express.json(), async (req, res) => {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    post.is_featured = post.is_featured ? 0 : 1;
    await post.save();
    res.json({ success: true, is_featured: !!post.is_featured });
});

router.post('/api/blog/ai-generate', requireAuth, express.json(), async (req, res) => {
    const { topic, style } = req.body;
    const apiKeySetting = await Setting.findOne({ key: 'openai_api_key' }).lean();
    if (!apiKeySetting || !apiKeySetting.value) return res.status(400).json({ error: 'OpenAI API key not configured.' });
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeySetting.value}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: `Expert AI blog writer for X DOT AI. Use HTML formatting. Style: ${style || 'professional'}.` }, { role: 'user', content: `Write a comprehensive blog post about: ${topic}. Include intro, 3-5 sections, examples, and conclusion. ~1000-1500 words.` }], max_tokens: 3000, temperature: 0.7 })
        });
        const data = await response.json();
        res.json({ success: true, content: data.choices?.[0]?.message?.content || '' });
    } catch { res.status(500).json({ error: 'AI generation failed' }); }
});

router.post('/api/blog/ai-seo', requireAuth, express.json(), async (req, res) => {
    const { title, content } = req.body;
    const apiKeySetting = await Setting.findOne({ key: 'openai_api_key' }).lean();
    if (!apiKeySetting || !apiKeySetting.value) return res.status(400).json({ error: 'OpenAI API key not configured.' });
    const excerpt = (content || '').replace(/<[^>]*>/g, '').substring(0, 500);
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeySetting.value}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'SEO expert. Generate metadata. Return ONLY valid JSON with: meta_title, meta_description, excerpt, tags, slug.' }, { role: 'user', content: `Title: ${title}\n\nContent: ${excerpt}` }], max_tokens: 500, temperature: 0.5 })
        });
        const data = await response.json();
        const cleaned = (data.choices?.[0]?.message?.content || '{}').replace(/```json\n?/g, '').replace(/```/g, '').trim();
        res.json({ success: true, seo: JSON.parse(cleaned) });
    } catch { res.status(500).json({ error: 'AI SEO generation failed' }); }
});

router.post('/blog/category', requireAuth, async (req, res) => {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const maxCat = await BlogCategory.findOne().sort({ sort_order: -1 }).lean();
    const maxOrder = maxCat ? maxCat.sort_order : 0;
    try { await BlogCategory.create({ name, slug, description: description || '', sort_order: maxOrder + 1 }); } catch { }
    res.redirect('/admin/blog');
});

router.post('/blog/category/:id/delete', requireAuth, async (req, res) => {
    await BlogCategory.findByIdAndDelete(req.params.id);
    res.redirect('/admin/blog');
});

router.post('/api/ai-generate-faqs', requireAuth, express.json(), async (req, res) => {
    const { title, content, pageType } = req.body;
    const apiKeySetting = await Setting.findOne({ key: 'openai_api_key' }).lean();
    if (!apiKeySetting || !apiKeySetting.value) return res.status(400).json({ error: 'OpenAI API key not configured.' });
    const textContent = (content || '').replace(/<[^>]*>/g, '').substring(0, 2000);
    const context = pageType === 'blog' ? 'blog post' : 'web page';
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeySetting.value}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: `SEO expert. Generate 5-8 FAQ Q&A for a ${context}. Return ONLY valid JSON array of {"question","answer"} objects.` }, { role: 'user', content: `Title: ${title}\n\nContent: ${textContent}` }], max_tokens: 1500, temperature: 0.7 })
        });
        const data = await response.json();
        const cleaned = (data.choices?.[0]?.message?.content || '[]').replace(/```json\n?/g, '').replace(/```/g, '').trim();
        res.json({ success: true, faqs: JSON.parse(cleaned) });
    } catch { res.status(500).json({ error: 'AI FAQ generation failed' }); }
});

// ═══════════════════════ NAV LINKS & CLIENT LOGOS ═══════════════════════

router.get('/nav-logos', requireAuth, async (req, res) => {
    const pages = await Page.find().sort({ nav_order: 1 }).lean();
    pages.forEach(p => p.id = p._id);
    const navLinks = await NavLink.find().sort({ sort_order: 1 }).lean();
    navLinks.forEach(n => n.id = n._id);
    const topLinks = navLinks.filter(n => !n.parent_id);
    const clientLogos = await ClientLogo.find().sort({ sort_order: 1 }).lean();
    clientLogos.forEach(l => l.id = l._id);
    res.render('nav-logos', { title: 'Navigation & Logos — Admin', pages, navLinks, topLinks, clientLogos, adminUser: req.session.adminUser, saved: req.query.saved });
});

router.post('/nav-links/add', requireAuth, async (req, res) => {
    const { label, url, parent_id, sort_order } = req.body;
    await NavLink.create({ label, url: url || '/', parent_id: parent_id || null, sort_order: parseInt(sort_order) || 0 });
    res.redirect('/admin/nav-logos?saved=1');
});

router.post('/nav-links/:id', requireAuth, async (req, res) => {
    const { label, url, parent_id, sort_order, is_visible } = req.body;
    await NavLink.findByIdAndUpdate(req.params.id, { label, url: url || '/', parent_id: parent_id || null, sort_order: parseInt(sort_order) || 0, is_visible: is_visible !== undefined ? parseInt(is_visible) : 1 });
    res.redirect('/admin/nav-logos?saved=1');
});

router.post('/nav-links/:id/toggle', requireAuth, async (req, res) => {
    const link = await NavLink.findById(req.params.id);
    if (link) { link.is_visible = link.is_visible ? 0 : 1; await link.save(); }
    res.redirect('/admin/nav-logos?saved=1');
});

router.post('/nav-links/:id/delete', requireAuth, async (req, res) => {
    await NavLink.findByIdAndDelete(req.params.id);
    res.redirect('/admin/nav-logos?saved=1');
});

router.post('/client-logos/add', requireAuth, upload.single('logo_image'), async (req, res) => {
    const { name, image_url, website_url, sort_order } = req.body;
    const finalImageUrl = req.file ? `/uploads/${req.file.filename}` : (image_url || '');
    await ClientLogo.create({ name, image_url: finalImageUrl, website_url: website_url || '', sort_order: parseInt(sort_order) || 0 });
    res.redirect('/admin/nav-logos?saved=1');
});

router.post('/client-logos/:id', requireAuth, upload.single('logo_image'), async (req, res) => {
    const { name, image_url, website_url, sort_order } = req.body;
    const existing = await ClientLogo.findById(req.params.id).lean();
    const finalImageUrl = req.file ? `/uploads/${req.file.filename}` : (image_url || existing?.image_url || '');
    await ClientLogo.findByIdAndUpdate(req.params.id, { name, image_url: finalImageUrl, website_url: website_url || '', sort_order: parseInt(sort_order) || 0 });
    res.redirect('/admin/nav-logos?saved=1');
});

router.post('/client-logos/:id/toggle', requireAuth, async (req, res) => {
    const logo = await ClientLogo.findById(req.params.id);
    if (logo) { logo.is_active = logo.is_active ? 0 : 1; await logo.save(); }
    res.redirect('/admin/nav-logos?saved=1');
});

router.post('/client-logos/:id/delete', requireAuth, async (req, res) => {
    await ClientLogo.findByIdAndDelete(req.params.id);
    res.redirect('/admin/nav-logos?saved=1');
});

module.exports = router;
