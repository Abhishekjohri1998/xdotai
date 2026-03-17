const express = require('express');
const router = express.Router();
const { models } = require('@xdotai/database');
const { Page, Section, Setting, PortfolioCategory, BlogPost, BlogCategory, HomeSection, ContactSubmission } = models;

// Helper: get page data + sections
async function getPageData(slug) {
    const page = await Page.findOne({ slug }).lean();
    if (!page) return null;

    const sections = await Section.find({ page_id: page._id }).sort({ sort_order: 1 }).lean();

    // Group sections by type
    const grouped = {};
    for (const s of sections) {
        if (!grouped[s.type]) grouped[s.type] = [];
        try { s.extra = JSON.parse(s.extra_json || '{}'); } catch { s.extra = {}; }
        // Add id alias for template compatibility
        s.id = s._id;
        grouped[s.type].push(s);
    }

    // Parse page blocks (visual builder)
    let pageBlocks = [];
    try { pageBlocks = JSON.parse(page.page_blocks || '[]'); } catch { pageBlocks = []; }

    // Get recent posts for blog-feed blocks
    let recentPosts = [];
    if (pageBlocks.some(b => b.type === 'blog-feed')) {
        recentPosts = await BlogPost.find({ status: 'published' })
            .select('slug title excerpt featured_image published_at')
            .sort({ published_at: -1 }).limit(12).lean();
    }

    // Add id alias
    page.id = page._id;

    return { page, sections: grouped, pageBlocks, recentPosts };
}

// Helper: get settings
async function getSettings() {
    const rows = await Setting.find().lean();
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    return settings;
}

// Helper: get sections by page slug and type
async function getSectionsBySlugType(slug, type) {
    const page = await Page.findOne({ slug }).lean();
    if (!page) return [];
    const sections = await Section.find({ page_id: page._id, type }).sort({ sort_order: 1 }).lean();
    return sections.map(s => {
        try { s.extra = JSON.parse(s.extra_json || '{}'); } catch { s.extra = {}; }
        s.id = s._id;
        return s;
    });
}

// ─── Home ────────────────────────────────────────────────
router.get('/', async (req, res) => {
    const data = await getPageData('home');
    const settings = await getSettings();

    const servicesSections = await getSectionsBySlugType('services', 'service');
    const deliverablesSections = await getSectionsBySlugType('services', 'deliverable');
    const processSections = await getSectionsBySlugType('process', 'process-step');
    const portfolioSections = (await getSectionsBySlugType('portfolio', 'portfolio')).filter(s => s.extra && s.extra.is_featured_home);
    const insightsSections = await getSectionsBySlugType('insights', 'insight');
    const faqSections = await getSectionsBySlugType('faq', 'faq');

    const featuredBlogs = await BlogPost.find({ status: 'published', is_featured: 1 })
        .sort({ published_at: -1 }).limit(3).lean();

    const homeSections = (await HomeSection.find().sort({ sort_order: 1 }).lean()).map(s => {
        try { s.config = JSON.parse(s.config_json || '{}'); } catch { s.config = {}; }
        s.id = s._id;
        return s;
    });

    res.render('pages/home', {
        ...data,
        settings,
        services: servicesSections,
        deliverables: deliverablesSections,
        processSteps: processSections,
        portfolio: portfolioSections,
        insights: insightsSections,
        faqs: faqSections,
        featuredBlogs,
        homeSections
    });
});

// ─── Services ────────────────────────────────────────────
router.get('/services', async (req, res) => {
    const data = await getPageData('services');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/services', { ...data, settings: await getSettings() });
});

// ─── Process ─────────────────────────────────────────────
router.get('/process', async (req, res) => {
    const data = await getPageData('process');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/process', { ...data, settings: await getSettings() });
});

// ─── Portfolio ───────────────────────────────────────────
router.get('/portfolio', async (req, res) => {
    const data = await getPageData('portfolio');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });

    const categories = await PortfolioCategory.find().sort({ sort_order: 1 }).lean();

    let ogVideo = null;
    const portfolioItems = (data.sections && data.sections.portfolio) || [];
    for (const item of portfolioItems) {
        const url = (item.extra && item.extra.youtube_url) || '';
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
        if (match) {
            ogVideo = {
                id: match[1], title: item.title, description: item.description,
                thumbnail: `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`,
                embedUrl: `https://www.youtube.com/embed/${match[1]}`,
                watchUrl: `https://www.youtube.com/watch?v=${match[1]}`
            };
            break;
        }
    }

    const categoryDescs = { all: data.page.hero_subtitle };
    categories.forEach(c => { categoryDescs[c.slug] = c.description; });
    const categoryDescsJson = JSON.stringify(categoryDescs);

    res.render('pages/portfolio', { ...data, settings: await getSettings(), ogVideo, categories, categoryDescsJson });
});

