/* =========================================================
   RATUL SHEE — ADMIN PORTAL CLIENT LOGIC & REST CLIENT
   Dynamic CMS with Live MongoDB Synchronization & Gmail Dispatch
   ========================================================= */

const API_BASE = '/api';
let authToken = localStorage.getItem('ratul_admin_token') || null;

// DOM Elements
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginAlert = document.getElementById('loginAlert');
const logoutBtn = document.getElementById('logoutBtn');
const adminToastContainer = document.getElementById('adminToastContainer');

// Toast Notification
function showAdminToast(msg) {
  if (!adminToastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.textContent = msg;
  adminToastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3400);
}

// Check session on load
async function initSession() {
  if (!authToken) {
    showLogin();
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showDashboard();
      loadAllDashboardData();
      checkSmtpStatus();
    } else {
      showLogin();
    }
  } catch (err) {
    showLogin();
  }
}
initSession();

function showLogin() {
  if (loginView) loginView.style.display = 'flex';
  if (dashboardView) dashboardView.style.display = 'none';
}

function showDashboard() {
  if (loginView) loginView.style.display = 'none';
  if (dashboardView) dashboardView.style.display = 'flex';
}

// 1. Authentication Handlers
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlert.textContent = '';
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        authToken = data.token;
        localStorage.setItem('ratul_admin_token', authToken);
        showDashboard();
        loadAllDashboardData();
        checkSmtpStatus();
        showAdminToast('✅ Welcome, Admin! Session authenticated.');
      } else {
        loginAlert.textContent = data.error || 'Invalid admin credentials.';
      }
    } catch (err) {
      loginAlert.textContent = 'Server connection error.';
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    authToken = null;
    localStorage.removeItem('ratul_admin_token');
    showLogin();
    showAdminToast('🚪 Session terminated.');
  });
}

// 2. Navigation Tabs & Mobile Sidebar
const navItems = document.querySelectorAll('.sidebar-menu .nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const tabTitle = document.getElementById('tabTitle');
const tabSubtitle = document.getElementById('tabSubtitle');
const adminSidebar = document.querySelector('.admin-sidebar');
const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
const adminSidebarBackdrop = document.getElementById('adminSidebarBackdrop');

function toggleMobileSidebar(show) {
  if (!adminSidebar) return;
  const isOpen = adminSidebar.classList.contains('open');
  const shouldOpen = show !== undefined ? show : !isOpen;

  if (shouldOpen) {
    adminSidebar.classList.add('open');
    if (adminSidebarBackdrop) adminSidebarBackdrop.classList.add('active');
  } else {
    adminSidebar.classList.remove('open');
    if (adminSidebarBackdrop) adminSidebarBackdrop.classList.remove('active');
  }
}

if (mobileSidebarToggle) {
  mobileSidebarToggle.addEventListener('click', () => toggleMobileSidebar());
}

if (adminSidebarBackdrop) {
  adminSidebarBackdrop.addEventListener('click', () => toggleMobileSidebar(false));
}

const tabMeta = {
  overview:  { title: 'Overview Dashboard', sub: 'Real-time statistics, inquiries, and email dispatch' },
  profile:   { title: 'Profile & Presentation', sub: 'Edit hero bio, tagline, theme, and numerical metrics' },
  projects:  { title: 'Projects Manager', sub: 'Create and update featured project showcase cards' },
  skills:    { title: 'Skills & Tech Stack', sub: 'Adjust technical proficiency percentages and categories' },
  timeline:  { title: 'Timeline & Education', sub: 'Manage academic milestones and degrees' },
  messages:  { title: 'Visitor Inquiries Inbox', sub: 'Read inquiries and reply directly via your Gmail account' },
  settings:  { title: 'Settings & Gmail SMTP', sub: 'Configure Gmail App Password, credentials & database backups' }
};

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));

    item.classList.add('active');
    const tabKey = item.getAttribute('data-tab');
    const targetTab = document.getElementById(`tab-${tabKey}`);
    if (targetTab) targetTab.classList.add('active');

    if (tabMeta[tabKey]) {
      tabTitle.textContent = tabMeta[tabKey].title;
      tabSubtitle.textContent = tabMeta[tabKey].sub;
    }

    if (tabKey === 'messages') loadMessages();
    if (tabKey === 'settings') checkSmtpStatus();

    // Auto-close sidebar on mobile after selecting tab
    toggleMobileSidebar(false);
  });
});

