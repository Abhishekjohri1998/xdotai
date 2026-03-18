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
        homeSections,
        seo: {
            keywords: 'AI creative agency, generative AI, AI films, AI ad films, AI music videos, AI marketing, Da Sachin Sharma, X DOT AI, creative AI consultant, AI video production',
            ai_summary: 'X DOT AI is an AI creative agency founded by Da Sachin Sharma that helps brands, agencies, and teams scale creativity using generative AI — offering AI films, music videos, marketing systems, trainings, and consulting.',
            ai_topics: 'generative AI, AI filmmaking, AI music production, creative AI consulting, AI marketing automation, prompt engineering',
            ai_entity_type: 'Organization',
            breadcrumbs: [{ name: 'Home', url: '/' }]
        }
    });
});

// ─── Services ────────────────────────────────────────────
router.get('/services', async (req, res) => {
    const data = await getPageData('services');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/services', { ...data, settings: await getSettings(), seo: {
        keywords: 'AI services, AI creative services, AI filmmaking service, AI marketing service, AI strategy, AI consulting, generative AI solutions',
        ai_summary: 'X DOT AI offers AI-powered creative services including AI films, music videos, marketing systems, strategy consulting, and rapid prototyping for brands and agencies.',
        ai_topics: 'AI services, AI creative production, AI consulting, AI marketing systems',
        ai_entity_type: 'Service',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }]
    }});
});

// ─── Process ─────────────────────────────────────────────
router.get('/process', async (req, res) => {
    const data = await getPageData('process');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/process', { ...data, settings: await getSettings(), seo: {
        keywords: 'AI creative process, AI workflow, empathize ideate evolve, creative AI methodology, AI production workflow',
        ai_summary: 'The X DOT AI creative process follows an Empathize-Ideate-Evolve methodology to deliver structured, scalable AI-powered creative solutions.',
        ai_topics: 'AI workflow, creative process, design thinking, AI methodology',
        ai_entity_type: 'HowTo',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Process', url: '/process' }]
    }});
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
                thumbnail: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`,
                embedUrl: `https://www.youtube.com/embed/${match[1]}`,
                watchUrl: `https://www.youtube.com/watch?v=${match[1]}`
            };
            break;
        }
    }

    const categoryDescs = { all: data.page.hero_subtitle };
    categories.forEach(c => { categoryDescs[c.slug] = c.description; });
    const categoryDescsJson = JSON.stringify(categoryDescs);

    res.render('pages/portfolio', { ...data, settings: await getSettings(), ogVideo, categories, categoryDescsJson, seo: {
        keywords: 'AI portfolio, AI ad films, AI music videos, AI generated content, AI video production, generative AI projects, Da Sachin Sharma portfolio',
        ai_summary: 'Portfolio of AI-generated creative work by Da Sachin Sharma and X DOT AI — including AI ad films, AI music videos, AI-generated music, and live production projects.',
        ai_topics: 'AI video portfolio, AI music video, AI ad film, generative AI content, AI creative production',
        ai_entity_type: 'CollectionPage',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Portfolio', url: '/portfolio' }]
    }});
});

// ─── Insights ────────────────────────────────────────────
router.get('/insights', async (req, res) => {
    const data = await getPageData('insights');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/insights', { ...data, settings: await getSettings(), seo: {
        keywords: 'AI insights, AI research, AI weekly, generative AI trends, AI industry analysis, creative AI perspectives',
        ai_summary: 'Research, guides, and perspectives on AI in creative industries — covering generative AI trends, prompt engineering, AI video production, and marketing automation.',
        ai_topics: 'AI research, AI trends, prompt engineering, AI marketing, AI video production',
        ai_entity_type: 'CollectionPage',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Insights', url: '/insights' }]
    }});
});

// ─── FAQ ─────────────────────────────────────────────────
router.get('/faq', async (req, res) => {
    const data = await getPageData('faq');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/faq', { ...data, settings: await getSettings(), seo: {
        keywords: 'AI FAQ, generative AI questions, AI creative agency FAQ, X DOT AI FAQ, AI consulting questions',
        ai_summary: 'Frequently asked questions about X DOT AI services, generative AI consulting, AI creative production, and working with Da Sachin Sharma.',
        ai_topics: 'AI FAQ, generative AI, AI consulting, AI creative production',
        ai_entity_type: 'FAQPage',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'FAQ', url: '/faq' }]
    }});
});

// ─── Contact ─────────────────────────────────────────────
router.get('/contact', async (req, res) => {
    const data = await getPageData('contact');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/contact', { ...data, settings: await getSettings(), sent: req.query.sent, seo: {
        keywords: 'contact AI agency, contact Da Sachin Sharma, AI consulting contact, X DOT AI contact, hire AI consultant',
        ai_summary: 'Get in touch with X DOT AI and Da Sachin Sharma for AI creative consulting, training, and production services.',
        ai_topics: 'contact, AI consulting, AI agency',
        ai_entity_type: 'ContactPage',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Contact', url: '/contact' }]
    }});
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
    res.render('pages/about', { ...data, settings: await getSettings(), seo: {
        keywords: 'Da Sachin Sharma, AI creative mentor, generative AI expert, AI consultant India, AI author, Prompt DOT AI, Creativity DOT AI, AI trainer',
        ai_summary: 'Da Sachin Sharma is an AI creative mentor, author of Prompt DOT AI and Creativity DOT AI, and founder of X DOT AI — specializing in structured AI workflows for creative production, marketing, and storytelling.',
        ai_topics: 'Da Sachin Sharma, AI mentor, AI author, creative AI consultant, generative AI expert',
        ai_entity_type: 'ProfilePage',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'About Da Sachin', url: '/about-da-sachin' }]
    }});
});
router.get('/about', (req, res) => res.redirect(301, '/about-da-sachin'));

