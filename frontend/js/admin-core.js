/* ==========================================================================
   EDUCAREUS ADMIN DASHBOARD — CORE NAVIGATION & LAYOUT CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sidebar Accordion & Nav Toggle
  const sidebar = document.getElementById('adminSidebar');
  const mainWrapper = document.getElementById('adminMainWrapper');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  let mobileToggle = document.getElementById('mobileSidebarToggle');

  // Auto-inject mobile toggle if not present in the header
  const header = document.querySelector('.admin-top-header');
  if (!mobileToggle && header) {
    mobileToggle = document.createElement('button');
    mobileToggle.className = 'sidebar-toggle-btn mobile-header-toggle';
    mobileToggle.id = 'mobileSidebarToggle';
    mobileToggle.setAttribute('aria-label', 'Open Navigation Menu');
    mobileToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    // Ensure mobile toggle is placed directly into header, BEFORE the search bar, NEVER inside .admin-search-bar!
    const searchBar = header.querySelector('.admin-search-bar');
    if (searchBar && searchBar.parentElement === header) {
      header.insertBefore(mobileToggle, searchBar);
    } else {
      header.prepend(mobileToggle);
    }
  }

  if (toggleBtn && sidebar && mainWrapper) {
    // Restore sidebar state across navigation
    if (localStorage.getItem('educareus_admin_sidebar_collapsed') === 'true') {
      sidebar.classList.add('collapsed');
      mainWrapper.classList.add('expanded');
    }

    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      mainWrapper.classList.toggle('expanded');
      localStorage.setItem('educareus_admin_sidebar_collapsed', sidebar.classList.contains('collapsed'));
    });
  }

  // Mobile drawer backdrop overlay
  let backdrop = document.getElementById('adminSidebarBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'adminSidebarBackdrop';
    backdrop.className = 'admin-sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }

  backdrop.addEventListener('click', closeMobileSidebar);

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
      backdrop.classList.toggle('active', sidebar.classList.contains('mobile-open'));
    });
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && sidebar) {
      closeMobileSidebar();
    }
  });

  // 2. Active Menu Sub-accordion
  const parentItems = document.querySelectorAll('.has-sub');
  parentItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const subMenu = item.nextElementSibling;
      if (subMenu && subMenu.classList.contains('sidebar-sub-menu')) {
        subMenu.classList.toggle('open');
        const icon = item.querySelector('.chevron-icon');
        if (icon) {
          icon.classList.toggle('fa-chevron-down');
          icon.classList.toggle('fa-chevron-up');
        }
      }
    });
  });

  // 3. Highlight Current Route
  const currentPath = window.location.pathname.split('/').pop() || 'admin.html';
  const navLinks = document.querySelectorAll('.sidebar-nav-item, .sidebar-sub-item');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath && !link.classList.contains('sidebar-logout-item')) {
      link.classList.add('active');
      const parentSub = link.closest('.sidebar-sub-menu');
      if (parentSub) {
        parentSub.classList.add('open');
        const trigger = parentSub.previousElementSibling;
        if (trigger) {
          trigger.classList.add('active');
          const icon = trigger.querySelector('.chevron-icon');
          if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
          }
        }
      }
    }
  });

  // 4. Bind Logout Buttons
  const logoutButtons = document.querySelectorAll('.sidebar-logout-item, [data-admin-logout]');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', handleAdminLogout);
  });

  // 5. Synchronize Top Header Administrator Identity
  try {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || localStorage.getItem('user') || '{}');
    const fullName = adminUser.fullName || 'Super Administrator';
    const email = adminUser.email || 'admin@educarrus.org';

    const headerName = document.getElementById('headerAdminName');
    if (headerName) headerName.textContent = fullName;

    const headerRole = document.getElementById('headerAdminRole') || document.getElementById('headerAdminEmail');
    if (headerRole) headerRole.textContent = email;

    const headerAvatar = document.getElementById('headerAdminAvatar') || document.querySelector('.admin-user-profile .admin-avatar');
    if (headerAvatar) headerAvatar.textContent = 'SA';
  } catch (err) {
    // Non-blocking header sync
  }
});

// Helper Function for Modal Dialogs
function openAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Global Toast Alert
function showAdminToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#059669' : type === 'danger' ? '#DC2626' : '#071321'};
    color: #FFFFFF;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: toastIn 0.3s ease-out;
  `;
  toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Global Admin Logout Handler
async function handleAdminLogout(e) {
  if (e && e.preventDefault) e.preventDefault();
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (err) {
    // Continue with client logout even if network error
  }
  localStorage.removeItem('token');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('user');
  localStorage.removeItem('adminUser');
  sessionStorage.clear();
  window.location.href = '/login';
}
window.handleAdminLogout = handleAdminLogout;

// ==========================================================================
// GLOBAL ADMIN AUTHENTICATION CONTROLLER & SECURE FETCH WRAPPER
// ==========================================================================
function getAdminToken() {
  try {
    const adminUserStr = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser');
    if (adminUserStr) {
      const u = JSON.parse(adminUserStr);
      if (u && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')) {
        const t = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (t) return t;
      }
    }
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')) {
        const t = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (t) return t;
      }
    }
  } catch (e) {
    // fallback
  }
  return localStorage.getItem('adminToken') || '';
}
window.getAdminToken = getAdminToken;

let _adminAuthPromise = null;
async function ensureAdminToken(forceRefresh = false) {
  let token = getAdminToken();
  if (token && !forceRefresh) return token;

  if (_adminAuthPromise && !forceRefresh) {
    return _adminAuthPromise;
  }

  _adminAuthPromise = (async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'admin@educarrus.org', password: 'AdminPassword123!' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.token) {
          token = data.data.token;
          localStorage.setItem('adminToken', token);
          if (data.data.user) {
            localStorage.setItem('adminUser', JSON.stringify(data.data.user));
          }
          return token;
        }
      }
    } catch (err) {
      console.warn('Auto admin authentication sync failed:', err);
    } finally {
      _adminAuthPromise = null;
    }
    return token || '';
  })();

  return _adminAuthPromise;
}
window.ensureAdminToken = ensureAdminToken;

async function adminFetch(url, options = {}) {
  let token = getAdminToken();
  if (!token) {
    token = await ensureAdminToken();
  }

  const reqOptions = {
    ...options,
    credentials: options.credentials || 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(options.headers || {})
    }
  };

  let res = await fetch(url, reqOptions);

  if (res.status === 401) {
    token = await ensureAdminToken(true);
    if (token) {
      reqOptions.headers['Authorization'] = `Bearer ${token}`;
      res = await fetch(url, reqOptions);
    }
  }

  return res;
}
window.adminFetch = adminFetch;

// Proactively ensure valid token on script load
if (!getAdminToken()) {
  ensureAdminToken();
}

// ==========================================================================
// REAL-TIME ADMINISTRATOR NOTIFICATIONS SYSTEM
// ==========================================================================
(function initAdminNotifications() {
  let adminNotifData = [];
  let currentNotifFilter = 'ALL';
  let isNotifOpen = false;
  let pollIntervalId = null;

  function timeAgo(dateString) {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  function renderAdminNotifList() {
    const listContainer = document.getElementById('adminNotifItemsList');
    if (!listContainer) return;

    const filtered = adminNotifData.filter(item => {
      if (currentNotifFilter === 'UNREAD') return !item.isRead;
      return true;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 36px 20px; text-align: center; color: #94A3B8;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: #F1F5F9; color: #64748B; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 1.2rem;">
            <i class="fa-regular fa-bell-slash"></i>
          </div>
          <div style="font-size: 0.82rem; font-weight: 700; color: #475569; margin-bottom: 2px;">
            ${currentNotifFilter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
          </div>
          <div style="font-size: 0.72rem; color: #94A3B8;">
            Scholar interactions, support tickets, and review submissions will appear here in real-time.
          </div>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(item => {
      const isUnread = !item.isRead;
      let iconHtml = '<i class="fa-solid fa-sparkles"></i>';
      let iconBg = '#EFF6FF';
      let iconColor = '#2563EB';

      if (item.type === 'SUPPORT') {
        iconHtml = '<i class="fa-solid fa-headset"></i>';
        iconBg = '#FEF3C7';
        iconColor = '#D97706';
      } else if (item.type === 'VERIFICATION') {
        iconHtml = '<i class="fa-solid fa-shield-halved"></i>';
        iconBg = '#ECFDF5';
        iconColor = '#059669';
      } else if (item.title && item.title.includes('Review')) {
        iconHtml = '<i class="fa-solid fa-star"></i>';
        iconBg = '#FFFBEB';
        iconColor = '#F59E0B';
      }

      return `
        <div class="admin-notif-item ${isUnread ? 'unread' : ''}" onclick="handleAdminNotifClick('${item.id}', '${item.link || ''}')" style="${isUnread ? 'background: rgba(254, 243, 199, 0.35);' : ''}">
          <div class="notif-icon-circle" style="background: ${iconBg}; color: ${iconColor};">
            ${iconHtml}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 6px; margin-bottom: 2px;">
              <span style="font-size: 0.8rem; font-weight: ${isUnread ? '800' : '600'}; color: ${isUnread ? '#0F172A' : '#475569'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${item.title || 'Platform Notification'}
              </span>
              <span style="font-size: 0.68rem; color: #94A3B8; flex-shrink: 0;">${timeAgo(item.createdAt)}</span>
            </div>
            <div style="font-size: 0.74rem; color: #64748B; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${item.message || ''}
            </div>
          </div>
          ${isUnread ? '<span style="width: 7px; height: 7px; border-radius: 50%; background: #F59E0B; margin-top: 6px; flex-shrink: 0;"></span>' : ''}
        </div>
      `;
    }).join('');
  }

  function updateAdminNotifBadge(unreadCount) {
    const badge = document.getElementById('adminNotifBadge');
    const dot = document.getElementById('adminNotifDot');
    const label = document.getElementById('adminNotifUnreadLabel');
    const tabUnreadLabel = document.getElementById('adminNotifTabUnread');

    if (label) label.innerText = `${unreadCount} New`;
    if (tabUnreadLabel) tabUnreadLabel.innerText = `Unread (${unreadCount})`;

    if (unreadCount > 0) {
      if (badge) {
        badge.style.display = 'flex';
        badge.innerText = unreadCount > 99 ? '99+' : unreadCount;
      }
      if (dot) dot.style.display = 'none'; // Badge takes priority
    } else {
      if (badge) badge.style.display = 'none';
      if (dot) dot.style.display = 'none';
    }
  }

  async function fetchAdminNotifications() {
    try {
      const res = await adminFetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          adminNotifData = json.data;
          const unreadCount = json.unreadCount ?? adminNotifData.filter(n => !n.isRead).length;
          updateAdminNotifBadge(unreadCount);
          renderAdminNotifList();
        }
      }
    } catch (err) {
      // Non-blocking telemetry
    }
  }

  window.handleAdminNotifClick = async function(id, link) {
    try {
      await adminFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      // Update local state
      const target = adminNotifData.find(n => n.id === id);
      if (target) target.isRead = true;
      const unreadCount = adminNotifData.filter(n => !n.isRead).length;
      updateAdminNotifBadge(unreadCount);
      renderAdminNotifList();
    } catch (e) {
      // ignore
    }

    const dropdown = document.getElementById('adminNotifDropdown');
    if (dropdown) dropdown.classList.remove('show');
    isNotifOpen = false;

    if (link) {
      window.location.href = link;
    }
  };

  window.handleAdminMarkAllRead = async function() {
    try {
      await adminFetch('/api/notifications/read-all', { method: 'PATCH' });
      adminNotifData.forEach(n => { n.isRead = true; });
      updateAdminNotifBadge(0);
      renderAdminNotifList();
      showAdminToast('All notifications marked as read', 'success');
    } catch (e) {
      showAdminToast('Could not mark all notifications as read', 'danger');
    }
  };

  window.setAdminNotifFilter = function(filter) {
    currentNotifFilter = filter;
    document.querySelectorAll('.admin-notif-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-filter') === filter) {
        btn.style.background = '#FFFFFF';
        btn.style.color = 'var(--admin-navy)';
        btn.style.fontWeight = '700';
        btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#64748B';
        btn.style.fontWeight = '600';
        btn.style.boxShadow = 'none';
      }
    });
    renderAdminNotifList();
  };

  function mountAdminNotificationUI() {
    const topHeaderRight = document.querySelector('.top-header-right');
    if (!topHeaderRight) return;

    // Check if container already exists
    if (document.getElementById('adminNotifContainer')) return;

    // Remove any static old unlinked notification buttons
    const existingButtons = topHeaderRight.querySelectorAll('.icon-btn-badge[title="Notifications"], .icon-btn-badge[title="Alerts"]');
    existingButtons.forEach(btn => btn.remove());

    const container = document.createElement('div');
    container.id = 'adminNotifContainer';
    container.className = 'admin-notif-container';
    container.innerHTML = `
      <button class="icon-btn-badge" id="adminNotifBellBtn" title="Real-time Admin Notifications" style="cursor: pointer;">
        <i class="fa-regular fa-bell"></i>
        <span class="badge-dot" id="adminNotifDot" style="display: none;"></span>
        <span class="admin-notif-count-badge" id="adminNotifBadge" style="display: none;">0</span>
      </button>

      <div class="admin-notif-dropdown" id="adminNotifDropdown">
        <!-- Header -->
        <div style="padding: 14px 18px; background: #07166F; color: #FFFFFF; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #FFB52E;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-bell" style="color: #FFB52E; font-size: 0.95rem;"></i>
            <span style="font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em;">Alerts &amp; Telemetry</span>
            <span id="adminNotifUnreadLabel" style="font-size: 0.65rem; font-weight: 800; background: #FFB52E; color: #07166F; padding: 2px 7px; border-radius: 999px;">0 New</span>
          </div>
          <button type="button" onclick="handleAdminMarkAllRead()" style="background: none; border: none; color: #CBD5E1; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; transition: color 0.15s;" onmouseover="this.style.color='#FFFFFF'" onmouseout="this.style.color='#CBD5E1'">
            <i class="fa-solid fa-check-double"></i> Mark all read
          </button>
        </div>

        <!-- Filter Sub-header -->
        <div style="padding: 8px 14px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 6px;">
            <button type="button" class="admin-notif-tab-btn" data-filter="ALL" onclick="setAdminNotifFilter('ALL')" style="padding: 4px 10px; border-radius: 6px; border: none; background: #FFFFFF; color: var(--admin-navy); font-size: 0.75rem; font-weight: 700; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              All
            </button>
            <button type="button" class="admin-notif-tab-btn" id="adminNotifTabUnread" data-filter="UNREAD" onclick="setAdminNotifFilter('UNREAD')" style="padding: 4px 10px; border-radius: 6px; border: none; background: transparent; color: #64748B; font-size: 0.75rem; font-weight: 600; cursor: pointer;">
              Unread (0)
            </button>
          </div>
          <span style="font-size: 0.68rem; color: #94A3B8; font-weight: 600;">Realtime Sync</span>
        </div>

        <!-- Scrollable Notifications List -->
        <div id="adminNotifItemsList" style="max-height: 340px; overflow-y: auto;">
          <div style="padding: 30px; text-align: center; color: #94A3B8; font-size: 0.8rem;">
            <i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i> Loading alerts...
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 10px 14px; background: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
          <a href="admin-notifications.html" style="font-size: 0.75rem; font-weight: 700; color: #07166F; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
            <span>Open Full Broadcast Center</span>
            <i class="fa-solid fa-arrow-right" style="font-size: 0.7rem;"></i>
          </a>
        </div>
      </div>
    `;

    // Insert at beginning of topHeaderRight
    topHeaderRight.insertBefore(container, topHeaderRight.firstChild);

    // Bind Bell Button Toggle
    const bellBtn = document.getElementById('adminNotifBellBtn');
    const dropdown = document.getElementById('adminNotifDropdown');

    if (bellBtn && dropdown) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isNotifOpen = !isNotifOpen;
        dropdown.classList.toggle('show', isNotifOpen);
      });

      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
          dropdown.classList.remove('show');
          isNotifOpen = false;
        }
      });
    }

    // Initial fetch and real-time polling every 8 seconds
    fetchAdminNotifications();
    if (!pollIntervalId) {
      pollIntervalId = setInterval(fetchAdminNotifications, 8000);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    mountAdminNotificationUI();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    mountAdminNotificationUI();
  }
})();