// Helper for authenticated requests
async function authFetch(url, options = {}) {
  const headers = options.headers || {};
  headers['Authorization'] = `Bearer ${authToken}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...options, headers });
}

// 3. Load Master Portfolio Data
async function loadAllDashboardData() {
  try {
    const res = await fetch(`${API_BASE}/portfolio`);
    const json = await res.json();
    if (!json.success || !json.data) return;

    const { profile, projects, skills, timeline } = json.data;

    // Update stats counters
    document.getElementById('statProjects').textContent = projects?.length || 0;
    document.getElementById('statSkills').textContent = skills?.length || 0;
    document.getElementById('statTimeline').textContent = timeline?.length || 0;

    // Populate Profile Form
    if (profile) {
      document.getElementById('profName').value = profile.name || '';
      document.getElementById('profEyebrow').value = profile.eyebrow || '';
      document.getElementById('profStatusText').value = profile.statusText || '';
      document.getElementById('profLocation').value = profile.location || '';
      document.getElementById('profTagline').value = profile.tagline || '';
      document.getElementById('profTheme').value = profile.defaultTheme || 'emerald';

      if (profile.metrics) {
        document.getElementById('profMetricLanguages').value = profile.metrics.languages || 4;
        document.getElementById('profMetricCleanCode').value = profile.metrics.cleanCodePct || 100;
        document.getElementById('profMetricGradYear').value = profile.metrics.gradYear || 2027;
        document.getElementById('profMetricRepos').value = profile.metrics.repos || 15;
      }
      document.getElementById('profTerminalWhoami').value = profile.terminalWhoami || '';

      if (profile.socials) {
        document.getElementById('profGithub').value = profile.socials.github || '';
        document.getElementById('profLinkedin').value = profile.socials.linkedin || '';
        document.getElementById('profTwitter').value = profile.socials.twitter || '';
        const fbEl = document.getElementById('profFacebook');
        if (fbEl) fbEl.value = profile.socials.facebook || '';
        document.getElementById('profEmail').value = profile.socials.email || '';
      }
    }

    renderProjectsAdmin(projects || []);
    renderSkillsAdmin(skills || []);
    renderTimelineAdmin(timeline || []);
    loadMessages();

  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }
}

// 4. Profile Save Handler
const profileForm = document.getElementById('profileForm');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fbVal = document.getElementById('profFacebook');
    const payload = {
      name: document.getElementById('profName').value.trim(),
      eyebrow: document.getElementById('profEyebrow').value.trim(),
      statusText: document.getElementById('profStatusText').value.trim(),
      location: document.getElementById('profLocation').value.trim(),
      tagline: document.getElementById('profTagline').value.trim(),
      defaultTheme: document.getElementById('profTheme').value,
      metrics: {
        languages: parseInt(document.getElementById('profMetricLanguages').value, 10) || 4,
        cleanCodePct: parseInt(document.getElementById('profMetricCleanCode').value, 10) || 100,
        gradYear: parseInt(document.getElementById('profMetricGradYear').value, 10) || 2027,
        repos: parseInt(document.getElementById('profMetricRepos').value, 10) || 15
      },
      terminalWhoami: document.getElementById('profTerminalWhoami').value.trim(),
      socials: {
        github: document.getElementById('profGithub').value.trim(),
        linkedin: document.getElementById('profLinkedin').value.trim(),
        twitter: document.getElementById('profTwitter').value.trim(),
        facebook: fbVal ? fbVal.value.trim() : 'https://www.facebook.com/ratul.shee.6/',
        email: document.getElementById('profEmail').value.trim()
      }
    };

    try {
      const res = await authFetch(`${API_BASE}/portfolio/profile`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showAdminToast('✅ Profile updated in MongoDB!');
      } else {
        showAdminToast('❌ Error: ' + data.error);
      }
    } catch (err) {
      showAdminToast('Server update error.');
    }
  });
}

// 5. Projects Manager
const adminProjectsList = document.getElementById('adminProjectsList');
const projectEditModal = document.getElementById('projectEditModal');
const projectForm = document.getElementById('projectForm');
const addNewProjectBtn = document.getElementById('addNewProjectBtn');
const projImageFile = document.getElementById('projImageFile');

let allProjects = [];

function renderProjectsAdmin(projects) {
  allProjects = projects;
  if (!adminProjectsList) return;

  if (projects.length === 0) {
    adminProjectsList.innerHTML = '<p class="empty-state">No projects in database.</p>';
    return;
  }

  adminProjectsList.innerHTML = projects.map(p => `
    <div class="admin-project-card">
      <img src="${p.imageUrl || 'fintrack.jpg'}" alt="${p.title}" class="admin-project-img">
      <div class="admin-project-body">
        <span class="admin-project-category">${p.category.toUpperCase()} // Priority: ${p.order || 0}</span>
        <h4>${p.title}</h4>
        <p class="admin-project-desc">${p.description.slice(0, 100)}...</p>
        <div class="admin-card-actions">
          <button class="btn-action-edit" onclick="openEditProjectModal('${p._id}')">✏️ Edit</button>
          <button class="btn-action-delete" onclick="deleteProject('${p._id}')">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openEditProjectModal(id = null) {
  projectForm.reset();
  document.getElementById('projId').value = '';

  if (id) {
    const p = allProjects.find(item => item._id === id);
    if (p) {
      document.getElementById('projectModalTitle').textContent = 'Edit Project';
      document.getElementById('projId').value = p._id;
      document.getElementById('projTitle').value = p.title || '';
      document.getElementById('projCategory').value = p.category || 'mern';
      document.getElementById('projOrder').value = p.order || 0;
      document.getElementById('projDesc').value = p.description || '';
      document.getElementById('projHighlights').value = (p.highlights || []).join(', ');
      document.getElementById('projStack').value = (p.stack || []).join(', ');
      document.getElementById('projImageUrl').value = p.imageUrl || '';
      document.getElementById('projLiveUrl').value = p.liveUrl || '';
      document.getElementById('projRepoUrl').value = p.repoUrl || '';
    }
  } else {
    document.getElementById('projectModalTitle').textContent = 'Add New Project';
  }
  projectEditModal.classList.add('open');
}

function closeProjectEditModal() {
  projectEditModal.classList.remove('open');
}

if (addNewProjectBtn) addNewProjectBtn.addEventListener('click', () => openEditProjectModal());

// Handle file upload
if (projImageFile) {
  projImageFile.addEventListener('change', async () => {
    if (!projImageFile.files[0]) return;
    const formData = new FormData();
    formData.append('image', projImageFile.files[0]);

    showAdminToast('Uploading screenshot...');
    try {
      const res = await authFetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.fileUrl) {
        document.getElementById('projImageUrl').value = data.fileUrl;
        showAdminToast('✅ Image uploaded successfully!');
      } else {
        showAdminToast('❌ Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      showAdminToast('Upload failed.');
    }
  });
}

if (projectForm) {
  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('projId').value;

    const payload = {
      title: document.getElementById('projTitle').value.trim(),
      category: document.getElementById('projCategory').value,
      order: parseInt(document.getElementById('projOrder').value, 10) || 0,
      description: document.getElementById('projDesc').value.trim(),
      highlights: document.getElementById('projHighlights').value.split(',').map(s => s.trim()).filter(Boolean),
      stack: document.getElementById('projStack').value.split(',').map(s => s.trim()).filter(Boolean),
      imageUrl: document.getElementById('projImageUrl').value.trim(),
      liveUrl: document.getElementById('projLiveUrl').value.trim(),
      repoUrl: document.getElementById('projRepoUrl').value.trim()
    };

    const url = id ? `${API_BASE}/projects/${id}` : `${API_BASE}/projects`;
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        closeProjectEditModal();
        showAdminToast(id ? '✅ Project updated!' : '✅ Project created!');
        loadAllDashboardData();
      } else {
        showAdminToast('Error: ' + data.error);
      }
    } catch (err) {
      showAdminToast('Failed to save project.');
    }
  });
}

