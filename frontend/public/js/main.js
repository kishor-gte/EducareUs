/* ==========================================================================
   EDUCARRUS — INTERACTIVE JAVASCRIPT CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });
  }

  // Mobile Dropdown Click Handling
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const link = item.querySelector('.nav-link');
    const dropdown = item.querySelector('.dropdown-menu');
    if (dropdown && link && window.innerWidth <= 992) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        item.classList.toggle('active');
      });
    }
  });

  // 2. Lead Counselling Modal Handler
  const modal = document.getElementById('counsellingModal');
  const modalClose = document.querySelector('.modal-close');
  const modalTriggers = document.querySelectorAll('[data-trigger="modal"]');
  const modalCourseSelect = document.getElementById('modalCourseSelect');

  function openModal(courseName = '') {
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (courseName && modalCourseSelect) {
        modalCourseSelect.value = courseName;
      }
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const course = trigger.getAttribute('data-course') || '';
      openModal(course);
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // 3. Interactive College Finder Form Submission
  const finderForm = document.getElementById('collegeFinderForm');
  if (finderForm) {
    finderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedCourse = document.getElementById('finderCourse')?.value || '';
      const selectedLocation = document.getElementById('finderLocation')?.value || '';
      const score = document.getElementById('finderScore')?.value || '';

      // Auto open lead modal prefilled with student score parameters
      openModal(selectedCourse);

      // Flash notification inside modal
      const modalSubtitle = modal?.querySelector('.modal-header p');
      if (modalSubtitle) {
        modalSubtitle.innerHTML = `Showing best fit colleges for <strong>${selectedCourse || 'All Courses'}</strong> (${score ? 'Score: ' + score : 'Top Institutions'}). Submit form to unlock counsellor recommendations.`;
      }
    });
  }

  // 4. FAQ Accordion Handler
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    if (header) {
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close all other items
        faqItems.forEach(otherItem => otherItem.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // 5. Lead Form Submission Toast Handler & Admin Sync
  const leadForms = document.querySelectorAll('.modal-form');
  leadForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');

      // Capture inputs
      const nameInput = form.querySelector('input[type="text"]')?.value || 'Student Candidate';
      const phoneInput = form.querySelector('input[type="tel"]')?.value || '+91 98765 43210';
      const courseInput = form.querySelector('select')?.value || 'General Counselling';
      const cityInput = form.querySelector('input[placeholder*="City"]') || form.querySelectorAll('input[type="text"]')[1];
      const cityVal = cityInput ? cityInput.value : 'India';

      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

        // Save lead to localStorage for Admin Control Center
        try {
          const storedLeads = JSON.parse(localStorage.getItem('educarrus_leads') || '[]');
          const newLead = {
            id: 'ED-' + Math.floor(1000 + Math.random() * 9000),
            name: nameInput,
            course: courseInput,
            score: 'Direct Inquiry',
            location: cityVal,
            date: new Date().toLocaleString(),
            counsellor: 'Rajiv Kumar',
            status: 'new',
            phone: phoneInput
          };
          storedLeads.unshift(newLead);
          localStorage.setItem('educarrus_leads', JSON.stringify(storedLeads));
        } catch (err) {
          console.log('Error saving lead:', err);
        }

        setTimeout(() => {
          submitBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Request Received!`;
          submitBtn.style.background = 'var(--accent-emerald)';

          setTimeout(() => {
            closeModal();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
            form.reset();
            alert('Thank you! Senior Educarrus Admission Counsellor will contact you shortly.');
          }, 1500);
        }, 1000);
      }
    });
  });

  // 6. Smooth Counter Animation for Trust Strip
  const stats = document.querySelectorAll('.stat-number');
  let animated = false;

  function animateCounters() {
    if (animated) return;
    stats.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target') || '0', 10);
      let count = 0;
      const speed = Math.ceil(target / 40);

      const updateCount = () => {
        count += speed;
        if (count >= target) {
          stat.innerText = target.toLocaleString() + '+';
        } else {
          stat.innerText = count.toLocaleString() + '+';
          setTimeout(updateCount, 40);
        }
      };
      updateCount();
    });
    animated = true;
  }

  // 7. Floating WhatsApp Chat Card Controller
  const toggleWhatsappCardBtn = document.getElementById('toggleWhatsappCard');
  const whatsappChatCard = document.getElementById('whatsappChatCard');
  const closeWhatsappCardBtn = document.getElementById('closeWhatsappCard');

  if (toggleWhatsappCardBtn && whatsappChatCard) {
    toggleWhatsappCardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      whatsappChatCard.classList.toggle('active');
    });
  }

  if (closeWhatsappCardBtn && whatsappChatCard) {
    closeWhatsappCardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      whatsappChatCard.classList.remove('active');
    });
  }

  // Close WhatsApp popup when clicking outside
  document.addEventListener('click', (e) => {
    if (whatsappChatCard && whatsappChatCard.classList.contains('active')) {
      if (!whatsappChatCard.contains(e.target) && e.target !== toggleWhatsappCardBtn) {
        whatsappChatCard.classList.remove('active');
      }
    }
  });
});
