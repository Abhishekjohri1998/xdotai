/* ============================================
   X DOT AI — Immersive Interactive JavaScript
   Apple-Inspired Scroll & Motion System
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // =============================================
  // PAGE LOADER
  // =============================================
  const pageLoader = document.getElementById('pageLoader');
  window.addEventListener('load', () => {
    setTimeout(() => pageLoader.classList.add('loaded'), 400);
  });

  // =============================================
  // PARTICLE CONSTELLATION BACKGROUND (Enhanced)
  // =============================================
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null, radius: 180 };
    let animationId;

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.6 + 0.08;
        this.baseOpacity = this.opacity;
        this.pulse = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += 0.01;
        this.opacity = this.baseOpacity + Math.sin(this.pulse) * 0.1;

        // Mouse repulsion
        if (mouse.x !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= dx * force * 0.03;
            this.y -= dy * force * 0.03;
          }
        }

        // Wrap around
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${this.opacity})`;
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 6000), 200);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const opacity = (1 - dist / 140) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124, 58, 237, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      animationId = requestAnimationFrame(animateParticles);
    }

    resizeCanvas();
    initParticles();
    animateParticles();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
        initParticles();
      }, 200);
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });
  }


  // =============================================
  // TYPEWRITER EFFECT
  // =============================================
  const typewriterEl = document.getElementById('typewriterText');
  if (typewriterEl) {
    const phrases = [
      'AI-Powered Films',
      'Creative AI Content',
      'AI Training Workshops',
      'Music Videos with AI',
      'Brand Experiences',
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 80;

    function typewrite() {
      const current = phrases[phraseIndex];

      if (isDeleting) {
        typewriterEl.textContent = current.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 40;
      } else {
        typewriterEl.textContent = current.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 80;
      }

      if (!isDeleting && charIndex === current.length) {
        isDeleting = true;
        typeSpeed = 2000;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 400;
      }

      setTimeout(typewrite, typeSpeed);
    }

    setTimeout(typewrite, 1000);
  }


  // =============================================
  // NAVBAR SCROLL BEHAVIOR (Enhanced Glassmorphism)
  // =============================================
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;
  let ticking = false;

  function updateNavbar() {
    const currentScroll = window.scrollY;
    if (currentScroll > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  }, { passive: true });


  // =============================================
  // MOBILE NAV TOGGLE
  // =============================================
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');

  function toggleNav() {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
    navOverlay.classList.toggle('visible');
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  navToggle.addEventListener('click', toggleNav);
  navOverlay.addEventListener('click', toggleNav);

  navLinks.querySelectorAll('a:not(.nav-dropdown-toggle)').forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        toggleNav();
      }
    });
  });

  document.querySelectorAll('.nav-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const dropdown = toggle.closest('.nav-dropdown');
        document.querySelectorAll('.nav-dropdown').forEach(d => {
          if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open');
      }
    });
  });


  // =============================================
  // 🍎 IMMERSIVE SCROLL ANIMATION SYSTEM
  // =============================================
  // data-animate based system with multiple animation types
  const animateElements = document.querySelectorAll('[data-animate]');

  const animateObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        animateObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  animateElements.forEach(el => animateObserver.observe(el));

  // Legacy reveal support (keep for existing elements)
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.01,
    rootMargin: '0px 0px 50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  // =============================================
  // PARALLAX SCROLL EFFECTS
  // =============================================
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  function updateParallax() {
    const scrollY = window.scrollY;
    parallaxElements.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.1;
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const offset = (centerY - viewportCenter) * speed;
      el.style.transform = `translateY(${offset}px)`;
    });
  }

  if (parallaxElements.length > 0) {
    let parallaxTicking = false;
    window.addEventListener('scroll', () => {
      if (!parallaxTicking) {
        requestAnimationFrame(() => {
          updateParallax();
          parallaxTicking = false;
        });
        parallaxTicking = true;
      }
    }, { passive: true });
  }


  // =============================================
  // MAGNETIC BUTTON EFFECT
  // =============================================
  const magneticButtons = document.querySelectorAll('.btn-magnetic, .hero-buttons .btn');

  magneticButtons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      setTimeout(() => { btn.style.transition = ''; }, 400);
    });
  });


  // =============================================
  // ANIMATED NUMBER COUNTERS (Enhanced easing)
  // =============================================
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  let countersStarted = false;

  function animateCounters() {
    statNumbers.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      const duration = 2500;
      const startTime = performance.now();

      function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Apple-style ease-out expo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.floor(eased * target);

        counter.textContent = current.toLocaleString() + '+';

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      }

      requestAnimationFrame(updateCounter);
    });
  }

  const statsGrid = document.getElementById('statsGrid');
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersStarted) {
        countersStarted = true;
        animateCounters();
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  if (statsGrid) statsObserver.observe(statsGrid);


  // =============================================
  // FAQ ACCORDION
  // =============================================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const content = item.querySelector('.faq-answer-content');

    btn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          other.querySelector('.faq-answer').style.maxHeight = '0';
        }
      });

      if (isActive) {
        item.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = '0';
      } else {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });


  // =============================================
  // FOOTER DYNAMIC TAGLINE
  // =============================================
  const dynamicWord = document.getElementById('dynamicWord');
  const words = ['Creativity', 'Branding', 'Innovation', 'Fashion', 'Storytelling', 'X'];
  let wordIndex = 0;

  function rotateDynamicWord() {
    dynamicWord.style.opacity = '0';
    dynamicWord.style.transform = 'translateY(-8px)';

    setTimeout(() => {
      wordIndex = (wordIndex + 1) % words.length;
      dynamicWord.textContent = words[wordIndex];
      dynamicWord.style.opacity = '1';
      dynamicWord.style.transform = 'translateY(0)';
    }, 300);
  }

  if (dynamicWord) {
    dynamicWord.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    dynamicWord.style.display = 'inline-block';
    setInterval(rotateDynamicWord, 3000);
  }


  // =============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // =============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navHeight = navbar.offsetHeight;
        const position = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: position, behavior: 'smooth' });
      }
    });
  });


  // =============================================
  // FORM HANDLER (CTA)
  // =============================================
  const ctaForm = document.getElementById('ctaForm');
  if (ctaForm) {
    ctaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = ctaForm.querySelector('input[type="email"]');
      const email = emailInput.value;
      const btn = ctaForm.querySelector('button');
      const originalText = btn.innerHTML;

      if (!email) return;

      btn.innerHTML = '⏳ Subscribing...';
      btn.style.pointerEvents = 'none';

      try {
        // Submit to Beehiiv
        const formData = new FormData();
        formData.append('email', email);
        formData.append('sent_from_orchid', 'true');
        formData.append('double_opt', 'false');
        formData.append('trigger_redirect', 'false');

        const resp = await fetch('https://xdotai.beehiiv.com/create', {
          method: 'POST',
          body: formData,
          mode: 'no-cors'
        });

        // no-cors means we can't read the response, but the subscription goes through
        btn.innerHTML = '✓ Subscribed!';
        btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        ctaForm.reset();
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.pointerEvents = '';
          btn.style.background = '';
        }, 3000);
      } catch (err) {
        btn.innerHTML = '✗ Try again';
        btn.style.background = 'linear-gradient(135deg, #dc2626, #ef4444)';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.pointerEvents = '';
          btn.style.background = '';
        }, 3000);
      }
    });
  }


  // =============================================
  // SCROLL PROGRESS INDICATOR (subtle)
  // =============================================
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: fixed; top: 0; left: 0; height: 2px; z-index: 10000;
    background: linear-gradient(90deg, #7c3aed, #a78bfa, #c084fc);
    transition: width 0.1s linear; width: 0%; pointer-events: none;
    box-shadow: 0 0 10px rgba(124, 58, 237, 0.5);
  `;
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (window.scrollY / scrollHeight) * 100;
    progressBar.style.width = progress + '%';
  }, { passive: true });

});