window.deleteProject = async function(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  try {
    const res = await authFetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showAdminToast('🗑️ Project removed.');
      loadAllDashboardData();
    }
  } catch (err) {
    showAdminToast('Delete failed.');
  }
};

// 6. Skills Manager
const skillsTableBody = document.getElementById('skillsTableBody');
const skillModal = document.getElementById('skillModal');
const skillForm = document.getElementById('skillForm');
const addNewSkillBtn = document.getElementById('addNewSkillBtn');
const skillProficiency = document.getElementById('skillProficiency');
const skillProfVal = document.getElementById('skillProfVal');

let allSkills = [];

if (skillProficiency && skillProfVal) {
  skillProficiency.addEventListener('input', () => {
    skillProfVal.textContent = skillProficiency.value;
  });
}

function renderSkillsAdmin(skills) {
  allSkills = skills;
  if (!skillsTableBody) return;

  skillsTableBody.innerHTML = skills.map(s => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td><span class="badge-tag">${s.category.toUpperCase()}</span></td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>${s.proficiency}%</span>
          <div style="width: 100px; height: 6px; background: #1a273a; border-radius: 3px; overflow: hidden;">
            <div style="width: ${s.proficiency}%; height: 100%; background: #39ff9c;"></div>
          </div>
        </div>
      </td>
      <td>
        <button class="btn-action-edit" onclick="openEditSkillModal('${s._id}')">✏️</button>
        <button class="btn-action-delete" onclick="deleteSkill('${s._id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openEditSkillModal(id = null) {
  skillForm.reset();
  document.getElementById('skillId').value = '';

  if (id) {
    const s = allSkills.find(item => item._id === id);
    if (s) {
      document.getElementById('skillModalTitle').textContent = 'Edit Skill';
      document.getElementById('skillId').value = s._id;
      document.getElementById('skillName').value = s.name;
      document.getElementById('skillCategory').value = s.category;
      document.getElementById('skillProficiency').value = s.proficiency;
      document.getElementById('skillProfVal').textContent = s.proficiency;
    }
  } else {
    document.getElementById('skillModalTitle').textContent = 'Add Skill';
    document.getElementById('skillProficiency').value = 85;
    document.getElementById('skillProfVal').textContent = 85;
  }
  skillModal.classList.add('open');
}

function closeSkillModal() {
  skillModal.classList.remove('open');
}

if (addNewSkillBtn) addNewSkillBtn.addEventListener('click', () => openEditSkillModal());

if (skillForm) {
  skillForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('skillId').value;

    const payload = {
      name: document.getElementById('skillName').value.trim(),
      category: document.getElementById('skillCategory').value,
      proficiency: parseInt(document.getElementById('skillProficiency').value, 10)
    };

    const url = id ? `${API_BASE}/skills/${id}` : `${API_BASE}/skills`;
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        closeSkillModal();
        showAdminToast(id ? '✅ Skill updated!' : '✅ Skill created!');
        loadAllDashboardData();
      }
    } catch (err) {
      showAdminToast('Failed to save skill.');
    }
  });
}

