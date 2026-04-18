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
