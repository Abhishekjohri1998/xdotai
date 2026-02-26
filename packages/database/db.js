const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const models = require('./models/index');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://abhishekjohri659_db_user:EhVc42jcN2bjVKyv@cluster0.a2n4jqk.mongodb.net/xdotai?retryWrites=true&w=majority';

let connected = false;

async function connectDB() {
  if (connected) return;
  try {
    await mongoose.connect(MONGO_URI);
    connected = true;
    console.log('✅ Connected to MongoDB Atlas');
    await seedDatabase();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

async function seedDatabase() {
  const { AdminUser, Page, Section, Setting, PortfolioCategory, BlogCategory, NavLink, ClientLogo, HomeSection } = models;

  // Check if already seeded
  const adminCount = await AdminUser.countDocuments();
  if (adminCount > 0) return;

  console.log('🌱 Seeding database...');

  // Admin user
  const hashedPassword = bcrypt.hashSync('xdotai2026', 10);
  await AdminUser.create({ username: 'admin', password: hashedPassword });

  // Site settings
  const settingsData = [
    { key: 'site_name', value: 'X DOT AI' },
    { key: 'site_tagline', value: 'Where X Is Variable' },
    { key: 'stat_projects', value: '50' },
    { key: 'stat_clients', value: '30' },
    { key: 'stat_workshops', value: '100' },
    { key: 'stat_trained', value: '5000' },
  ];
  await Setting.insertMany(settingsData);

  // Pages
  const pagesData = [
    { slug: 'home', title: 'X DOT AI — AI Creative Agency | AI-Powered Content, Films & Training', meta_description: 'X DOT AI is a leading AI creative agency delivering AI-powered ad films, music videos, content production, and hands-on AI training workshops.', hero_title: 'We Build<br><span class="typewriter-text" id="typewriterText">AI-Powered Films</span><span class="typewriter-cursor"></span>', hero_subtitle: 'We empower brands, agencies, and teams to scale creativity using AI — delivering generative AI content, ad films, music videos, and hands-on training workshops.', hero_label: 'AI Creative Agency', nav_order: 0 },
    { slug: 'services', title: 'AI Services — X DOT AI | Training, Films, Research & Consulting', meta_description: "Explore X DOT AI's full range of AI creative services.", hero_title: 'AI-First Creative <span class="text-gradient">Services</span>', hero_subtitle: 'From training workshops to full-scale AI content production, we bridge the gap between cutting-edge AI technology and creative excellence.', hero_label: 'What We Do', nav_order: 10 },
    { slug: 'process', title: 'Our Process — X DOT AI | Empathize, Ideate, Evolve', meta_description: "Discover X DOT AI's proven three-stage methodology.", hero_title: 'Our <span class="text-gradient">Process</span>', hero_subtitle: 'A proven three-stage methodology that blends human creativity with AI precision.', hero_label: 'How It Works', nav_order: 11 },
    { slug: 'portfolio', title: 'AI Creative Portfolio – AI Ad Films, Music Videos & Generative Content', meta_description: 'This AI creative portfolio showcases AI ad films, AI music videos, and generative AI content.', hero_title: 'Featured <span class="text-gradient">Projects</span>', hero_subtitle: 'This AI creative portfolio showcases AI ad films, AI music videos, and generative AI content created by X DOT AI.', hero_label: 'Our Work', nav_order: 2 },
    { slug: 'insights', title: 'AI Insights — X DOT AI | Research, Guides & Perspectives', meta_description: "Read X DOT AI's latest thinking on generative AI.", hero_title: 'Latest <span class="text-gradient">Thinking</span>', hero_subtitle: 'Research, perspectives, and practical guides on harnessing generative AI for creative work.', hero_label: 'AI Insights', nav_order: 4 },
    { slug: 'faq', title: 'FAQ — X DOT AI | Common Questions About AI Creative Services', meta_description: 'Everything you need to know about working with X DOT AI.', hero_title: 'Common <span class="text-gradient">Questions</span>', hero_subtitle: 'Everything you need to know about working with an AI creative agency.', hero_label: 'FAQ', nav_order: 12 },
    { slug: 'contact', title: 'Contact — X DOT AI | Start Your AI Creative Project', meta_description: 'Get in touch with X DOT AI.', hero_title: 'Let\'s <span class="text-gradient">Connect</span>', hero_subtitle: 'Ready to harness the power of AI for your creative projects? We\'d love to hear from you.', hero_label: 'Get In Touch', nav_order: 6 },
    { slug: 'about', title: 'Da Sachin Sharma – AI Creative Mentor & Generative AI Expert | X DOT AI', meta_description: 'Da Sachin Sharma is an AI creative mentor and generative AI expert.', hero_title: 'About <span class="text-gradient">Da Sachin Sharma</span>', hero_subtitle: 'AI Creative Mentor & Generative AI Expert — empowering brands, teams, and creators.', hero_label: 'About', nav_order: 1 },
    { slug: 'trainings', title: 'AI Trainings — X DOT AI | Learn AI, Upgrade Your Future', meta_description: 'Hands-on AI training workshops by X DOT AI.', hero_title: 'Learn AI. <span class="text-gradient">Upgrade Your Future.</span>', hero_subtitle: 'From ChatGPT to MidJourney, from AI ad films to content strategies — master the tools shaping the future.', hero_label: 'AI Trainings', nav_order: 3 },
    { slug: 'publications', title: 'AI Books by Da Sachin Sharma', meta_description: 'Discover books on AI, creativity, and generative content by Da Sachin Sharma.', hero_title: 'Ideas to Impact — <span class="text-gradient">One Page at a Time.</span>', hero_subtitle: 'From foundational AI fluency to advanced creative applications.', hero_label: 'Publications', nav_order: 5 },
    { slug: 'blogs', title: 'AI Blog — X DOT AI | Insights, Tutorials & Industry Updates', meta_description: 'Stay updated with the latest in AI creativity.', hero_title: 'AI <span class="text-gradient">Blog</span>', hero_subtitle: 'Expert insights, tutorials, and industry updates on generative AI.', hero_label: 'Blog', nav_order: 7, template: 'blog' },
  ];
  const pages = await Page.insertMany(pagesData);
  const pageMap = {};
  pages.forEach(p => { pageMap[p.slug] = p._id; });

  // Sections — Services
  const sectionsList = [
    { page_id: pageMap.services, type: 'service', title: 'AI Trainings', description: 'Hands-on workshops for corporate teams, agencies, and educators covering generative AI tools, prompt engineering, and AI-powered content workflows.', icon: '🎓', sort_order: 1 },
    { page_id: pageMap.services, type: 'service', title: 'AI Films', description: 'End-to-end production of ad films and music videos using cutting-edge generative AI.', icon: '🎬', sort_order: 2 },
    { page_id: pageMap.services, type: 'service', title: 'AI Research', description: 'Bridging the gap between AI technology and practical industry applications through research.', icon: '🔬', sort_order: 3 },
    { page_id: pageMap.services, type: 'service', title: 'AI Consulting', description: 'Strategic advisory to help organizations integrate generative AI into existing creative workflows.', icon: '💡', sort_order: 4 },
    { page_id: pageMap.services, type: 'deliverable', title: 'Ad Films', description: 'TV & digital commercials', icon: '🎥', sort_order: 1, extra_json: '{"gradient":"rgba(239,68,68,0.15)"}' },
    { page_id: pageMap.services, type: 'deliverable', title: 'Music Videos', description: 'AI-generated visual storytelling', icon: '🎵', sort_order: 2, extra_json: '{"gradient":"rgba(59,130,246,0.15)"}' },
    { page_id: pageMap.services, type: 'deliverable', title: 'Social Content', description: 'Reels, shorts & stories', icon: '📱', sort_order: 3, extra_json: '{"gradient":"rgba(16,185,129,0.15)"}' },
    { page_id: pageMap.services, type: 'deliverable', title: 'Product Videos', description: 'E-commerce & launches', icon: '📦', sort_order: 4, extra_json: '{"gradient":"rgba(245,158,11,0.15)"}' },
    { page_id: pageMap.services, type: 'deliverable', title: 'Brand Imagery', description: 'AI-generated visuals & assets', icon: '🖼️', sort_order: 5, extra_json: '{"gradient":"rgba(168,85,247,0.15)"}' },
    { page_id: pageMap.services, type: 'deliverable', title: 'SEO Content', description: 'AI-optimized meta & copy', icon: '✍️', sort_order: 6, extra_json: '{"gradient":"rgba(236,72,153,0.15)"}' },
    // Process
    { page_id: pageMap.process, type: 'process-step', title: 'Empathize & Define', description: 'We deep-dive into your brand, audience, and objectives.', sort_order: 1, extra_json: '{"step":"01"}' },
    { page_id: pageMap.process, type: 'process-step', title: 'Ideate & Create', description: 'Our creative team crafts concepts and leverages generative AI tools.', sort_order: 2, extra_json: '{"step":"02"}' },
    { page_id: pageMap.process, type: 'process-step', title: 'Test & Evolve', description: 'We refine outputs through feedback loops, A/B testing, and performance analysis.', sort_order: 3, extra_json: '{"step":"03"}' },
    // Portfolio — all 25
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Wishing Everyone A Merry Christmas! Zee TV', description: 'AI-powered festive campaign for Zee TV', tag: 'AI Ad Film', sort_order: 1, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=H48FCzlDBF0"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'GEN Z ANTHEM ⚡', description: 'AI-generated anthem capturing the voice of Gen Z for Saregama', tag: 'AI Ad Film', sort_order: 2, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=q_UUK-IWUi4"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'ACwO DwOTS Sense — The Perfect Fit', description: 'AI-produced product film for ACwO DwOTS', tag: 'AI Ad Film', sort_order: 3, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=0BcDXERWNWA"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Smart Play | ZEE5', description: 'AI-crafted promotional content for ZEE5', tag: 'AI Ad Film', sort_order: 4, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=oJVSnOI0anI"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Daadi ki Diwali Kahaniyan', description: 'AI-generated Diwali special', tag: 'AI Ad Film', sort_order: 5, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=3D1oyBP3wYM"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Zee Rishton Ka Mela — New Year 2026', description: 'AI-produced New Year celebration promo', tag: 'AI Ad Film', sort_order: 6, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=0OawJwnxiUc"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Happy Teacher\'s Day!', description: 'AI-crafted emotional storytelling', tag: 'AI Ad Film', sort_order: 7, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=Cg116ZNIu0U"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Veg KFC in Ayodhya!', description: 'Creative AI concept ad', tag: 'AI Ad Film', sort_order: 8, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=3-RTQHFWLIk"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Judwa Ka Biggest Twist! ACwO DwOTS Fire', description: 'AI-generated dramatic product reveal', tag: 'AI Ad Film', sort_order: 9, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=1Qs3U7GIt5A"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'World TV Day Special', description: 'AI-crafted World TV Day special', tag: 'AI Ad Film', sort_order: 10, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=-XYbmeUAylM"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'LolZ | ZEE5', description: 'AI-produced comedy promo', tag: 'AI Ad Film', sort_order: 11, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=7cZIad7uzcI"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Bal Vivah | AI Film | Mobilla', description: 'AI-generated awareness film on child marriage', tag: 'AI Ad Film', sort_order: 12, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=gE2pGGrYUbo"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Bhartiya Bhasha Diwas | ZEE5', description: 'AI-crafted celebration of Indian languages', tag: 'AI Ad Film', sort_order: 13, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=aZdAHUl66z0"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Thar ROXX AI Ad', description: 'AI-generated automotive ad for Mahindra Thar', tag: 'AI Ad Film', sort_order: 14, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=RWiQ2aWEd8o"}' },
    // Music Videos
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Tujhse Naraz Nahin Zindagi', description: 'AI-reimagined classic from Masoom', tag: 'AI Music Video', sort_order: 15, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=tHK7f4VpJ48"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Itna Na Mujhse Tu Pyar Badha', description: 'AI-visualized Lata Mangeshkar melody', tag: 'AI Music Video', sort_order: 16, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=58-WL_7oia8"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Mann Ki Lagan | Rahat Fateh Ali Khan', description: 'AI-generated music video', tag: 'AI Music Video', sort_order: 17, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=zOPZJMzy5L4"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Yeh Sham Mastani | Kishore Kumar', description: 'AI-reimagined classic', tag: 'AI Music Video', sort_order: 18, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=Ypyekxaj3gw"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Pyar Hua Iqrar Hua | Shree 420', description: 'AI-visualized iconic duet', tag: 'AI Music Video', sort_order: 19, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=ydgapb13HEE"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Taarif Karoon Kya Uski | Kashmir Ki Kali', description: 'AI-generated visuals for the classic', tag: 'AI Music Video', sort_order: 20, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=KS47iigndQM"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Jooma Chumma De De | Hum', description: 'AI-reimagined energetic hit', tag: 'AI Music Video', sort_order: 21, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=8hc3EJSClB8"}' },
    // AI Generated Music
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Ruk Ja — Rumi ft. Ira', description: 'Original AI-generated Hindi song', tag: 'AI Generated Music', sort_order: 22, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=oGliS-LTe8s"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Zindagi | Rumi', description: 'AI-composed original track', tag: 'AI Generated Music', sort_order: 23, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=SFlaK5DJxkg"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Teri Yaad — Rumi & DA Sachin', description: 'Original AI-generated heartbreak song', tag: 'AI Generated Music', sort_order: 24, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=uiw_O4gYBhg"}' },
    { page_id: pageMap.portfolio, type: 'portfolio', title: 'Musafir — Rumi', description: 'AI-composed journey song', tag: 'AI Generated Music', sort_order: 25, extra_json: '{"youtube_url":"https://www.youtube.com/watch?v=zp-XAbmpzO8"}' },
    // Insights
    { page_id: pageMap.insights, type: 'insight', title: 'The State of AI Video Generation in 2026', description: 'From Sora to Veo 3 — how the latest AI video models are transforming commercial content production.', icon: '🤖', tag: 'AI Weekly', sort_order: 1, extra_json: '{"date":"Feb 15, 2026"}' },
    { page_id: pageMap.insights, type: 'insight', title: 'Prompt Engineering for Visual Content', description: 'A practical framework for crafting effective prompts.', icon: '💡', tag: 'Guide', sort_order: 2, extra_json: '{"date":"Feb 8, 2026","gradient":"linear-gradient(135deg, var(--bg-secondary), #16a34a)"}' },
    { page_id: pageMap.insights, type: 'insight', title: 'AI ROI: Measuring Creative Impact', description: 'How to quantify the business value of AI-powered creative production.', icon: '📊', tag: 'Research', sort_order: 3, extra_json: '{"date":"Jan 28, 2026","gradient":"linear-gradient(135deg, var(--bg-secondary), #ea580c)"}' },
    // FAQ
    { page_id: pageMap.faq, type: 'faq', title: 'What is generative AI and how does X DOT AI use it?', description: 'Generative AI refers to artificial intelligence systems that can create new content — including images, videos, music, and text — from learned patterns. X DOT AI leverages leading generative AI tools to produce ad films, music videos, and branded content.', sort_order: 1 },
    { page_id: pageMap.faq, type: 'faq', title: "Who are X DOT AI's training workshops designed for?", description: 'Our AI training workshops are designed for corporate teams, creative agencies, marketing professionals, and educational institutions.', sort_order: 2 },
    { page_id: pageMap.faq, type: 'faq', title: 'How long does it take to produce an AI-generated ad film?', description: 'An AI-generated ad film can typically be produced in 5–10 working days, compared to 4–8 weeks for traditional production.', sort_order: 3 },
    { page_id: pageMap.faq, type: 'faq', title: 'What industries does X DOT AI serve?', description: 'X DOT AI serves technology, entertainment, music, fashion, FMCG, education, and healthcare.', sort_order: 4 },
    { page_id: pageMap.faq, type: 'faq', title: 'Can AI replace human creativity?', description: "AI doesn't replace human creativity — it amplifies it. Our human-led creative direction guides the AI tools.", sort_order: 5 },
    // About
    { page_id: pageMap.about, type: 'about-founder', title: 'Da Sachin Sharma', description: 'Da Sachin Sharma is an AI creative mentor and generative AI expert, guiding brands, teams, and creators in AI-powered music, films, storytelling, and content creation.', icon: '👨‍💼', tag: 'AI Creative Mentor & Founder', sort_order: 1 },
    { page_id: pageMap.about, type: 'about-achievement', title: 'Published Author', description: 'Author of Prompt DOT AI and Creativity DOT AI.', icon: '📖', sort_order: 1 },
    { page_id: pageMap.about, type: 'about-achievement', title: 'AI Content Director', description: 'Directed AI-powered ad films for leading brands including Zee TV, Zee5, SaReGaMa, and Mahindra.', icon: '🎬', sort_order: 2 },
    { page_id: pageMap.about, type: 'about-achievement', title: 'Corporate AI Trainer', description: 'Conducted 100+ AI training workshops for corporate teams.', icon: '🎓', sort_order: 3 },
    { page_id: pageMap.about, type: 'about-achievement', title: 'AI Music Pioneer', description: 'Creator of Rumi — an AI music project.', icon: '🎵', sort_order: 4 },
    { page_id: pageMap.about, type: 'about-value', title: 'Innovation First', description: 'We push the boundaries of what\'s possible with AI.', icon: '🚀', sort_order: 1 },
    { page_id: pageMap.about, type: 'about-value', title: 'Human-Led AI', description: 'Technology amplifies human creativity — it never replaces it.', icon: '🤝', sort_order: 2 },
    { page_id: pageMap.about, type: 'about-value', title: 'Results Driven', description: 'We measure success by impact.', icon: '📈', sort_order: 3 },
    { page_id: pageMap.about, type: 'about-value', title: 'Knowledge Sharing', description: 'We believe in democratizing AI knowledge.', icon: '📚', sort_order: 4 },
    // Trainings
    { page_id: pageMap.trainings, type: 'training-value', title: 'Learn by Doing', description: 'Practical exercises designed for individuals.', icon: '✨', sort_order: 1 },
    { page_id: pageMap.trainings, type: 'training-value', title: 'Adapted for You', description: 'Sessions match your pace and goals.', icon: '🎯', sort_order: 2 },
    { page_id: pageMap.trainings, type: 'training-value', title: 'Create Instantly', description: 'Generate content you can use right away.', icon: '⚡', sort_order: 3 },
    { page_id: pageMap.trainings, type: 'training-category', title: 'Fashion DOT AI', description: 'Master AI-driven fashion design.', icon: '👗', sort_order: 1 },
    { page_id: pageMap.trainings, type: 'training-category', title: 'Films DOT AI', description: 'Master AI in films and storytelling.', icon: '🎬', sort_order: 2 },
    { page_id: pageMap.trainings, type: 'training-category', title: 'Advertising DOT AI', description: 'Craft impactful campaigns with AI.', icon: '📢', sort_order: 3 },
    { page_id: pageMap.trainings, type: 'training-category', title: 'Marketing DOT AI', description: 'AI for digital marketing strategies.', icon: '📊', sort_order: 4 },
    { page_id: pageMap.trainings, type: 'training-faq', title: 'Do I need prior AI knowledge?', description: 'Not at all! Our trainings are designed for everyone.', sort_order: 1 },
    { page_id: pageMap.trainings, type: 'training-faq', title: 'What will I take away?', description: "You'll leave with hands-on experience using real AI tools and a portfolio of AI-generated content.", sort_order: 2 },
    // Publications
    { page_id: pageMap.publications, type: 'publication', title: 'Prompt DOT AI', description: 'The ultimate starter guide for anyone curious about AI.', icon: '📘', tag: 'Your playbook for AI fluency', sort_order: 1, extra_json: '{"key_takeaway":"Go from AI-curious to AI-confident.","buy_url":"https://www.amazon.in/dp/B0DJBQPWMT","image_url":"/images/prompt-dot-ai.jpg"}' },
    { page_id: pageMap.publications, type: 'publication', title: 'Creativity DOT AI', description: 'A guide for creators and marketers to integrate AI.', icon: '📕', tag: 'Where AI Meets Creativity', sort_order: 2, extra_json: '{"key_takeaway":"Build confidence in co-creating with AI.","buy_url":"https://www.amazon.in/dp/B0DRB6RQMM","image_url":"/images/creativity-dot-ai.jpg"}' },
  ];
  await Section.insertMany(sectionsList);

  // Portfolio categories
  await PortfolioCategory.insertMany([
    { name: 'AI Ad Film', slug: 'ai-ad-film', description: 'AI-powered advertising films.', sort_order: 1 },
    { name: 'AI Music Video', slug: 'ai-music-video', description: 'AI-powered music videos.', sort_order: 2 },
    { name: 'AI Generated Music', slug: 'ai-generated-music', description: 'AI-generated music and content.', sort_order: 3 },
  ]);

  // Blog categories
  await BlogCategory.insertMany([
    { name: 'AI Insights', slug: 'ai-insights', description: 'Deep dives into AI trends', sort_order: 1 },
    { name: 'Tutorials', slug: 'tutorials', description: 'Step-by-step AI guides', sort_order: 2 },
    { name: 'Industry News', slug: 'industry-news', description: 'Latest AI developments', sort_order: 3 },
    { name: 'Case Studies', slug: 'case-studies', description: 'Real-world AI projects', sort_order: 4 },
    { name: 'Creative AI', slug: 'creative-ai', description: 'AI in art, music, film', sort_order: 5 },
  ]);

  // Nav links
  const aboutNav = await NavLink.create({ label: 'About Da Sachin Sharma', url: '/about-da-sachin', sort_order: 1 });
  await NavLink.create({ label: 'Portfolio', url: '/portfolio', sort_order: 2 });
  const trainingsNav = await NavLink.create({ label: 'AI Trainings', url: '/trainings', sort_order: 3 });
  await NavLink.insertMany([
    { label: 'All Trainings', url: '/trainings', parent_id: trainingsNav._id, sort_order: 1 },
    { label: 'Our Services', url: '/services', parent_id: trainingsNav._id, sort_order: 2 },
    { label: 'Our Process', url: '/process', parent_id: trainingsNav._id, sort_order: 3 },
  ]);
  const insightsNav = await NavLink.create({ label: 'Insights', url: '/insights', sort_order: 4 });
  await NavLink.insertMany([
    { label: 'Blog', url: '/blogs', parent_id: insightsNav._id, sort_order: 1 },
    { label: 'AI Weekly', url: '/insights', parent_id: insightsNav._id, sort_order: 2 },
    { label: 'FAQ', url: '/faq', parent_id: insightsNav._id, sort_order: 3 },
  ]);
  await NavLink.create({ label: 'Publications', url: '/publications', sort_order: 5 });
  await NavLink.create({ label: 'Contact', url: '/contact', sort_order: 6 });

  // Client logos
  await ClientLogo.insertMany([
    { name: 'IIT Ropar', sort_order: 1 },
    { name: 'Saregama', sort_order: 2 },
    { name: 'EPAM', sort_order: 3 },
    { name: 'ACWO', sort_order: 4 },
    { name: 'Sony', sort_order: 5 },
    { name: 'LogiTrunk', sort_order: 6 },
  ]);

  // Home sections
  await HomeSection.insertMany([
    { section_key: 'hero', label: 'Hero Banner', sort_order: 1, config_json: JSON.stringify({ btn1_text: 'Start a Project', btn1_url: '/contact', btn2_text: 'View Our Work', btn2_url: '/portfolio' }) },
    { section_key: 'stats', label: 'Stats Bar', sort_order: 2, config_json: JSON.stringify({ stat1_value: '75', stat1_label: 'AI Projects Delivered', stat2_value: '30', stat2_label: 'Clients Served', stat3_value: '100', stat3_label: 'Workshops Delivered', stat4_value: '5000', stat4_label: 'Professionals Trained' }) },
    { section_key: 'partners', label: 'Trusted By / Logos', heading: 'Trusted by forward-thinking organizations', sort_order: 3 },
    { section_key: 'services', label: 'Services', heading: 'AI-First Creative <span class="text-gradient">Services</span>', subtitle: 'From training workshops to full-scale AI content production.', sort_order: 4, config_json: '{"label":"What We Do"}' },
    { section_key: 'deliverables', label: 'Deliverables', heading: 'What We <span class="text-gradient">Create</span>', subtitle: 'Every format, every platform.', sort_order: 5, config_json: '{"label":"Deliverables"}' },
    { section_key: 'process', label: 'Process', heading: 'Our <span class="text-gradient">Process</span>', subtitle: 'A proven three-stage methodology.', sort_order: 6, config_json: '{"label":"How It Works"}' },
    { section_key: 'portfolio', label: 'Portfolio', heading: 'Featured <span class="text-gradient">Projects</span>', subtitle: 'A showcase of AI-powered creative productions.', sort_order: 7, config_json: '{"label":"Our Work"}' },
    { section_key: 'insights', label: 'Insights', heading: 'Latest <span class="text-gradient">Thinking</span>', subtitle: 'Research, perspectives, and practical guides.', sort_order: 8, config_json: '{"label":"AI Insights"}' },
    { section_key: 'blog', label: 'Featured Blog', heading: 'Featured from our <span class="text-gradient">Blog</span>', subtitle: 'Expert insights and tutorials.', sort_order: 9, config_json: '{"label":"Blog"}' },
    { section_key: 'faq', label: 'FAQ', heading: 'Common <span class="text-gradient">Questions</span>', subtitle: 'Everything you need to know.', sort_order: 10, config_json: '{"label":"FAQ"}' },
    { section_key: 'cta', label: 'Call to Action', heading: 'Ready to <span class="text-gradient">Supercharge</span> Your Creativity?', subtitle: 'Join the brands already leveraging AI.', sort_order: 11, config_json: JSON.stringify({ btn_text: "Let's Talk", form_placeholder: 'Enter your email' }) },
  ]);

  console.log('✅ Database seeded successfully!');
}

module.exports = { connectDB, models };