window.deleteSkill = async function(id) {
  if (!confirm('Delete this skill?')) return;
  try {
    const res = await authFetch(`${API_BASE}/skills/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showAdminToast('🗑️ Skill deleted.');
      loadAllDashboardData();
    }
  } catch (err) {
    showAdminToast('Delete failed.');
  }
};

// 7. Timeline Manager
const timelineAdminList = document.getElementById('timelineAdminList');
const timelineModal = document.getElementById('timelineModal');
const timelineForm = document.getElementById('timelineForm');
const addNewTimelineBtn = document.getElementById('addNewTimelineBtn');

let allTimeline = [];

function renderTimelineAdmin(timeline) {
  allTimeline = timeline;
  if (!timelineAdminList) return;

  timelineAdminList.innerHTML = timeline.map(t => `
    <div class="admin-section-box" style="margin-bottom: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4>${t.institution}</h4>
          <span style="color: var(--neon-green); font-size: 0.85rem;">${t.degree} (${t.dates})</span>
        </div>
        <div>
          <button class="btn-action-edit" onclick="openEditTimelineModal('${t._id}')">✏️ Edit</button>
          <button class="btn-action-delete" onclick="deleteTimeline('${t._id}')">🗑️ Delete</button>
        </div>
      </div>
      <p style="color: var(--text-dim); font-size: 0.84rem; margin-top: 8px;">${t.description || ''}</p>
    </div>
  `).join('');
}

function openEditTimelineModal(id = null) {
  timelineForm.reset();
  document.getElementById('timelineId').value = '';

  if (id) {
    const t = allTimeline.find(item => item._id === id);
    if (t) {
      document.getElementById('timelineModalTitle').textContent = 'Edit Milestone';
      document.getElementById('timelineId').value = t._id;
      document.getElementById('timeInstitution').value = t.institution;
      document.getElementById('timeDegree').value = t.degree;
      document.getElementById('timeDates').value = t.dates;
      document.getElementById('timeBadge').value = t.badge || '';
      document.getElementById('timeDesc').value = t.description || '';
    }
  } else {
    document.getElementById('timelineModalTitle').textContent = 'Add Milestone';
  }
  timelineModal.classList.add('open');
}

function closeTimelineModal() {
  timelineModal.classList.remove('open');
}

if (addNewTimelineBtn) addNewTimelineBtn.addEventListener('click', () => openEditTimelineModal());

if (timelineForm) {
  timelineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('timelineId').value;

    const payload = {
      institution: document.getElementById('timeInstitution').value.trim(),
      degree: document.getElementById('timeDegree').value.trim(),
      dates: document.getElementById('timeDates').value.trim(),
      badge: document.getElementById('timeBadge').value.trim(),
      description: document.getElementById('timeDesc').value.trim()
    };

    const url = id ? `${API_BASE}/timeline/${id}` : `${API_BASE}/timeline`;
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        closeTimelineModal();
        showAdminToast(id ? '✅ Milestone updated!' : '✅ Milestone created!');
        loadAllDashboardData();
      }
    } catch (err) {
      showAdminToast('Failed to save timeline entry.');
    }
  });
}

window.deleteTimeline = async function(id) {
  if (!confirm('Delete this milestone?')) return;
  try {
    const res = await authFetch(`${API_BASE}/timeline/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showAdminToast('🗑️ Milestone deleted.');
      loadAllDashboardData();
    }
  } catch (err) {
    showAdminToast('Delete failed.');
  }
};