// ─── Insights ────────────────────────────────────────────
router.get('/insights', async (req, res) => {
    const data = await getPageData('insights');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/insights', { ...data, settings: await getSettings() });
});

// ─── FAQ ─────────────────────────────────────────────────
router.get('/faq', async (req, res) => {
    const data = await getPageData('faq');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/faq', { ...data, settings: await getSettings() });
});

// ─── Contact ─────────────────────────────────────────────
router.get('/contact', async (req, res) => {
    const data = await getPageData('contact');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/contact', { ...data, settings: await getSettings(), sent: req.query.sent });
});

router.post('/contact', async (req, res) => {
    const { name, email, company, message } = req.body;
    try {
        await ContactSubmission.create({ name: name || '', email: email || '', company: company || '', message: message || '' });
    } catch (err) { console.error('DB save error:', err.message); }
    try {
        const { sendContactEmail } = require('@xdotai/shared/backend/utils/mailer');
        await sendContactEmail({ name, email, company, message });
    } catch (err) { console.error('Email error:', err.message); }
    res.redirect('/contact?sent=1');
});

// ─── About Da Sachin ─────────────────────────────────────
router.get('/about-da-sachin', async (req, res) => {
    const data = await getPageData('about');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/about', { ...data, settings: await getSettings() });
});
router.get('/about', (req, res) => res.redirect(301, '/about-da-sachin'));

// ─── Trainings ───────────────────────────────────────────
router.get('/trainings', async (req, res) => {
    const data = await getPageData('trainings');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/trainings', { ...data, settings: await getSettings() });
});

// ─── Publications ────────────────────────────────────────
router.get('/publications', async (req, res) => {
    const data = await getPageData('publications');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/publications', { ...data, settings: await getSettings() });
});

// ─── Blog Listing ────────────────────────────────────────
router.get('/blogs', async (req, res) => {
    const data = await getPageData('blogs');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });

    const category = req.query.category || '';
    const page = parseInt(req.query.page) || 1;
    const perPage = 9;
    const skip = (page - 1) * perPage;

    const filter = { status: 'published' };
    if (category) filter.category = category;

    const posts = await BlogPost.find(filter).sort({ published_at: -1 }).skip(skip).limit(perPage).lean();
    const totalPosts = await BlogPost.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / perPage);
    const categories = await BlogCategory.find().sort({ sort_order: 1 }).lean();

    res.render('pages/blog', {
        ...data, settings: await getSettings(),
        posts, categories,
        currentCategory: category, currentPage: page,
        totalPages, totalPosts
    });
});

// ─── Individual Blog Post ────────────────────────────────
router.get('/blogs/:slug', async (req, res) => {
    const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!post) return res.status(404).render('pages/404', { title: 'Not Found' });

    let relatedPosts = await BlogPost.find({
        status: 'published', category: post.category || '', slug: { $ne: post.slug }
    }).sort({ published_at: -1 }).limit(3).lean();

    if (relatedPosts.length < 3) {
        const existingSlugs = [post.slug, ...relatedPosts.map(p => p.slug)];
        const morePosts = await BlogPost.find({
            status: 'published', slug: { $nin: existingSlugs }
        }).sort({ published_at: -1 }).limit(3 - relatedPosts.length).lean();
        relatedPosts.push(...morePosts);
    }

    res.render('pages/blog-post', {
        page: {
            title: post.meta_title || post.title,
            meta_description: post.meta_description || post.excerpt,
            og_image: post.og_image || post.featured_image
        },
        sections: [], post, relatedPosts, settings: await getSettings()
    });
});

// ─── Dynamic Sitemap ─────────────────────────────────────
router.get('/sitemap.xml', async (req, res) => {
    const baseUrl = 'https://xdotai.in';
    const pages = await Page.find().select('slug updated_at').lean();
    let posts = [];
    try { posts = await BlogPost.find({ status: 'published' }).select('slug updated_at').lean(); } catch { posts = []; }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    pages.forEach(p => {
        const loc = p.slug === 'home' ? '/' : `/${p.slug}`;
        const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `\n  <url>\n    <loc>${baseUrl}${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${p.slug === 'home' ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${p.slug === 'home' ? '1.0' : '0.8'}</priority>\n  </url>`;
    });

    posts.forEach(post => {
        const lastmod = post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `\n  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
    });

    xml += '\n</urlset>';
    res.set('Content-Type', 'application/xml');
    res.send(xml);
});

module.exports = router;
