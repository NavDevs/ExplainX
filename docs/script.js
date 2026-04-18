// Mobile menu toggle
function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('active');
  }
}

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.remove('active');
  });
});

// Theme toggle - movable
const themeBtn = document.querySelector('.theme-toggle');
if (themeBtn) {
  let isDragging = false;
  let offsetX, offsetY;

  themeBtn.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = themeBtn.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    themeBtn.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    themeBtn.style.left = x + 'px';
    themeBtn.style.top = y + 'px';
  });

  document.addEventListener('mouseup', () => isDragging = false);
}

// Make logo movable
const logoImg = document.querySelector('.logo-img');
if (logoImg) {
  let logoDragging = false;
  let logoOffsetX, logoOffsetY;

  logoImg.addEventListener('mousedown', (e) => {
    logoDragging = true;
    const rect = logoImg.getBoundingClientRect();
    logoOffsetX = e.clientX - rect.left;
    logoOffsetY = e.clientY - rect.top;
    logoImg.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!logoDragging) return;
    const x = e.clientX - logoOffsetX;
    const y = e.clientY - logoOffsetY;
    logoImg.style.position = 'absolute';
    logoImg.style.left = x + 'px';
    logoImg.style.top = y + 'px';
    logoImg.style.zIndex = '9999';
  });

  document.addEventListener('mouseup', () => {
    logoDragging = false;
    logoImg.style.cursor = 'grab';
  });
}

// Make browser mockup movable
const mockup = document.querySelector('.browser-mockup');
if (mockup) {
  mockup.style.cursor = 'grab';
  let mockDrag = false, offX, offY;

  mockup.addEventListener('mousedown', (e) => {
    mockDrag = true;
    const r = mockup.getBoundingClientRect();
    offX = e.clientX - r.left;
    offY = e.clientY - r.top;
    mockup.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!mockDrag) return;
    mockup.style.position = 'fixed';
    mockup.style.left = (e.clientX - offX) + 'px';
    mockup.style.top = (e.clientY - offY) + 'px';
    mockup.style.zIndex = '9998';
  });

  document.addEventListener('mouseup', () => {
    mockDrag = false;
    mockup.style.cursor = 'grab';
  });
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// Default to dark mode
document.body.classList.add('dark');
localStorage.setItem('theme', 'dark');
const btn = document.querySelector('.theme-toggle');
if (btn) btn.textContent = '☀️';

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Modal functions
function copyInstallInstructions() {
  const modal = document.getElementById('install-modal');
  modal.style.display = 'block';
}

function closeModal() {
  const modal = document.getElementById('install-modal');
  modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('install-modal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }
}

// Add scroll effect to navbar
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
  } else {
    navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
  }
  
  lastScroll = currentScroll;
});

// Animate elements on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe feature cards and steps
document.querySelectorAll('.feature-card, .step, .faq-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// Add animation to stats on hero load
window.addEventListener('load', () => {
  const stats = document.querySelectorAll('.stat-number');
  stats.forEach((stat, index) => {
    setTimeout(() => {
      stat.style.opacity = '1';
      stat.style.transform = 'scale(1)';
    }, index * 200);
  });
});

// Initialize stats animation
document.querySelectorAll('.stat-number').forEach(stat => {
  stat.style.opacity = '0';
  stat.style.transform = 'scale(0.8)';
  stat.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});