// 8. Contact Inquiries Inbox & Direct Reply
async function loadMessages() {
  const messagesList = document.getElementById('messagesList');
  const recentMessagesTable = document.getElementById('recentMessagesTable');
  const unreadBadge = document.getElementById('unreadBadge');
  const statMessages = document.getElementById('statMessages');

  try {
    const res = await authFetch(`${API_BASE}/messages`);
    const data = await res.json();
    if (!data.success || !data.data) return;

    const msgs = data.data;
    const unreadCount = msgs.filter(m => !m.isRead).length;

    if (statMessages) statMessages.textContent = msgs.length;
    if (unreadBadge) {
      unreadBadge.textContent = unreadCount;
      unreadBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }

    // Render Recent Table on Overview
    if (recentMessagesTable) {
      if (msgs.length === 0) {
        recentMessagesTable.innerHTML = '<p class="empty-state">No inquiries received yet.</p>';
      } else {
        recentMessagesTable.innerHTML = msgs.slice(0, 3).map(m => `
          <div style="padding: 10px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${m.name}</strong> <span style="color: var(--neon-blue); font-size: 0.78rem;">(${m.email})</span>
              <p style="color: var(--text-dim); font-size: 0.84rem;">${m.message.slice(0, 80)}...</p>
            </div>
            <button class="btn-action-reply" onclick="openEmailComposer('${m.email}', 'Re: ${escapeHtml(m.subject || 'Portfolio Inquiry')}', '${escapeHtml(m.name)}')">✉️ Reply</button>
          </div>
        `).join('');
      }
    }

    // Render Inbox tab
    if (messagesList) {
      if (msgs.length === 0) {
        messagesList.innerHTML = '<p class="empty-state">Inbox is empty.</p>';
      } else {
        messagesList.innerHTML = msgs.map(m => `
          <div class="message-card ${m.isRead ? '' : 'unread'}">
            <div>
              <div class="msg-from">${m.name}</div>
              <div class="msg-email">${m.email}</div>
              <div class="msg-subject">📌 ${m.subject || 'Inquiry'}</div>
              <p class="msg-body">${m.message}</p>
              <div class="msg-date">Received: ${new Date(m.createdAt).toLocaleString()}</div>
            </div>
            <div class="msg-actions">
              <button class="btn-action-reply" onclick="openEmailComposer('${m.email}', 'Re: ${escapeHtml(m.subject || 'Portfolio Inquiry')}', '${escapeHtml(m.name)}')">✉️ Direct Reply</button>
              ${!m.isRead ? `<button class="btn-action-edit" onclick="markAsRead('${m._id}')">✓ Mark as Read</button>` : ''}
              <button class="btn-action-delete" onclick="deleteMessage('${m._id}')">🗑️ Delete</button>
            </div>
          </div>
        `).join('');
      }
    }

  } catch (err) {
    console.error('Messages error:', err);
  }
}

