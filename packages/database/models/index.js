const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─── Admin Users ─────────────────────────────────────────
const AdminUserSchema = new Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

// ─── Pages ───────────────────────────────────────────────
const PageSchema = new Schema({
    slug: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    meta_description: { type: String },
    hero_title: { type: String },
    hero_subtitle: { type: String },
    hero_label: { type: String },
    nav_order: { type: Number, default: 0 },
    is_visible: { type: Number, default: 1 },
    template: { type: String, default: 'default' },
    schema_type: { type: String, default: 'WebPage' },
    schema_json: { type: String },
    faq_json: { type: String, default: '[]' },
    page_blocks: { type: String, default: '[]' },
    updated_at: { type: Date, default: Date.now }
});

// ─── Sections ────────────────────────────────────────────
const SectionSchema = new Schema({
    page_id: { type: Schema.Types.ObjectId, ref: 'Page', required: true },
    type: { type: String, required: true },
    title: { type: String },
    description: { type: String },
    content_html: { type: String },
    image_url: { type: String },
    video_url: { type: String },
    icon: { type: String },
    icon_type: { type: String, default: 'emoji' },
    icon_image_url: { type: String },
    tag: { type: String },
    sort_order: { type: Number, default: 0 },
    extra_json: { type: String, default: '{}' }
});

// ─── Settings ────────────────────────────────────────────
const SettingSchema = new Schema({
    key: { type: String, unique: true, required: true },
    value: { type: String }
});

// ─── Portfolio Categories ────────────────────────────────
const PortfolioCategorySchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    description: { type: String },
    sort_order: { type: Number, default: 0 }
});

// ─── Media ───────────────────────────────────────────────
const MediaSchema = new Schema({
    filename: { type: String, required: true },
    original_name: { type: String },
    mime_type: { type: String },
    size: { type: Number },
    alt_text: { type: String },
    seo_title: { type: String },
    seo_caption: { type: String },
    uploaded_at: { type: Date, default: Date.now }
});

// ─── Hero Banners ────────────────────────────────────────
const HeroBannerSchema = new Schema({
    page_id: { type: Schema.Types.ObjectId, ref: 'Page' },
    image_url: { type: String, required: true },
    overlay_title: { type: String },
    overlay_subtitle: { type: String },
    overlay_position: { type: String, default: 'center' },
    sort_order: { type: Number, default: 0 },
    is_active: { type: Number, default: 1 },
    alt_text: { type: String },
    seo_title: { type: String }
});

// ─── Blog Posts ──────────────────────────────────────────
const BlogPostSchema = new Schema({
    title: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    excerpt: { type: String },
    content_html: { type: String },
    featured_image: { type: String },
    featured_image_alt: { type: String },
    category: { type: String },
    tags: { type: String },
    meta_title: { type: String },
    meta_description: { type: String },
    og_image: { type: String },
    reading_time: { type: Number },
    status: { type: String, default: 'draft' },
    is_featured: { type: Number, default: 0 },
    author: { type: String, default: 'Admin' },
    published_at: { type: Date },
    faq_json: { type: String, default: '[]' },
    updated_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
});

// ─── Blog Categories ─────────────────────────────────────
const BlogCategorySchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    description: { type: String },
    sort_order: { type: Number, default: 0 }
});

// ─── Navigation Links ────────────────────────────────────
const NavLinkSchema = new Schema({
    label: { type: String, required: true },
    url: { type: String, default: '/' },
    parent_id: { type: Schema.Types.ObjectId, ref: 'NavLink', default: null },
    sort_order: { type: Number, default: 0 },
    is_visible: { type: Number, default: 1 },
    open_new_tab: { type: Number, default: 0 }
});

// ─── Client Logos ────────────────────────────────────────
const ClientLogoSchema = new Schema({
    name: { type: String, required: true },
    image_url: { type: String },
    website_url: { type: String },
    sort_order: { type: Number, default: 0 },
    is_active: { type: Number, default: 1 }
});

// ─── Home Sections ───────────────────────────────────────
const HomeSectionSchema = new Schema({
    section_key: { type: String, unique: true, required: true },
    label: { type: String },
    heading: { type: String },
    subtitle: { type: String },
    sort_order: { type: Number, default: 0 },
    config_json: { type: String, default: '{}' },
    is_visible: { type: Number, default: 1 }
});

// ─── Contact Submissions ─────────────────────────────────
const ContactSubmissionSchema = new Schema({
    name: { type: String },
    email: { type: String },
    company: { type: String },
    message: { type: String },
    status: { type: String, default: 'new' },
    created_at: { type: Date, default: Date.now }
});

const models = {
    AdminUser: mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema),
    Page: mongoose.models.Page || mongoose.model('Page', PageSchema),
    Section: mongoose.models.Section || mongoose.model('Section', SectionSchema),
    Setting: mongoose.models.Setting || mongoose.model('Setting', SettingSchema),
    PortfolioCategory: mongoose.models.PortfolioCategory || mongoose.model('PortfolioCategory', PortfolioCategorySchema),
    Media: mongoose.models.Media || mongoose.model('Media', MediaSchema),
    HeroBanner: mongoose.models.HeroBanner || mongoose.model('HeroBanner', HeroBannerSchema),
    BlogPost: mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema),
    BlogCategory: mongoose.models.BlogCategory || mongoose.model('BlogCategory', BlogCategorySchema),
    NavLink: mongoose.models.NavLink || mongoose.model('NavLink', NavLinkSchema),
    ClientLogo: mongoose.models.ClientLogo || mongoose.model('ClientLogo', ClientLogoSchema),
    HomeSection: mongoose.models.HomeSection || mongoose.model('HomeSection', HomeSectionSchema),
    ContactSubmission: mongoose.models.ContactSubmission || mongoose.model('ContactSubmission', ContactSubmissionSchema)
};

module.exports = models;
