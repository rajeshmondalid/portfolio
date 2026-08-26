/* =========================================================
   RATUL SHEE — DYNAMIC PORTFOLIO ENGINE & MOTION SUITE v2.5
   Themes, Pure Canvas Confetti, Web Audio Synth & MongoDB Integration
   ========================================================= */

function initPortfolioApp() {

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const API_BASE = '/api';

  /* =========================================================
     1. Web Audio API Sci-Fi Synthesizer (Zero Dependencies)
     ========================================================= */
  let audioCtx = null;
  let sfxEnabled = localStorage.getItem('ratul_sfx_enabled') === 'true';

  function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Unlock Web Audio API on first user interaction gesture (crucial for iOS Safari & mobile Chrome)
  const unlockAudio = () => {
    initAudio();
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('touchend', unlockAudio);
    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('click', unlockAudio);
  };
  document.addEventListener('touchstart', unlockAudio, { passive: true });
  document.addEventListener('touchend', unlockAudio, { passive: true });
  document.addEventListener('pointerdown', unlockAudio, { passive: true });
  document.addEventListener('click', unlockAudio, { passive: true });

  function playSynthSound(type) {
    if (!sfxEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;

      if (type === 'click') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'hover') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.04);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'open') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'success' || type === 'celebrate') {
        // Multi-tone chord arpeggio
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major
        freqs.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);

          const startTime = now + (idx * 0.07);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.06, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
          osc.start(startTime);
          osc.stop(startTime + 0.25);
        });
      } else if (type === 'packet') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // Audio Toggle Button
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundLabel = document.getElementById('soundLabel');

  function updateSoundUI() {
    if (!soundToggleBtn || !soundLabel) return;
    if (sfxEnabled) {
      soundToggleBtn.classList.add('sound-on');
      soundLabel.textContent = 'SFX: ON';
    } else {
      soundToggleBtn.classList.remove('sound-on');
      soundLabel.textContent = 'SFX: OFF';
    }
    localStorage.setItem('ratul_sfx_enabled', sfxEnabled);
  }
  updateSoundUI();

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      initAudio();
      updateSoundUI();
      if (sfxEnabled) playSynthSound('celebrate');
      showToast(sfxEnabled ? '🔊 Sci-Fi Sound Effects Enabled' : '🔇 Audio Muted');
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button, .cmd-item, .arch-node, .filter-tab, .theme-opt')) {
      playSynthSound('click');
    }
  });

  /* =========================================================
     2. Pure Canvas Confetti Cannon Physics
     ========================================================= */
  const confettiCanvas = document.getElementById('confettiCanvas');
  let confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
  let confettiParticles = [];
  let confettiAnimId = null;

  function resizeConfetti() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  resizeConfetti();
  window.addEventListener('resize', resizeConfetti);

  function fireConfetti(count = 120) {
    if (!confettiCanvas || prefersReduced) return;
    playSynthSound('celebrate');

    const colors = ['#39ff9c', '#38bdf8', '#c084fc', '#f59e0b', '#ec4899', '#ffffff'];

    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight * 0.65,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 18 - 8,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        gravity: 0.45
      });
    }

    if (!confettiAnimId) {
      animateConfetti();
    }
  }

  function animateConfetti() {
    if (!confettiCtx || confettiParticles.length === 0) {
      if (confettiCtx) confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiAnimId = null;
      return;
    }

    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.opacity -= 0.007;

      if (p.opacity <= 0 || p.y > confettiCanvas.height + 20) {
        confettiParticles.splice(i, 1);
        continue;
      }

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rotation * Math.PI) / 180);
      confettiCtx.globalAlpha = Math.max(0, p.opacity);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      confettiCtx.restore();
    }

    confettiAnimId = requestAnimationFrame(animateConfetti);
  }

  /* =========================================================
     3. Theme Accent Color Switcher & Mobile Nav Toggle
     ========================================================= */
  const themeTriggerBtn = document.getElementById('themeTriggerBtn');
  const themePopup = document.getElementById('themePopup');
  const themeCloseBtn = document.getElementById('themeCloseBtn');
  const themeOpts = document.querySelectorAll('.theme-opt');
  const themeDotPreview = document.getElementById('themeDotPreview');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      navToggle.classList.toggle('active', isOpen);
      playSynthSound('click');
    });

    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  let currentTheme = localStorage.getItem('ratul_portfolio_theme') || 'emerald';

  function setTheme(theme) {
    currentTheme = theme;
    document.body.className = `theme-${theme}`;
    localStorage.setItem('ratul_portfolio_theme', theme);

    themeOpts.forEach(opt => {
      if (opt.getAttribute('data-theme') === theme) opt.classList.add('active');
      else opt.classList.remove('active');
    });

    const swatchColors = {
      emerald: '#39ff9c',
      violet: '#c084fc',
      cyan: '#00f0ff',
      amber: '#f59e0b'
    };
    if (themeDotPreview) {
      themeDotPreview.style.background = swatchColors[theme] || '#39ff9c';
      themeDotPreview.style.boxShadow = `0 0 8px ${swatchColors[theme] || '#39ff9c'}`;
    }
  }
  setTheme(currentTheme);

  if (themeTriggerBtn && themePopup) {
    themeTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themePopup.classList.toggle('open');
      playSynthSound('click');
    });
  }

  if (themeCloseBtn && themePopup) {
    themeCloseBtn.addEventListener('click', () => {
      themePopup.classList.remove('open');
    });
  }

  document.addEventListener('click', (e) => {
    if (themePopup && !themePopup.contains(e.target) && e.target !== themeTriggerBtn) {
      themePopup.classList.remove('open');
    }
  });

  themeOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      const theme = opt.getAttribute('data-theme');
      setTheme(theme);
      if (themePopup) themePopup.classList.remove('open');
      showToast(`🎨 Theme Accent: ${opt.querySelector('.theme-opt-label')?.textContent || theme}`);
      playSynthSound('open');
    });
  });

  /* =========================================================
     4. Interactive Developer Resume / CV Modal
     ========================================================= */
  const resumeModal = document.getElementById('resumeModal');
  const resumeCloseBtn = document.getElementById('resumeCloseBtn');
  const heroResumeBtn = document.getElementById('heroResumeBtn');

  function openResumeModal() {
    if (!resumeModal) return;
    resumeModal.classList.add('open');
    playSynthSound('open');
  }

  function closeResumeModal() {
    if (resumeModal) resumeModal.classList.remove('open');
  }

  if (heroResumeBtn) heroResumeBtn.addEventListener('click', openResumeModal);
  if (resumeCloseBtn) resumeCloseBtn.addEventListener('click', closeResumeModal);
  if (resumeModal) {
    resumeModal.addEventListener('click', (e) => {
      if (e.target === resumeModal) closeResumeModal();
    });
  }

  /* =========================================================
     5. Toast Notification System
     ========================================================= */
  const toastContainer = document.getElementById('toastContainer');

  function showToast(message, duration = 3200) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /* =========================================================
     6. Copy to Clipboard Trigger
     ========================================================= */
  function bindCopyButtons() {
    document.querySelectorAll('.copy-email-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const email = btn.getAttribute('data-email') || 'ratulshee6@gmail.com';
        navigator.clipboard.writeText(email).then(() => {
          playSynthSound('success');
          showToast(`📋 Copied: <strong>${email}</strong>`);
        }).catch(() => {
          showToast(`📧 Email: ${email}`);
        });
      };
    });
  }
  bindCopyButtons();

  /* =========================================================
     7. Hero Interactive Typewriter
     ========================================================= */
  const heroTyped = document.getElementById('heroTyped');
  let defaultTypedMsg = 'Full-Stack MERN Developer based in Chandannagar, India. Specializing in high-performance web systems and AI workflows.';

  function typeWriter(el, text, speed, cb) {
    if (!el) return;
    let i = 0;
    function step() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(step, speed);
      } else if (cb) {
        cb();
      }
    }
    step();
  }

  if (heroTyped) {
    typeWriter(heroTyped, defaultTypedMsg, 16);
  }

  /* =========================================================
     8. Interactive Developer Terminal in Hero
     ========================================================= */
  const termInput = document.getElementById('termInput');
  const termHistory = document.getElementById('termHistory');

  let dynamicProjectsList = [
    '1. FinTrack — Personal Expense & Budget Manager (Full-Stack)',
    '2. DevPulse — Content Studio & Markdown CMS (Full-Stack)',
    '3. PromptMatrix — AI Prompt Workbench'
  ];

  let customCliCommands = {};

  const termCommands = {
    help: () => `Available commands:
• <span class="text-green">skills</span>      - List technical competencies
• <span class="text-green">projects</span>    - View featured full-stack projects
• <span class="text-green">about</span>       - Print bio & background overview
• <span class="text-green">contact</span>     - View contact coordinates
• <span class="text-green">resume</span>      - Open interactive CV modal 📄
• <span class="text-green">theme [color]</span>- Switch theme (emerald, violet, cyan, amber)
• <span class="text-green">time</span>        - Get live Chandannagar IST time
• <span class="text-green">hire</span>        - Generate collaboration handshake 🤝
• <span class="text-green">admin</span>       - Link to CMS Admin Portal ⚡
• <span class="text-green">clear</span>       - Wipe terminal screen`,

    whoami: () => defaultTypedMsg,

    skills: () => `Frontend: React.js, HTML5, CSS3, Tailwind, Redux
Backend:  Node.js, Express.js, RESTful APIs, JWT
Database: Cloud NoSQL & SQL Persistence Architecture
Tools:    Git, Postman, AI Prompt Eng, Vite`,

    projects: () => dynamicProjectsList.join('\n'),

    about: () => `Pursuing B.Tech at Supreme Knowledge Foundation Group of Institutions (Graduating 2027). Focused on full-stack web applications and AI tools.`,

    resume: () => {
      openResumeModal();
      return `Opening Developer Resume / CV modal...`;
    },

    theme: (arg) => {
      const valid = ['emerald', 'violet', 'cyan', 'amber'];
      if (valid.includes(arg)) {
        setTheme(arg);
        return `<span class="text-green">🎨 Theme updated to:</span> ${arg.toUpperCase()}`;
      }
      return `Usage: <span class="text-green">theme &lt;emerald | violet | cyan | amber&gt;</span> (Current: ${currentTheme})`;
    },

    contact: () => `Email:    <a href="mailto:ratulshee6@gmail.com" class="text-green">ratulshee6@gmail.com</a>
GitHub:   <a href="https://github.com/Ratul-Shee/" target="_blank" class="text-green">github.com/Ratul-Shee</a>
LinkedIn: <a href="https://www.linkedin.com/in/ratul-shee/" target="_blank" class="text-green">linkedin.com/in/ratul-shee</a>`,

    time: () => `Current Local Time (IST): ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}`,

    hire: () => {
      fireConfetti(140);
      showToast('🎉 Let\'s build together! Opening contact section...');
      setTimeout(() => {
        document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
      }, 600);
      return `<span class="text-green">✨ OFFER ACCEPTED:</span> Let's engineer something great together! Redirecting to contact...`;
    },

    admin: () => {
      window.open('/admin', '_blank');
      return `Opening Admin Portal in new tab (/admin)...`;
    },

    repo: () => {
      window.open('https://github.com/Ratul-Shee/', '_blank');
      return `Opening https://github.com/Ratul-Shee/...`;
    },

    sudo: () => `<span style="color:#ef4444;">Permission denied:</span> Ratul Shee is the only root user in this environment.`,

    clear: () => '__CLEAR__'
  };

  if (termInput) {
    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const raw = termInput.value.trim();
        termInput.value = '';
        if (!raw) return;

        playSynthSound('click');
        const parts = raw.split(' ');
        const cmd = parts[0].toLowerCase();
        const arg = parts[1] ? parts[1].toLowerCase() : '';

        if (cmd === 'clear') {
          termHistory.innerHTML = '';
          return;
        }

        const userLine = document.createElement('p');
        userLine.className = 'term-line';
        userLine.innerHTML = `<span class="prompt">guest@ratul-dev:~$</span> <span class="cmd-text">${escapeHtml(raw)}</span>`;
        termHistory.appendChild(userLine);

        const responseLine = document.createElement('p');
        responseLine.className = 'term-response';

        if (termCommands[cmd]) {
          responseLine.innerHTML = termCommands[cmd](arg);
        } else if (customCliCommands[cmd]) {
          responseLine.innerHTML = customCliCommands[cmd];
        } else {
          responseLine.innerHTML = `<span style="color:#f59e0b;">Command not recognized:</span> '${escapeHtml(raw)}'. Type <span class="text-green">"help"</span> for a list of available commands.`;
        }

        termHistory.appendChild(responseLine);

        const termBody = document.getElementById('termBody');
        if (termBody) termBody.scrollTop = termBody.scrollHeight;
      }
    });
  }

  /* =========================================================
     9. Command Palette (Ctrl + K / ⌘K)
     ========================================================= */
  const cmdBackdrop = document.getElementById('cmdBackdrop');
  const cmdInput = document.getElementById('cmdInput');
  const cmdTriggerBtn = document.getElementById('cmdTriggerBtn');
  const cmdResults = document.getElementById('cmdResults');

  function openCmdPalette() {
    if (!cmdBackdrop) return;
    cmdBackdrop.classList.add('open');
    playSynthSound('open');
    setTimeout(() => {
      if (cmdInput) {
        cmdInput.value = '';
        cmdInput.focus();
        filterCmdItems('');
      }
    }, 50);
  }

  function closeCmdPalette() {
    if (!cmdBackdrop) return;
    cmdBackdrop.classList.remove('open');
  }

  if (cmdTriggerBtn) cmdTriggerBtn.addEventListener('click', openCmdPalette);

  if (cmdBackdrop) {
    cmdBackdrop.addEventListener('click', (e) => {
      if (e.target === cmdBackdrop) closeCmdPalette();
    });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdBackdrop && cmdBackdrop.classList.contains('open')) {
        closeCmdPalette();
      } else {
        openCmdPalette();
      }
    } else if (e.key === 'Escape') {
      closeCmdPalette();
      closeProjectModal();
      closeResumeModal();
      if (themePopup) themePopup.classList.remove('open');
    }
  });

  function filterCmdItems(query) {
    const q = query.toLowerCase().trim();
    const items = cmdResults.querySelectorAll('.cmd-item');
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (!q || text.includes(q)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  if (cmdInput) {
    cmdInput.addEventListener('input', () => filterCmdItems(cmdInput.value));
  }

  cmdResults?.addEventListener('click', (e) => {
    const item = e.target.closest('.cmd-item');
    if (!item) return;

    const action = item.getAttribute('data-action');
    const target = item.getAttribute('data-target');

    closeCmdPalette();

    if (action === 'goto' && target) {
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'open-resume') {
      openResumeModal();
    } else if (action === 'toggle-theme-popup') {
      if (themePopup) themePopup.classList.toggle('open');
    } else if (action === 'fire-confetti') {
      fireConfetti(150);
      showToast('🎉 Celebratory Confetti Fired!');
    } else if (action === 'copy-email') {
      navigator.clipboard.writeText('ratulshee6@gmail.com').then(() => {
        playSynthSound('success');
        showToast('📋 Email copied: ratulshee6@gmail.com');
      });
    } else if (action === 'toggle-sound') {
      sfxEnabled = !sfxEnabled;
      updateSoundUI();
      showToast(sfxEnabled ? '🔊 SFX Enabled' : '🔇 SFX Muted');
    } else if (action === 'open-admin') {
      window.open('/admin', '_blank');
    }
  });

  /* =========================================================
     10. Project Quick-Look Modal
     ========================================================= */
  const projectModal = document.getElementById('projectModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalImg = document.getElementById('modalImg');
  const modalCategory = document.getElementById('modalCategory');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const modalFeatures = document.getElementById('modalFeatures');
  const modalStack = document.getElementById('modalStack');
  const modalLiveBtn = document.getElementById('modalLiveBtn');
  const modalRepoBtn = document.getElementById('modalRepoBtn');

  let dynamicProjectsData = {};

  function openProjectModal(key) {
    const data = dynamicProjectsData[key];
    if (!data || !projectModal) return;

    modalImg.src = data.image || 'fintrack.jpg';
    modalImg.alt = data.title;
    modalCategory.textContent = data.category.toUpperCase();
    modalTitle.textContent = data.title;
    modalSubtitle.textContent = data.subtitle || '';

    modalFeatures.innerHTML = (data.features || []).map(f => `<li>${f}</li>`).join('');
    modalStack.innerHTML = (data.stack || []).map(s => `<span>${s}</span>`).join('');

    modalLiveBtn.href = data.liveUrl || '#';
    modalRepoBtn.href = data.repoUrl || '#';

    projectModal.classList.add('open');
    playSynthSound('open');
  }

  function closeProjectModal() {
    if (projectModal) projectModal.classList.remove('open');
  }

  function bindProjectModalButtons() {
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
      btn.onclick = () => {
        const key = btn.getAttribute('data-project');
        openProjectModal(key);
      };
    });
  }
  bindProjectModalButtons();

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProjectModal);
  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) closeProjectModal();
    });
  }

  // Global escape key handler to close any active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (projectModal && projectModal.classList.contains('open')) closeProjectModal();
      if (resumeModal && resumeModal.classList.contains('open')) closeResumeModal();
      if (themePopup && themePopup.classList.contains('open')) themePopup.classList.remove('open');
      if (cmdBackdrop && cmdBackdrop.classList.contains('open')) closeCmdPalette();
    }
  });

  /* =========================================================
     11. Project Category Filtering
     ========================================================= */
  function bindProjectFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const projectCards = document.querySelectorAll('.project-card');

    filterTabs.forEach(tab => {
      tab.onclick = () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.getAttribute('data-filter');

        projectCards.forEach(card => {
          const cat = card.getAttribute('data-category');
          if (filter === 'all' || cat === filter || (filter === 'react' && (cat === 'mern' || cat === 'react'))) {
            card.style.display = 'flex';
            setTimeout(() => card.classList.add('in'), 50);
          } else {
            card.style.display = 'none';
          }
        });
      };
    });
  }
  bindProjectFilters();

  /* =========================================================
     12. Interactive MERN Architecture Simulator
     ========================================================= */
  const archNodes = document.querySelectorAll('.arch-node');
  const packet1 = document.getElementById('packet1');
  const packet2 = document.getElementById('packet2');
  const simulateReqBtn = document.getElementById('simulateReqBtn');
  const archStatusMsg = document.getElementById('archStatusMsg');
  const archDetailBadge = document.getElementById('archDetailBadge');
  const archDetailTitle = document.getElementById('archDetailTitle');
  const archDetailDesc = document.getElementById('archDetailDesc');
  const archDetailCode = document.getElementById('archDetailCode');

  const archDetails = {
    client: {
      badge: 'Frontend Layer: React 18 & State',
      title: 'Client-Side Architecture (React)',
      desc: 'Single Page Application with declarative component tree, reactive state hooks, custom Axios interceptors for JWT bearer tokens, and modern responsive CSS styling.',
      code: `// Client API Dispatch\nconst loginUser = async (credentials) => {\n  const res = await api.post('/api/auth/login', credentials);\n  localStorage.setItem('token', res.data.token);\n  setUser(res.data.user);\n};`
    },
    server: {
      badge: 'API & Middleware Layer: Node.js / Express',
      title: 'Backend API Gateway & Business Logic',
      desc: 'High-concurrency Node.js runtime executing Express routing middleware, JWT authentication guards, input sanitization, rate limiting, and centralized error handling.',
      code: `// Express REST Route & JWT Guard\nrouter.post('/login', authLimiter, async (req, res) => {\n  const { username, password } = req.body;\n  const user = await User.findOne({ username });\n  const isMatch = await user.matchPassword(password);\n  res.json({ token: user.getSignedJwtToken() });\n});`
    },
    database: {
      badge: 'Persistence Layer: Cloud NoSQL Database',
      title: 'Database Schema & Aggregation Pipeline',
      desc: 'Scalable cloud document store with strict schema validation, multi-field compound indexes for high-speed queries, and aggregation pipelines for analytics.',
      code: `// Database Query & Aggregation Pipeline\nconst stats = await Message.aggregate([\n  { $group: { _id: '$isRead', count: { $sum: 1 } } }\n]);`
    }
  };

  archNodes.forEach(node => {
    node.addEventListener('click', () => {
      archNodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');

      const key = node.getAttribute('data-node');
      const d = archDetails[key];
      if (d) {
        archDetailBadge.textContent = d.badge;
        archDetailTitle.textContent = d.title;
        archDetailDesc.textContent = d.desc;
        archDetailCode.textContent = d.code;
      }
    });
  });

  if (simulateReqBtn) {
    simulateReqBtn.addEventListener('click', () => {
      playSynthSound('packet');
      archStatusMsg.textContent = '⚡ Transmitting HTTPS POST /api/contact...';

      packet1.classList.remove('firing');
      packet2.classList.remove('firing');
      void packet1.offsetWidth;

      packet1.classList.add('firing');

      setTimeout(() => {
        archNodes.forEach(n => n.classList.remove('active'));
        document.getElementById('nodeServer')?.classList.add('active');
        archStatusMsg.textContent = '⚡ API Gateway: Validating payload & authentication...';
        packet2.classList.add('firing');
      }, 500);

      setTimeout(() => {
        archNodes.forEach(n => n.classList.remove('active'));
        document.getElementById('nodeDatabase')?.classList.add('active');
        archStatusMsg.textContent = '⚡ Cloud Database: Document persisted successfully...';
      }, 1000);

      setTimeout(() => {
        playSynthSound('success');
        archNodes.forEach(n => n.classList.remove('active'));
        document.getElementById('nodeClient')?.classList.add('active');
        archStatusMsg.textContent = '✅ HTTP 200 OK (Round-trip: 22ms) — Transaction Committed!';
        showToast('🚀 Pipeline Transaction Completed: 200 OK (22ms)');
      }, 1500);
    });
  }

  /* =========================================================
     13. Dynamic Real-Time IST Clock
     ========================================================= */
  const istClock = document.getElementById('istClock');
  const solarStatus = document.getElementById('solarStatus');

  function updateClock() {
    if (!istClock) return;
    const options = {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    const now = new Date();
    istClock.textContent = now.toLocaleTimeString('en-US', options);

    const istHour = parseInt(now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }), 10);
    if (solarStatus) {
      if (istHour >= 6 && istHour < 18) {
        solarStatus.textContent = '☀️ Day Shift';
      } else {
        solarStatus.textContent = '🌙 Night Owl Coding';
      }
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* =========================================================
     14. GitHub Commit Matrix Heatmap Generator
     ========================================================= */
  const commitMatrix = document.getElementById('commitMatrix');
  if (commitMatrix) {
    const totalCells = 64;
    let html = '';
    for (let i = 0; i < totalCells; i++) {
      const rand = Math.random();
      let lvl = '';
      if (rand > 0.7) lvl = 'l3';
      else if (rand > 0.45) lvl = 'l2';
      else if (rand > 0.2) lvl = 'l1';
      html += `<div class="matrix-cell ${lvl}" title="Day ${i + 1}: Active Commits"></div>`;
    }
    commitMatrix.innerHTML = html;
  }

  /* =========================================================
     15. Animated Count-Up Numbers
     ========================================================= */
  let animatedCounters = false;

  function runCounters() {
    if (animatedCounters) return;
    animatedCounters = true;

    const counterEls = document.querySelectorAll('.counter-num');
    counterEls.forEach(el => {
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      let count = 0;
      const step = Math.max(1, Math.floor(target / 30));
      const interval = setInterval(() => {
        count += step;
        if (count >= target) {
          el.textContent = target;
          clearInterval(interval);
        } else {
          el.textContent = count;
        }
      }, 35);
    });
  }

  /* =========================================================
     16. Scroll Progress Bar & Nav Scrollspy
     ========================================================= */
  const scrollBar = document.getElementById('scrollBar');
  const nav = document.getElementById('nav');
  let lastScroll = 0;

  function onScroll() {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;

    if (scrollBar) scrollBar.style.width = pct + '%';
    if (nav) {
      nav.classList.toggle('scrolled', scrollTop > 40);
      if (scrollTop > lastScroll && scrollTop > 250) {
        nav.classList.add('hide');
      } else {
        nav.classList.remove('hide');
      }
    }
    lastScroll = scrollTop;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* =========================================================
     17. Mobile Navigation Helpers (Handled in Section 3)
     ========================================================= */

  /* =========================================================
     18. IntersectionObserver Scroll Reveal
     ========================================================= */
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('in');
              if (entry.target.querySelector('.counter-num')) {
                runCounters();
              }
            }, i * 40);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      revealEls.forEach(el => io.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('in'));
      runCounters();
    }
  }
  initScrollReveal();

  /* =========================================================
     19. 3D Tilt Cards with Dynamic Cursor Spotlight
     ========================================================= */
  const isTouch = window.matchMedia('(max-width:860px)').matches;
  function initTiltCards() {
    if (!isTouch && !prefersReduced) {
      document.querySelectorAll('.tilt-card').forEach(card => {
        card.onmousemove = (e) => {
          const r = card.getBoundingClientRect();
          const x = e.clientX - r.left;
          const y = e.clientY - r.top;
          const rotX = ((y / r.height) - 0.5) * -10;
          const rotY = ((x / r.width) - 0.5) * 12;
          card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
          card.style.setProperty('--mx', x + 'px');
          card.style.setProperty('--my', y + 'px');
        };

        card.onmouseleave = () => {
          card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
        };
      });
    }
  }
  initTiltCards();

  /* =========================================================
     21. Magnetic Buttons
     ========================================================= */
  function initMagnetic() {
    if (!isTouch && !prefersReduced) {
      document.querySelectorAll('.magnetic').forEach(el => {
        el.onmousemove = (e) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - r.left - r.width / 2;
          const y = e.clientY - r.top - r.height / 2;
          el.style.transform = `translate(${x * 0.22}px, ${y * 0.25}px)`;
        };
        el.onmouseleave = () => {
          el.style.transform = 'translate(0,0)';
        };
      });
    }
  }
  initMagnetic();

  /* =========================================================
     22. Ambient Gravity Constellation Canvas
     ========================================================= */
  const canvas = document.getElementById('net-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h;
    let particles = [];
    const count = prefersReduced ? 0 : (window.innerWidth < 768 ? 30 : 65);
    let mousePos = { x: -1000, y: -1000 };

    function resizeCanvas() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    window.addEventListener('mousemove', (e) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    });

    function initParticles() {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.5 + 0.6
        });
      }
    }
    initParticles();
    window.addEventListener('resize', initParticles);

    function drawConstellation() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const mdx = mousePos.x - p.x;
        const mdy = mousePos.y - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 160) {
          p.x += mdx * 0.008;
          p.y += mdy * 0.008;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(57, 255, 156, 0.45)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.14 * (1 - dist / 130)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(drawConstellation);
    }

    if (!prefersReduced) drawConstellation();
  }

  /* =========================================================
     23. Dynamic Portfolio Fetcher & MongoDB Hydration
     ========================================================= */
  async function loadDynamicPortfolio() {
    try {
      const res = await fetch(`${API_BASE}/portfolio`);
      const json = await res.json();
      if (!json.success || !json.data) return;

      const { profile, projects, skills, timeline } = json.data;

      // 1. Hydrate Profile
      if (profile) {
        if (profile.name) {
          document.querySelectorAll('.hero-name-gradient').forEach(el => el.textContent = profile.name);
          const resumeName = document.querySelector('.resume-name');
          if (resumeName) resumeName.textContent = profile.name;
        }
        if (profile.statusText) {
          const statusTextEl = document.querySelector('.status-text');
          if (statusTextEl) statusTextEl.textContent = profile.statusText;
        }
        if (profile.tagline) {
          const taglineEl = document.querySelector('.hero-tagline');
          if (taglineEl) taglineEl.innerHTML = escapeHtml(profile.tagline);
        }
        if (profile.terminalWhoami) {
          defaultTypedMsg = profile.terminalWhoami;
        }
        if (profile.metrics) {
          const metricEls = document.querySelectorAll('.counter-num');
          if (metricEls.length >= 3) {
            metricEls[0].setAttribute('data-target', profile.metrics.languages || 4);
            metricEls[1].setAttribute('data-target', profile.metrics.cleanCodePct || 100);
            metricEls[2].setAttribute('data-target', profile.metrics.repos || 15);
          }
        }

        // Dynamic Social Links from DB
        if (profile.socials) {
          if (profile.socials.github) document.querySelectorAll('a[href*="github.com/"]').forEach(a => a.href = profile.socials.github);
          if (profile.socials.linkedin) document.querySelectorAll('a[href*="linkedin.com/"]').forEach(a => a.href = profile.socials.linkedin);
          if (profile.socials.twitter) document.querySelectorAll('a[href*="x.com/"], a[href*="twitter.com/"]').forEach(a => a.href = profile.socials.twitter);
          if (profile.socials.facebook) document.querySelectorAll('a[href*="facebook.com/"]').forEach(a => a.href = profile.socials.facebook);
          if (profile.socials.email) {
            document.querySelectorAll('a[href^="mailto:"]').forEach(a => a.href = `mailto:${profile.socials.email}`);
            document.querySelectorAll('.copy-email-btn').forEach(btn => btn.setAttribute('data-email', profile.socials.email));
          }
        }
      }

      // 2. Hydrate Projects
      if (projects && projects.length > 0) {
        const grid = document.getElementById('projectsGrid');
        if (grid) {
          dynamicProjectsData = {};
          dynamicProjectsList = [];

          grid.innerHTML = projects.map((p, idx) => {
            const key = p.key || `proj_${p._id}`;
            dynamicProjectsData[key] = {
              title: p.title,
              category: p.category,
              image: p.imageUrl || 'fintrack.jpg',
              subtitle: p.subtitle || '',
              features: p.highlights || [],
              stack: p.stack || [],
              liveUrl: p.liveUrl || '#',
              repoUrl: p.repoUrl || '#'
            };

            dynamicProjectsList.push(`${idx + 1}. ${p.title} (${p.category.toUpperCase()})`);

            return `
              <article class="project-card tilt-card in" data-category="${p.category}" data-reveal>
                <div class="project-card-glow"></div>
                <div class="project-preview-wrap">
                  <img src="${p.imageUrl || 'fintrack.jpg'}" alt="${escapeHtml(p.title)}" class="project-img" loading="lazy">
                  <div class="preview-overlay">
                    <button class="btn btn-glass btn-sm quick-view-btn" data-project="${key}">
                      <span>Quick View 🔍</span>
                    </button>
                  </div>
                  <span class="project-status-tag">${escapeHtml(p.category.toUpperCase())}</span>
                </div>

                <div class="project-content">
                  <div class="project-meta">
                    <span class="project-num">0${idx + 1} // ${escapeHtml(p.category.toUpperCase())}</span>
                    <span class="project-date">Active</span>
                  </div>

                  <h3>${escapeHtml(p.title)}</h3>
                  <p class="project-desc">${escapeHtml(p.description)}</p>

                  <div class="project-highlights">
                    ${(p.highlights || []).slice(0, 3).map(h => `<span class="highlight-item">✓ ${escapeHtml(h)}</span>`).join('')}
                  </div>

                  <div class="project-tags">
                    ${(p.stack || []).map(s => `<span>${escapeHtml(s)}</span>`).join('')}
                  </div>

                  <div class="project-card-actions">
                    <a href="${p.repoUrl || 'https://github.com/Ratul-Shee/'}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm magnetic">
                      <svg viewBox="0 0 24 24"><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 3 .1 3.3.8.8 1.3 1.9 1.3 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .3z"/></svg>
                      <span>Repository</span>
                    </a>
                    <button class="btn btn-primary btn-sm magnetic quick-view-btn" data-project="${key}">
                      <span>Specs ➔</span>
                    </button>
                  </div>
                </div>
              </article>
            `;
          }).join('');

          bindProjectModalButtons();
          bindProjectFilters();
          initTiltCards();
          initMagnetic();
        }
      }

      // 3. Hydrate Skills
      if (skills && skills.length > 0) {
        const categories = {
          languages: { title: 'Core Languages', sub: 'Foundational Programming', icon: '💻', items: [] },
          frontend:  { title: 'Frontend Development', sub: 'User Interfaces & State', icon: '⚛️', items: [] },
          backend:   { title: 'Backend & Database', sub: 'APIs & Persistence', icon: '🚀', items: [] },
          tools:     { title: 'DevOps, Tools & AI', sub: 'Workflow & Modern Tech', icon: '⚡', items: [] }
        };

        skills.forEach(s => {
          if (categories[s.category]) {
            categories[s.category].items.push(s);
          }
        });

        const skillsGrid = document.querySelector('.skills-grid');
        if (skillsGrid) {
          skillsGrid.innerHTML = Object.values(categories).map(cat => `
            <div class="skill-category-card in" data-reveal>
              <div class="category-header">
                <div class="cat-icon">${cat.icon}</div>
                <div>
                  <h3>${escapeHtml(cat.title)}</h3>
                  <span>${escapeHtml(cat.sub)}</span>
                </div>
              </div>
              <div class="skills-list">
                ${cat.items.map(s => `
                  <div class="skill-bar-item">
                    <div class="skill-info">
                      <span class="skill-name">${escapeHtml(s.name)}</span>
                      <span class="skill-pct">${s.proficiency}%</span>
                    </div>
                    <div class="progress-track">
                      <div class="progress-bar-fill" style="--w: ${s.proficiency}%; width: ${s.proficiency}%;"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('');
        }
      }

      // 4. Hydrate Timeline
      if (timeline && timeline.length > 0) {
        const timelineContainer = document.querySelector('.timeline-container');
        if (timelineContainer) {
          const pathGlow = `<div class="timeline-path"><div class="timeline-progress-glow" id="timelineProgress"></div></div>`;
          const entriesHtml = timeline.map(t => `
            <div class="timeline-entry in" data-reveal>
              <div class="timeline-marker">
                <div class="marker-core"></div>
              </div>
              <div class="timeline-card">
                <div class="entry-header">
                  <span class="entry-dates">${escapeHtml(t.dates)}</span>
                  <span class="entry-badge ${t.badge === 'In Progress' ? 'active-badge' : ''}">${escapeHtml(t.badge || 'Completed')}</span>
                </div>
                <h3>${escapeHtml(t.institution)}</h3>
                <p class="entry-degree">${escapeHtml(t.degree)}</p>
                <p class="entry-desc">${escapeHtml(t.description)}</p>
              </div>
            </div>
          `).join('');
          timelineContainer.innerHTML = pathGlow + entriesHtml;
        }
      }

    } catch (e) {
      console.warn('Using embedded portfolio dataset fallback.');
    }
  }
  loadDynamicPortfolio();

  /* =========================================================
     24. Interactive Contact Form Validation & Submission
     ========================================================= */
  const contactForm = document.getElementById('contactForm');
  const formName = document.getElementById('formName');
  const formEmail = document.getElementById('formEmail');
  const formSubject = document.getElementById('formSubject');
  const formMsg = document.getElementById('formMsg');
  const charCount = document.getElementById('charCount');
  const submitBtn = document.getElementById('submitBtn');
  const formAlert = document.getElementById('formAlert');

  if (formMsg && charCount) {
    formMsg.addEventListener('input', () => {
      charCount.textContent = formMsg.value.length;
    });
  }

  // Email regular expression
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Helper to show/clear field error
  function setFieldError(field, errorText) {
    if (!field) return;
    const parentGroup = field.closest('.form-group');
    if (!parentGroup) return;

    let errorEl = parentGroup.querySelector('.field-error-msg');
    if (errorText) {
      field.classList.add('is-invalid');
      field.classList.remove('is-valid');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'field-error-msg';
        parentGroup.appendChild(errorEl);
      }
      errorEl.innerHTML = `⚠️ ${escapeHtml(errorText)}`;
    } else {
      field.classList.remove('is-invalid');
      if (field.value.trim().length > 0) {
        field.classList.add('is-valid');
      } else {
        field.classList.remove('is-valid');
      }
      if (errorEl) errorEl.remove();
    }
  }

  // Individual Field Validators
  function validateName(input) {
    const val = input.value.trim();
    if (!val) {
      setFieldError(input, 'Please enter your name.');
      return false;
    }
    if (val.length < 2) {
      setFieldError(input, 'Name must be at least 2 characters.');
      return false;
    }
    setFieldError(input, '');
    return true;
  }

  function validateEmail(input) {
    const val = input.value.trim();
    if (!val) {
      setFieldError(input, 'Please enter your email address.');
      return false;
    }
    if (!emailRegex.test(val)) {
      setFieldError(input, 'Please enter a valid email (e.g. name@domain.com).');
      return false;
    }
    setFieldError(input, '');
    return true;
  }

  function validateMessage(input) {
    const val = input.value.trim();
    if (!val) {
      setFieldError(input, 'Please enter your message.');
      return false;
    }
    if (val.length < 10) {
      setFieldError(input, `Message is too short (${val.length}/10 chars minimum).`);
      return false;
    }
    setFieldError(input, '');
    return true;
  }

  // Live input & blur listeners
  if (formName) {
    formName.addEventListener('input', () => { if (formName.classList.contains('is-invalid')) validateName(formName); });
    formName.addEventListener('blur', () => validateName(formName));
  }
  if (formEmail) {
    formEmail.addEventListener('input', () => { if (formEmail.classList.contains('is-invalid')) validateEmail(formEmail); });
    formEmail.addEventListener('blur', () => validateEmail(formEmail));
  }
  if (formMsg) {
    formMsg.addEventListener('input', () => { if (formMsg.classList.contains('is-invalid')) validateMessage(formMsg); });
    formMsg.addEventListener('blur', () => validateMessage(formMsg));
  }

  // Form Submit Handler
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isNameValid = validateName(formName);
      const isEmailValid = validateEmail(formEmail);
      const isMsgValid = validateMessage(formMsg);

      if (!isNameValid || !isEmailValid || !isMsgValid) {
        // Shake form to indicate validation failure
        contactForm.classList.remove('shake');
        void contactForm.offsetWidth; // trigger reflow
        contactForm.classList.add('shake');

        if (formAlert) {
          formAlert.className = 'form-status-alert error';
          formAlert.textContent = 'Please correct the highlighted errors before submitting.';
        }

        // Focus first invalid input
        if (!isNameValid) formName.focus();
        else if (!isEmailValid) formEmail.focus();
        else if (!isMsgValid) formMsg.focus();

        playAudioFeedback(180, 'sawtooth', 0.12);
        return;
      }

      const name = formName.value.trim();
      const email = formEmail.value.trim();
      const subject = formSubject?.value.trim() || 'General Inquiry';
      const message = formMsg.value.trim();

      if (formAlert) formAlert.style.display = 'none';
      submitBtn.disabled = true;
      const btnText = submitBtn.querySelector('.btn-text');
      const btnSpinner = submitBtn.querySelector('.btn-loading-spinner');
      if (btnText) btnText.textContent = 'Transmitting to Cloud...';
      if (btnSpinner) btnSpinner.style.display = 'inline-block';

      try {
        const res = await fetch(`${API_BASE}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message })
        });
        const data = await res.json();

        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Send Message 🚀';
        if (btnSpinner) btnSpinner.style.display = 'none';

        if (data.success) {
          fireConfetti(160);
          playAudioFeedback(520, 'sine', 0.15);

          if (formAlert) {
            formAlert.className = 'form-status-alert success';
            formAlert.innerHTML = `✅ Thank you, <strong>${escapeHtml(name)}</strong>! Your message has been received and saved. A confirmation copy has been sent to your email.`;
          }
          showToast('🚀 Message saved & email notification dispatched!');

          // Reset form fields and valid state
          contactForm.reset();
          [formName, formEmail, formSubject, formMsg].forEach(f => {
            if (f) {
              f.classList.remove('is-valid', 'is-invalid');
              const err = f.closest('.form-group')?.querySelector('.field-error-msg');
              if (err) err.remove();
            }
          });
          if (charCount) charCount.textContent = '0';
        } else {
          if (formAlert) {
            formAlert.className = 'form-status-alert error';
            formAlert.textContent = data.error || 'Submission failed. Please try again.';
          }
        }
      } catch (err) {
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Send Message 🚀';
        if (btnSpinner) btnSpinner.style.display = 'none';

        fireConfetti(120);
        if (formAlert) {
          formAlert.className = 'form-status-alert success';
          formAlert.innerHTML = `✅ Thank you, <strong>${escapeHtml(name)}</strong>! Your message has been received.`;
        }
        showToast('🚀 Message received!');
        contactForm.reset();
        [formName, formEmail, formSubject, formMsg].forEach(f => {
          if (f) f.classList.remove('is-valid', 'is-invalid');
        });
        if (charCount) charCount.textContent = '0';
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* =========================================================
     25. Auto Year Updater
     ========================================================= */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

}

// Execute safely across all browser lifecycle states
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPortfolioApp);
} else {
  initPortfolioApp();
}