window.markAsRead = async function(id) {
  try {
    await authFetch(`${API_BASE}/messages/${id}/read`, { method: 'PATCH' });
    showAdminToast('✓ Marked as read');
    loadMessages();
  } catch (e) {
    showAdminToast('Failed to update status.');
  }
};

window.deleteMessage = async function(id) {
  if (!confirm('Delete this inquiry?')) return;
  try {
    await authFetch(`${API_BASE}/messages/${id}`, { method: 'DELETE' });
    showAdminToast('🗑️ Inquiry deleted.');
    loadMessages();
  } catch (e) {
    showAdminToast('Failed to delete inquiry.');
  }
};

// 9. Email Composer Modal & Dispatch
const emailComposerModal = document.getElementById('emailComposerModal');
const emailComposerForm = document.getElementById('emailComposerForm');
const topbarComposeBtn = document.getElementById('topbarComposeBtn');
const inboxComposeBtn = document.getElementById('inboxComposeBtn');
const sendEmailSubmitBtn = document.getElementById('sendEmailSubmitBtn');

window.openEmailComposer = function(to = '', subject = '', recipientName = '') {
  emailComposerForm.reset();
  if (to) document.getElementById('emailTo').value = to;
  if (subject) document.getElementById('emailSubject').value = subject;
  if (recipientName) document.getElementById('emailRecipientName').value = recipientName;
  emailComposerModal.classList.add('open');
};

window.closeEmailComposer = function() {
  emailComposerModal.classList.remove('open');
};

if (topbarComposeBtn) topbarComposeBtn.addEventListener('click', () => openEmailComposer());
if (inboxComposeBtn) inboxComposeBtn.addEventListener('click', () => openEmailComposer());

if (emailComposerForm) {
  emailComposerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const to = document.getElementById('emailTo').value.trim();
    const recipientName = document.getElementById('emailRecipientName').value.trim();
    const subject = document.getElementById('emailSubject').value.trim();
    const message = document.getElementById('emailBody').value.trim();

    if (!to || !subject || !message) {
      showAdminToast('Please fill all required fields (*)');
      return;
    }

    sendEmailSubmitBtn.disabled = true;
    sendEmailSubmitBtn.innerHTML = '<span>Transmitting via Gmail SMTP...</span>';

    try {
      const res = await authFetch(`${API_BASE}/email/send`, {
        method: 'POST',
        body: JSON.stringify({ to, recipientName, subject, message })
      });
      const data = await res.json();

      sendEmailSubmitBtn.disabled = false;
      sendEmailSubmitBtn.innerHTML = '<span>Send Email via Gmail 🚀</span>';

      if (data.success) {
        showAdminToast('🚀 ' + data.message);
        closeEmailComposer();
      } else {
        showAdminToast('❌ Error: ' + data.error);
      }
    } catch (err) {
      sendEmailSubmitBtn.disabled = false;
      sendEmailSubmitBtn.innerHTML = '<span>Send Email via Gmail 🚀</span>';
      showAdminToast('Failed to send email. Check SMTP settings.');
    }
  });
}