// ─── Tech DOT AI ─────────────────────────────────────────
router.get('/tech', async (req, res) => {
    const data = await getPageData('tech');
    if (!data) {
        // Fallback: create a minimal page object if not in DB yet
        const settings = await getSettings();
        return res.render('pages/tech', {
            page: { title: 'Tech DOT AI', slug: 'tech', meta_description: 'AI Systems, Applications & Problem Solving by X DOT AI', hero_title: 'Tech DOT AI', hero_subtitle: 'AI Systems, Applications & Problem Solving' },
            sections: {}, pageBlocks: [], recentPosts: [], settings, seo: {
                keywords: 'AI applications, AI systems, AI development, agentic AI, AI web apps, AI workflow automation, AI problem solving, X DOT AI tech',
                ai_summary: 'Tech DOT AI by X DOT AI — building AI-powered applications, agentic systems, workflow automation, and intelligent web apps that solve real business challenges.',
                ai_topics: 'AI application development, agentic systems, AI workflow automation, AI web apps, AI problem solving',
                ai_entity_type: 'ServicePage',
                breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Tech DOT AI', url: '/tech' }]
            }
        });
    }
    res.render('pages/tech', { ...data, settings: await getSettings(), seo: {
        keywords: 'AI applications, AI systems, AI development, agentic AI, AI web apps, AI workflow automation, AI problem solving, X DOT AI tech',
        ai_summary: 'Tech DOT AI by X DOT AI — building AI-powered applications, agentic systems, workflow automation, and intelligent web apps that solve real business challenges.',
        ai_topics: 'AI application development, agentic systems, AI workflow automation, AI web apps, AI problem solving',
        ai_entity_type: 'ServicePage',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Tech DOT AI', url: '/tech' }]
    }});
});

// ─── Trainings ───────────────────────────────────────────
router.get('/trainings', async (req, res) => {
    const data = await getPageData('trainings');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/trainings', { ...data, settings: await getSettings(), seo: {
        keywords: 'AI training, generative AI workshop, AI course, AI certification, learn AI, AI training India, prompt engineering course, Da Sachin Sharma training',
        ai_summary: 'AI training programs and workshops by Da Sachin Sharma — covering generative AI, prompt engineering, AI filmmaking, and structured AI workflows for creative professionals and teams.',
        ai_topics: 'AI training, AI workshop, prompt engineering, generative AI course, AI education',
        ai_entity_type: 'Course',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'AI Trainings', url: '/trainings' }]
    }});
});

// ─── Publications ────────────────────────────────────────
router.get('/publications', async (req, res) => {
    const data = await getPageData('publications');
    if (!data) return res.status(404).render('pages/404', { title: 'Not Found' });
    res.render('pages/publications', { ...data, settings: await getSettings(), seo: {
        keywords: 'Prompt DOT AI book, Creativity DOT AI book, AI books, Da Sachin Sharma books, generative AI books, prompt engineering book, AI author India',
        ai_summary: 'Publications by Da Sachin Sharma — Prompt DOT AI (a guide to structured AI prompting) and Creativity DOT AI (exploring how creativity and AI work together). Available on Amazon.',
        ai_topics: 'AI books, Prompt DOT AI, Creativity DOT AI, prompt engineering, AI authorship',
        ai_entity_type: 'CollectionPage',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Publications', url: '/publications' }]
    }});
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
        totalPages, totalPosts,
        seo: {
            keywords: 'AI blog, creative AI articles, generative AI blog, AI insights, AI industry news, X DOT AI blog',
            ai_summary: 'Blog by X DOT AI — articles, guides, and perspectives on generative AI, creative technology, prompt engineering, and AI-powered content production.',
            ai_topics: 'AI blog, generative AI, creative technology, AI content',
            ai_entity_type: 'Blog',
            breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blogs' }]
        }
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
        sections: [], post, relatedPosts, settings: await getSettings(),
        seo: {
            keywords: (post.tags || []).join(', ') || 'AI blog, creative AI, generative AI, X DOT AI',
            ai_summary: post.excerpt || post.meta_description || '',
            ai_topics: 'AI blog, creative AI, generative AI',
            ai_entity_type: 'BlogPosting',
            breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blogs' }, { name: post.title, url: '/blogs/' + post.slug }]
        }
    });
});

// ─── Redirect: /blog → /blogs (prevent 404s) ────────────
router.get('/blog', (req, res) => res.redirect(301, '/blogs'));
router.get('/blog/:slug', (req, res) => res.redirect(301, '/blogs/' + req.params.slug));

// ─── Dynamic Sitemap ─────────────────────────────────────
router.get('/sitemap.xml', async (req, res) => {
    const baseUrl = 'https://xdotai.in';
    const pages = await Page.find().select('slug updated_at').lean();
    let posts = [];
    try { posts = await BlogPost.find({ status: 'published' }).select('slug updated_at').lean(); } catch { posts = []; }

    // Map DB slugs to actual canonical URLs
    const slugMap = { home: '/', about: '/about-da-sachin', blogs: '/blogs' };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    pages.forEach(p => {
        const loc = slugMap[p.slug] || `/${p.slug}`;
        const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `\n  <url>\n    <loc>${baseUrl}${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${p.slug === 'home' ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${p.slug === 'home' ? '1.0' : '0.8'}</priority>\n  </url>`;
    });

    posts.forEach(post => {
        const lastmod = post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `\n  <url>\n    <loc>${baseUrl}/blogs/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
    });

    xml += '\n</urlset>';
    res.set('Content-Type', 'application/xml');
    res.send(xml);
});

module.exports = router;
