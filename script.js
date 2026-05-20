"use strict";
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const propertyGrid = document.getElementById('property-grid');
const loadingIndicator = document.getElementById('loading-indicator');
const noResults = document.getElementById('no-results');
const btnReset = document.getElementById('btn-reset');
const loginModal = document.getElementById('login-modal');
const modalClose = document.getElementById('modal-close');
const loginForm = document.getElementById('login-form');
const navTriggers = document.querySelectorAll('#nav-login, .nav-link--login');
const heroTags = document.querySelectorAll('.hero-tag');
const accordionHeaders = document.querySelectorAll('.accordion-header');
const btnBook = document.querySelector('.btn-book');
const hubTabs = document.querySelectorAll('.hub-tab');
const manageBtns = document.querySelectorAll('.btn-manage');
const landlordLinks = document.querySelectorAll('a[href="#list-property"]');
const mapModal = document.getElementById('map-modal');
const mapModalClose = document.getElementById('map-modal-close');
const phoneModal = document.getElementById('phone-modal');
const phoneModalClose = document.getElementById('phone-modal-close');
const chatWidget = document.getElementById('chat-widget');
const chatClose = document.getElementById('chat-close');
const chatInputForm = document.getElementById('chat-input-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const toastNotification = document.getElementById('toast-notification');
const toastText = toastNotification ? toastNotification.querySelector('.toast-text') : null;
const filterVerifiedBtn = document.getElementById('filter-verified-btn');
const filterMapBtn = document.getElementById('filter-map-btn');
const navMobileBtn = document.getElementById('nav-mobile-btn');
const chatLauncher = document.getElementById('chat-launcher');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('active'));
  });
}
const createParticles = () => {
  const container = document.getElementById('hero-particles');
  if (!container)
    return;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 6 + 3;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${Math.random() * 8 + 6}s`;
    p.style.animationDelay = `${Math.random() * 10}s`;
    fragment.appendChild(p);
  }
  container.appendChild(fragment);
};
createParticles();
const performSearch = (query) => {
  if (!propertyGrid || !loadingIndicator || !noResults)
    return;
  const cards = propertyGrid.querySelectorAll('.property-card');
  const trimmed = query.trim().toLowerCase();
  propertyGrid.style.display = 'none';
  noResults.classList.remove('active');
  loadingIndicator.classList.add('active');
  setTimeout(() => {
    loadingIndicator.classList.remove('active');
    if (trimmed === '') {
      cards.forEach(card => card.classList.remove('hidden'));
      propertyGrid.style.display = '';
      return;
    }
    let matchCount = 0;
    cards.forEach(card => {
      const location = card.getAttribute('data-location') || '';
      const titleEl = card.querySelector('.card-title');
      const descEl = card.querySelector('.card-description');
      const title = titleEl ? titleEl.textContent?.toLowerCase() || '' : '';
      const desc = descEl ? descEl.textContent?.toLowerCase() || '' : '';
      const matches = location.includes(trimmed) || title.includes(trimmed) || desc.includes(trimmed);
      card.classList.toggle('hidden', !matches);
      if (matches)
        matchCount++;
    });
    if (matchCount > 0) {
      propertyGrid.style.display = '';
    }
    else {
      noResults.classList.add('active');
    }
  }, 800);
};
if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', () => performSearch(searchInput.value));
}
if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')
      performSearch(searchInput.value);
  });
}
heroTags.forEach(tag => {
  tag.addEventListener('click', () => {
    const area = tag.getAttribute('data-area') || '';
    if (searchInput)
      searchInput.value = area;
    performSearch(area);
    const propertiesSection = document.getElementById('properties');
    if (propertiesSection) {
      propertiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
if (btnReset) {
  btnReset.addEventListener('click', () => {
    if (searchInput)
      searchInput.value = '';
    if (noResults)
      noResults.classList.remove('active');
    if (propertyGrid) {
      propertyGrid.querySelectorAll('.property-card').forEach(c => c.classList.remove('hidden'));
      propertyGrid.style.display = '';
    }
  });
}
const closeModal = () => {
  if (loginModal) {
    loginModal.classList.remove('active');
    document.body.style.overflow = '';
  }
};
navTriggers.forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    if (loginModal) {
      loginModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });
});
if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}
if (loginModal) {
  loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal)
      closeModal();
  });
}
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    closeModal();
  });
}
accordionHeaders.forEach(header => {
  header.addEventListener('click', () => {
    const item = header.parentElement;
    if (item) {
      item.classList.toggle('active');
    }
    accordionHeaders.forEach(other => {
      if (other !== header && other.parentElement) {
        other.parentElement.classList.remove('active');
      }
    });
  });
});
if (btnBook && loginModal) {
  btnBook.addEventListener('click', () => {
    loginModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}
hubTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    hubTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});
manageBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    alert('Management options for this property will be available soon.');
  });
});
landlordLinks.forEach(link => {
  link.setAttribute('href', 'landlord-hub.html');
});
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = entry.target;
      target.style.opacity = '1';
      target.style.transform = 'translateY(0)';
      observer.unobserve(target);
    }
  });
}, observerOptions);
document.querySelectorAll('.property-card').forEach((card, i) => {
  const htmlCard = card;
  htmlCard.style.opacity = '0';
  htmlCard.style.transform = 'translateY(30px)';
  htmlCard.style.transition = `opacity .5s ease ${i * .08}s, transform .5s ease ${i * .08}s`;
  observer.observe(htmlCard);
});
const showToast = (message) => {
  if (!toastNotification || !toastText)
    return;
  toastText.textContent = message;
  toastNotification.classList.add('active');
  setTimeout(() => {
    toastNotification.classList.remove('active');
  }, 3000);
};
let verifiedOnlyActive = false;
if (filterVerifiedBtn) {
  filterVerifiedBtn.addEventListener('click', () => {
    if (!propertyGrid)
      return;
    const cards = propertyGrid.querySelectorAll('.property-card');
    verifiedOnlyActive = !verifiedOnlyActive;
    filterVerifiedBtn.classList.toggle('active', verifiedOnlyActive);
    let matchCount = 0;
    cards.forEach(card => {
      const isVerified = card.getAttribute('data-verified') === 'true';
      if (verifiedOnlyActive) {
        card.classList.toggle('hidden', !isVerified);
        if (isVerified)
          matchCount++;
      }
      else {
        card.classList.remove('hidden');
        matchCount++;
      }
    });
    if (matchCount > 0) {
      propertyGrid.style.display = '';
      if (noResults)
        noResults.classList.remove('active');
    }
    else {
      propertyGrid.style.display = 'none';
      if (noResults)
        noResults.classList.add('active');
    }
    showToast(verifiedOnlyActive ? 'Showing only verified boarding houses' : 'Showing all boarding houses');
  });
}
if (filterMapBtn && mapModal) {
  filterMapBtn.addEventListener('click', () => {
    mapModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}
if (mapModalClose) {
  mapModalClose.addEventListener('click', () => {
    if (mapModal)
      mapModal.classList.remove('active');
    document.body.style.overflow = '';
  });
}
if (mapModal) {
  mapModal.addEventListener('click', (e) => {
    if (e.target === mapModal) {
      mapModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}
if (navMobileBtn && phoneModal) {
  navMobileBtn.addEventListener('click', () => {
    phoneModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}
if (phoneModalClose) {
  phoneModalClose.addEventListener('click', () => {
    if (phoneModal)
      phoneModal.classList.remove('active');
    document.body.style.overflow = '';
  });
}
if (phoneModal) {
  phoneModal.addEventListener('click', (e) => {
    if (e.target === phoneModal) {
      phoneModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}
if (chatLauncher && chatWidget) {
  chatLauncher.addEventListener('click', () => {
    chatWidget.classList.add('active');
    chatLauncher.classList.add('hidden');
    setTimeout(() => {
      if (chatInput)
        chatInput.focus();
    }, 300);
  });
}
if (chatClose) {
  chatClose.addEventListener('click', () => {
    if (chatWidget)
      chatWidget.classList.remove('active');
    if (chatLauncher)
      chatLauncher.classList.remove('hidden');
  });
}
if (chatInputForm) {
  chatInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!chatInput || !chatMessages)
      return;
    const text = chatInput.value.trim();
    if (text === '')
      return;
    appendChatMessage(text, 'sent');
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    setTimeout(() => {
      const landlordResponses = [
        "Yes, Casa Verde Residences is available! Single rooms start at ₱3,500/month. Would you like to schedule a viewing?",
        "Mindanao State University is only a 5-minute walk from there! Super convenient.",
        "Sure! Water and electricity are sub-metered. Wi-Fi is completely free of charge.",
        "We require 1 month advance and 1 month deposit. Let me know if you would like to reserve a spot!"
      ];
      let responseText = landlordResponses[Math.floor(Math.random() * landlordResponses.length)];
      const query = text.toLowerCase();
      if (query.includes('avail') || query.includes('vacant') || query.includes('room') || query.includes('space')) {
        responseText = landlordResponses[0];
      }
      else if (query.includes('msu') || query.includes('university') || query.includes('far') || query.includes('walk') || query.includes('nddu')) {
        responseText = landlordResponses[1];
      }
      else if (query.includes('wifi') || query.includes('internet') || query.includes('util') || query.includes('bill') || query.includes('water') || query.includes('light')) {
        responseText = landlordResponses[2];
      }
      else if (query.includes('price') || query.includes('reserve') || query.includes('deposit') || query.includes('rent') || query.includes('how much')) {
        responseText = landlordResponses[3];
      }
      appendChatMessage(responseText, 'received');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
  });
}
function appendChatMessage(text, type) {
  if (!chatMessages)
    return;
  const msg = document.createElement('div');
  msg.className = `chat-msg ${type}`;
  msg.textContent = text;
  chatMessages.appendChild(msg);
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    if (mapModal)
      mapModal.classList.remove('active');
    if (phoneModal)
      phoneModal.classList.remove('active');
    if (chatWidget) {
      chatWidget.classList.remove('active');
      if (chatLauncher)
        chatLauncher.classList.remove('hidden');
    }
    document.body.style.overflow = '';
  }
});