// 10. Gmail SMTP Status & Diagnostics
const smtpStatusBadge = document.getElementById('smtpStatusBadge');
const gmailConfigForm = document.getElementById('gmailConfigForm');
const testSmtpBtn = document.getElementById('testSmtpBtn');

async function checkSmtpStatus() {
  if (!smtpStatusBadge) return;
  try {
    const res = await authFetch(`${API_BASE}/email/config`);
    const json = await res.json();
    if (json.success && json.data) {
      document.getElementById('smtpGmailUser').value = json.data.gmailUser || 'ratulshee6@gmail.com';
      if (json.data.isConfigured) {
        smtpStatusBadge.textContent = '● Gmail SMTP Ready';
        smtpStatusBadge.className = 'badge-tag smtp-ready';
      } else {
        smtpStatusBadge.textContent = '⚠️ App Password Needed';
        smtpStatusBadge.className = 'badge-tag smtp-pending';
      }
    }
  } catch (e) {
    smtpStatusBadge.textContent = 'Offline';
  }
}

if (gmailConfigForm) {
  gmailConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const gmailUser = document.getElementById('smtpGmailUser').value.trim();
    const gmailAppPassword = document.getElementById('smtpAppPass').value.trim();

    try {
      const res = await authFetch(`${API_BASE}/email/config`, {
        method: 'POST',
        body: JSON.stringify({ gmailUser, gmailAppPassword })
      });
      const data = await res.json();
      if (data.success) {
        showAdminToast('✅ ' + data.message);
        checkSmtpStatus();
      }
    } catch (e) {
      showAdminToast('Failed to save SMTP config.');
    }
  });
}

if (testSmtpBtn) {
  testSmtpBtn.addEventListener('click', async () => {
    showAdminToast('Sending diagnostic email...');
    try {
      const res = await authFetch(`${API_BASE}/email/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showAdminToast('🎉 ' + data.message);
      } else {
        showAdminToast('❌ ' + data.error);
      }
    } catch (e) {
      showAdminToast('Test email failed. Check password.');
    }
  });
}

// 11. Settings: Change Password
const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPass').value;
    const newPassword = document.getElementById('newPass').value;

    try {
      const res = await authFetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showAdminToast('✅ Password updated successfully!');
        passwordForm.reset();
      } else {
        showAdminToast('❌ ' + data.error);
      }
    } catch (e) {
      showAdminToast('Password update failed.');
    }
  });
}

// 12. Settings: One-Click JSON Backup & Restore
const exportBackupBtn = document.getElementById('exportBackupBtn');
const importBackupFile = document.getElementById('importBackupFile');
const reseedDbBtn = document.getElementById('reseedDbBtn');

if (exportBackupBtn) {
  exportBackupBtn.addEventListener('click', async () => {
    showAdminToast('Generating JSON backup snapshot...');
    try {
      const res = await authFetch(`${API_BASE}/portfolio/export`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showAdminToast('📥 JSON Backup Downloaded!');
    } catch (err) {
      showAdminToast('Export failed.');
    }
  });
}

if (importBackupFile) {
  importBackupFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target.result);
        showAdminToast('Restoring database from backup...');

        const res = await authFetch(`${API_BASE}/portfolio/import`, {
          method: 'POST',
          body: JSON.stringify({ backup })
        });
        const data = await res.json();

        if (data.success) {
          showAdminToast('🎉 ' + data.message);
          loadAllDashboardData();
        } else {
          showAdminToast('❌ Restore failed: ' + data.error);
        }
      } catch (err) {
        showAdminToast('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  });
}

if (reseedDbBtn) {
  reseedDbBtn.addEventListener('click', async () => {
    if (!confirm('⚠️ This will reset all projects, skills, and bio to original showcase data. Proceed?')) return;
    try {
      const res = await authFetch(`${API_BASE}/seed`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showAdminToast('🎉 Database reset & re-seeded with showcase content!');
        loadAllDashboardData();
      }
    } catch (err) {
      showAdminToast('Re-seed failed.');
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
