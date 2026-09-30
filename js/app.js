/**
 * Main Application Controller for Arocha Boonlue (Bumbim) Portfolio
 */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize State
  let currentData = portfolioStorage.getData();
  let isLoggedIn = sessionStorage.getItem("bumbim_admin_logged_in") === "true";
  let isQuickEdit = false;
  let activeTab = "home";

  // 2. Initialize Theme & Effects from stored settings
  applyThemeSettings(currentData.themeSettings);

  // 3. Render all dynamic UI components
  renderAll(currentData);

  // 4. Setup Event Listeners
  setupNavigation();
  setupHiddenLogin();
  setupAdminFeatures();
  setupUniversalUploader();
  setupPrint();

  // Load custom fonts from IndexedDB if any
  loadStoredCustomFonts();

  // -------------------------------------------------------------
  // RENDER FUNCTIONS
  // -------------------------------------------------------------

  function renderAll(data) {
    renderProfile(data.profile);
    renderStats(data.stats);
    renderSkills(data.skills);
    renderEducation(data.education);
    renderCourses(data.courses);
    renderActivities(data.activities);
  }

  function renderProfile(profile) {
    if (!profile) return;
    // Hero & Header
    const brandAvatar = document.getElementById("nav-brand-avatar");
    const brandName = document.getElementById("nav-brand-name");
    const heroAvatar = document.getElementById("hero-avatar");
    const heroName = document.getElementById("hero-name");
    const heroNickname = document.getElementById("hero-nickname");
    const heroTitle = document.getElementById("hero-title");
    const heroUni = document.getElementById("hero-uni");
    const heroFac = document.getElementById("hero-fac");
    const heroBio = document.getElementById("hero-bio");
    const heroBadge = document.getElementById("hero-badge");
    const heroMajorPill = document.getElementById("hero-major-pill");

    if (brandAvatar) brandAvatar.src = profile.avatar || "assets/images/profile_1.jpg";
    if (brandName) brandName.textContent = `${profile.nickname} ${profile.name.split(" ")[1] || ""}`;
    if (heroAvatar) heroAvatar.src = profile.avatar || "assets/images/profile_1.jpg";
    if (heroName) heroName.textContent = profile.name;
    if (heroNickname) heroNickname.textContent = profile.nickname;
    if (heroTitle) heroTitle.textContent = profile.title;
    if (heroUni) heroUni.textContent = profile.university;
    if (heroFac) heroFac.textContent = profile.faculty;
    if (heroBio) heroBio.textContent = profile.bio;
    if (heroBadge) heroBadge.textContent = profile.statusBadge;
    if (heroMajorPill) heroMajorPill.textContent = profile.major;

    // Profile Page Sidebar & Grid
    const profilePageAvatar = document.getElementById("profile-page-avatar");
    const profilePageName = document.getElementById("profile-page-name");
    const profilePageNickname = document.getElementById("profile-page-nickname");
    const profilePageMotto = document.getElementById("profile-page-motto");
    const profilePagePhone = document.getElementById("profile-page-phone");
    const profilePageEmail = document.getElementById("profile-page-email");
    const homeStudentId = document.getElementById("home-student-id");
    const homeMotto = document.getElementById("home-motto");

    if (profilePageAvatar) profilePageAvatar.src = profile.avatar || "assets/images/profile_1.jpg";
    if (profilePageName) profilePageName.textContent = profile.name;
    if (profilePageNickname) profilePageNickname.textContent = profile.nickname;
    if (profilePageMotto) profilePageMotto.textContent = profile.motto;
    if (profilePagePhone) profilePagePhone.textContent = profile.phone;
    if (profilePageEmail) profilePageEmail.textContent = profile.email;
    if (homeStudentId) homeStudentId.textContent = profile.studentId;
    if (homeMotto) homeMotto.textContent = `"${profile.motto}"`;

    const gridName = document.getElementById("grid-name");
    const gridNickname = document.getElementById("grid-nickname");
    const gridStudentId = document.getElementById("grid-studentId");
    const gridBirthdate = document.getElementById("grid-birthdate");
    const gridAge = document.getElementById("grid-age");
    const gridNationality = document.getElementById("grid-nationality");
    const gridEthnicity = document.getElementById("grid-ethnicity");
    const gridUni = document.getElementById("grid-uni");
    const gridFac = document.getElementById("grid-fac");
    const gridMajor = document.getElementById("grid-major");

    if (gridName) gridName.textContent = profile.name;
    if (gridNickname) gridNickname.textContent = profile.nickname;
    if (gridStudentId) gridStudentId.textContent = profile.studentId;
    if (gridBirthdate) gridBirthdate.textContent = profile.birthdate;
    if (gridAge) gridAge.textContent = profile.age;
    if (gridNationality) gridNationality.textContent = profile.nationality;
    if (gridEthnicity) gridEthnicity.textContent = profile.ethnicity;
    if (gridUni) gridUni.textContent = profile.university;
    if (gridFac) gridFac.textContent = profile.faculty;
    if (gridMajor) gridMajor.textContent = profile.major;

    // Fill form in admin drawer
    const editName = document.getElementById("edit-profile-name");
    const editNick = document.getElementById("edit-profile-nickname");
    const editId = document.getElementById("edit-profile-studentId");
    const editPhone = document.getElementById("edit-profile-phone");
    const editEmail = document.getElementById("edit-profile-email");
    const editMotto = document.getElementById("edit-profile-motto");
    const editBio = document.getElementById("edit-profile-bio");

    if (editName) editName.value = profile.name || "";
    if (editNick) editNick.value = profile.nickname || "";
    if (editId) editId.value = profile.studentId || "";
    if (editPhone) editPhone.value = profile.phone || "";
    if (editEmail) editEmail.value = profile.email || "";
    if (editMotto) editMotto.value = profile.motto || "";
    if (editBio) editBio.value = profile.bio || "";
  }

  function renderStats(stats) {
    const container = document.getElementById("stats-container");
    if (!container || !stats) return;

    container.innerHTML = stats.map(st => {
      let iconClass = "fa-solid fa-award";
      if (st.icon === "star") iconClass = "fa-solid fa-star";
      if (st.icon === "folder-check") iconClass = "fa-solid fa-folder-open";
      if (st.icon === "heart") iconClass = "fa-solid fa-heart";

      return `
        <div class="stat-card">
          <div class="stat-icon-wrap">
            <i class="${iconClass}"></i>
          </div>
          <div>
            <div class="stat-value">${st.value}</div>
            <div class="stat-label">${st.label}</div>
            <span class="stat-badge">${st.badge}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderSkills(skills) {
    const container = document.getElementById("skills-container");
    if (!container || !skills) return;

    container.innerHTML = skills.map(cat => `
      <div class="skill-category">
        <h5 class="skill-category-title">
          <i class="fa-solid fa-circle-dot" style="color: var(--primary); font-size: 0.75rem;"></i>
          ${cat.category}
        </h5>
        ${cat.items.map(item => `
          <div class="skill-bar-wrapper">
            <div class="skill-info">
              <span class="skill-name">${item.name}</span>
              <span class="skill-percent">${item.level}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${item.level}%;"></div>
            </div>
          </div>
        `).join("")}
      </div>
    `).join("");
  }

  function renderEducation(education) {
    const container = document.getElementById("education-timeline-container");
    const drawerList = document.getElementById("drawer-edu-list");
    if (!container || !education) return;

    container.innerHTML = education.map((edu, idx) => `
      <div class="timeline-item">
        <div class="timeline-marker">
          <i class="fa-solid fa-graduation-cap"></i>
        </div>
        <div class="timeline-card">
          <div class="timeline-header">
            <h4 class="timeline-level">${edu.level}</h4>
            <span class="timeline-gpa-badge">${edu.badge || `GPA: ${edu.gpa}`}</span>
          </div>
          <div class="timeline-institution">${edu.institution}</div>
          <div class="timeline-period"><i class="fa-regular fa-calendar"></i> ${edu.period}</div>
          <p class="timeline-desc">${edu.description}</p>
        </div>
      </div>
    `).join("");

    if (drawerList) {
      drawerList.innerHTML = education.map(edu => `
        <div style="background: var(--bg-page); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 0.88rem;">${edu.level}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${edu.institution} (${edu.gpa})</div>
          </div>
          <button class="admin-action-btn btn-danger btn-delete-edu" data-id="${edu.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `).join("");
    }
  }

  function renderCourses(courses) {
    const container = document.getElementById("courses-list-container");
    const drawerList = document.getElementById("drawer-courses-list");
    if (!container || !courses) return;

    container.innerHTML = courses.map(course => `
      <div class="course-card">
        <div class="course-meta">
          <span class="course-code">${course.code}</span>
          <span class="course-category"><i class="fa-solid fa-tag"></i> ${course.category}</span>
        </div>
        <h3 class="course-name">${course.name}</h3>
        <p class="course-description">${course.description}</p>

        ${course.artifacts && course.artifacts.length ? `
          <div class="artifacts-wrapper">
            <h5 class="artifacts-title"><i class="fa-solid fa-folder-tree" style="color: var(--primary);"></i> ชิ้นงานและโครงงานในรายวิชา</h5>
            <div class="artifacts-grid">
              ${course.artifacts.map(art => `
                <div class="artifact-item">
                  <div>
                    <h6 class="artifact-name">${art.title}</h6>
                    <p class="artifact-desc">${art.desc}</p>
                  </div>
                  ${art.file ? `
                    <a href="${art.file}" target="_blank" class="artifact-action" title="เปิดเอกสารชิ้นงาน">
                      <i class="fa-solid fa-file-pdf"></i> เปิดเอกสาร / ดาวน์โหลด (${art.type || 'PDF'})
                    </a>
                  ` : `
                    <span style="font-size: 0.78rem; color: var(--text-muted);">
                      <i class="fa-solid fa-circle-check" style="color: var(--accent-mint);"></i> ชิ้นงานโครงงานภาคปฏิบัติ
                    </span>
                  `}
                </div>
              `).join("")}
            </div>
          </div>
        ` : ''}
      </div>
    `).join("");

    if (drawerList) {
      drawerList.innerHTML = courses.map(c => `
        <div style="background: var(--bg-page); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 0.88rem;">${c.code}: ${c.name}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${c.category} (${c.artifacts ? c.artifacts.length : 0} ชิ้นงาน)</div>
          </div>
          <button class="admin-action-btn btn-danger btn-delete-course" data-id="${c.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `).join("");
    }
  }

  function renderActivities(activities, filter = "all") {
    const container = document.getElementById("activities-grid-container");
    const drawerList = document.getElementById("drawer-activities-list");
    if (!container || !activities) return;

    const filtered = filter === "all" ? activities : activities.filter(a => a.category === filter);

    container.innerHTML = filtered.map(act => `
      <div class="activity-card">
        <div class="activity-thumb-wrapper">
          <img src="${act.image || 'assets/images/activity_1.jpg'}" alt="${act.title}" class="activity-thumb">
          <span class="activity-category-tag">${act.category}</span>
        </div>
        <div class="activity-body">
          <div class="activity-date"><i class="fa-regular fa-clock"></i> ${act.date}</div>
          <h4 class="activity-card-title">${act.title}</h4>
          <p class="activity-card-desc">${act.description}</p>
          <div class="activity-tags">
            ${(act.tags || []).map(t => `<span class="tag-pill">#${t}</span>`).join("")}
          </div>
          <div class="activity-footer">
            <span class="activity-view-btn btn-view-activity" data-id="${act.id}">
              <i class="fa-solid fa-expand"></i> ดูรายละเอียด
            </span>
            ${act.document ? `
              <a href="${act.document}" target="_blank" class="activity-view-btn" style="color: var(--secondary);">
                <i class="fa-solid fa-file-lines"></i> ดูเอกสารแนบ
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `).join("");

    if (drawerList) {
      drawerList.innerHTML = activities.map(act => `
        <div style="background: var(--bg-page); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <img src="${act.image || 'assets/images/activity_1.jpg'}" style="width: 38px; height: 38px; border-radius: 4px; object-fit: cover;">
            <div>
              <strong style="font-size: 0.85rem;">${act.title}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${act.category} (${act.date})</div>
            </div>
          </div>
          <button class="admin-action-btn btn-danger btn-delete-activity" data-id="${act.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `).join("");
    }
  }

  // -------------------------------------------------------------
  // NAVIGATION & TAB SWITCHING
  // -------------------------------------------------------------

  function setupNavigation() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const sections = document.querySelectorAll(".tab-section");
    const mobileMenuBtn = document.getElementById("btn-mobile-menu");
    const navTabs = document.getElementById("nav-tabs");

    function switchTab(tabId) {
      activeTab = tabId;
      portfolioAudio.playPop();

      tabButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabId);
      });

      sections.forEach(sec => {
        if (sec.id === `tab-${tabId}`) {
          sec.classList.add("active");
        } else {
          sec.classList.remove("active");
        }
      });

      // Update URL hash without jumping
      history.replaceState(null, null, `#${tabId}`);
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (navTabs && navTabs.classList.contains("mobile-open")) {
        navTabs.classList.remove("mobile-open");
      }
    }

    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    // Quick links with data-go-tab
    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-go-tab]");
      if (target) {
        e.preventDefault();
        switchTab(target.dataset.goTab);
      }
    });

    // Brand logo returns to home
    const brandHomeBtn = document.getElementById("brand-home-btn");
    if (brandHomeBtn) {
      brandHomeBtn.addEventListener("click", () => switchTab("home"));
    }

    // Hero buttons
    const heroBtnExplore = document.getElementById("hero-btn-explore");
    if (heroBtnExplore) {
      heroBtnExplore.addEventListener("click", () => switchTab("activities"));
    }
    const heroBtnContact = document.getElementById("hero-btn-contact");
    if (heroBtnContact) {
      heroBtnContact.addEventListener("click", () => switchTab("profile"));
    }

    // Mobile menu toggle
    if (mobileMenuBtn && navTabs) {
      mobileMenuBtn.addEventListener("click", () => {
        navTabs.classList.toggle("mobile-open");
        portfolioAudio.playPop();
      });
    }

    // Filter buttons in Activities tab
    const filterBar = document.getElementById("activities-filter-bar");
    if (filterBar) {
      filterBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-btn");
        if (!btn) return;
        filterBar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        portfolioAudio.playPop();
        renderActivities(currentData.activities, btn.dataset.filter);
      });
    }

    // Handle initial hash in URL
    const initialHash = window.location.hash.replace("#", "");
    if (initialHash && ["home", "profile", "education", "courses", "activities"].includes(initialHash)) {
      switchTab(initialHash);
    }
  }

  // -------------------------------------------------------------
  // THEME & EFFECTS
  // -------------------------------------------------------------

  function applyThemeSettings(settings) {
    if (!settings) return;
    document.body.setAttribute("data-preset", settings.preset || "sakura");
    
    if (settings.darkMode) {
      document.body.classList.add("dark-mode");
      const icon = document.querySelector("#btn-toggle-theme i");
      if (icon) icon.className = "fa-solid fa-sun";
    } else {
      document.body.classList.remove("dark-mode");
      const icon = document.querySelector("#btn-toggle-theme i");
      if (icon) icon.className = "fa-solid fa-moon";
    }

    if (settings.fontFamily) {
      document.body.style.fontFamily = `'${settings.fontFamily}', 'Prompt', sans-serif`;
    }

    if (window.portfolioSparkles) {
      window.portfolioSparkles.toggle(settings.floatingSparkles !== false);
    }

    portfolioAudio.toggleSound(settings.soundEffects !== false);
  }

  // Theme toggle button in navbar
  const btnToggleTheme = document.getElementById("btn-toggle-theme");
  if (btnToggleTheme) {
    btnToggleTheme.addEventListener("click", () => {
      portfolioAudio.playPop();
      currentData.themeSettings.darkMode = !currentData.themeSettings.darkMode;
      portfolioStorage.saveData(currentData);
      applyThemeSettings(currentData.themeSettings);
    });
  }

  // Sound toggle button in navbar
  const btnToggleSound = document.getElementById("btn-toggle-sound");
  if (btnToggleSound) {
    btnToggleSound.addEventListener("click", () => {
      const nowEnabled = portfolioAudio.toggleSound();
      currentData.themeSettings.soundEffects = nowEnabled;
      portfolioStorage.saveData(currentData);
      btnToggleSound.querySelector("i").className = nowEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
      if (nowEnabled) portfolioAudio.playPop();
    });
  }

  // -------------------------------------------------------------
  // HIDDEN LOGIN SYSTEM (Ctrl + L + O)
  // -------------------------------------------------------------

  function setupHiddenLogin() {
    const modalLogin = document.getElementById("modal-login");
    const formLogin = document.getElementById("form-login");
    const errorMsg = document.getElementById("login-error-msg");
    const adminBar = document.getElementById("admin-bar");
    const footerTrigger = document.getElementById("footer-login-trigger");

    function openLoginModal() {
      if (modalLogin) {
        modalLogin.classList.add("active");
        portfolioAudio.playChime();
        const userInput = document.getElementById("login-username");
        if (userInput) userInput.focus();
      }
    }

    function closeLoginModal() {
      if (modalLogin) modalLogin.classList.remove("active");
      if (errorMsg) errorMsg.style.display = "none";
    }

    // Key shortcut tracker: Ctrl + L + O
    let keysPressed = {};
    window.addEventListener("keydown", (e) => {
      keysPressed[e.key.toLowerCase()] = true;
      if (e.ctrlKey && keysPressed["l"] && keysPressed["o"]) {
        e.preventDefault();
        openLoginModal();
      }
    });
    window.addEventListener("keyup", (e) => {
      delete keysPressed[e.key.toLowerCase()];
    });

    if (footerTrigger) {
      footerTrigger.addEventListener("click", openLoginModal);
    }

    // Close modal handlers
    document.querySelectorAll("[data-close-modal='modal-login']").forEach(btn => {
      btn.addEventListener("click", closeLoginModal);
    });

    // Form submission
    if (formLogin) {
      formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        const user = document.getElementById("login-username").value.trim();
        const pass = document.getElementById("login-password").value.trim();

        if (user === "Bimmm" && pass === "Bumbim254720") {
          isLoggedIn = true;
          sessionStorage.setItem("bumbim_admin_logged_in", "true");
          closeLoginModal();
          if (adminBar) adminBar.classList.add("active");
          portfolioAudio.playChime();
          alert("เข้าสู่ระบบแอดมินสำเร็จ! คุณบุ๋มบิ๋มสามารถแก้ไขหน้าเว็บและปรับแต่งธีมได้ทันที");
        } else {
          portfolioAudio.playPop(300);
          if (errorMsg) errorMsg.style.display = "block";
        }
      });
    }

    // Check if already logged in
    if (isLoggedIn && adminBar) {
      adminBar.classList.add("active");
    }

    // Logout
    const btnLogout = document.getElementById("btn-admin-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        isLoggedIn = false;
        sessionStorage.removeItem("bumbim_admin_logged_in");
        if (adminBar) adminBar.classList.remove("active");
        exitQuickEdit();
        closeDrawer();
        portfolioAudio.playPop();
      });
    }
  }

  // -------------------------------------------------------------
  // ADMIN & QUICK EDIT MODE
  // -------------------------------------------------------------

  function setupAdminFeatures() {
    const btnQuickEdit = document.getElementById("btn-quick-edit");
    const toolbar = document.getElementById("quick-edit-toolbar");
    const btnSaveQuick = document.getElementById("btn-save-quick-edit");
    const btnCancelQuick = document.getElementById("btn-cancel-quick-edit");

    function enterQuickEdit() {
      isQuickEdit = true;
      document.body.classList.add("quick-edit-active");
      if (toolbar) toolbar.classList.add("active");
      document.querySelectorAll("[data-editable]").forEach(el => {
        el.setAttribute("contenteditable", "true");
      });
      portfolioAudio.playChime();
    }

    function exitQuickEdit() {
      isQuickEdit = false;
      document.body.classList.remove("quick-edit-active");
      if (toolbar) toolbar.classList.remove("active");
      document.querySelectorAll("[data-editable]").forEach(el => {
        el.removeAttribute("contenteditable");
      });
    }

    if (btnQuickEdit) {
      btnQuickEdit.addEventListener("click", () => {
        if (!isQuickEdit) enterQuickEdit();
        else exitQuickEdit();
      });
    }

    if (btnCancelQuick) {
      btnCancelQuick.addEventListener("click", () => {
        exitQuickEdit();
        renderAll(currentData); // Revert unsaved edits
      });
    }

    if (btnSaveQuick) {
      btnSaveQuick.addEventListener("click", () => {
        // Collect edits
        document.querySelectorAll("[data-editable]").forEach(el => {
          const path = el.dataset.editable;
          const val = el.innerText.trim();
          setNestedValue(currentData, path, val);
        });

        portfolioStorage.saveData(currentData);
        exitQuickEdit();
        portfolioAudio.playChime();
        alert("บันทึกการแก้ไขข้อความทั้งหมดเรียบร้อยแล้วค่ะ!");
      });
    }

    // Admin Drawer Control
    const drawer = document.getElementById("admin-drawer");
    const btnOpenDrawer = document.getElementById("btn-open-drawer");
    const btnCloseDrawer = document.getElementById("btn-close-drawer");

    function openDrawer() {
      if (drawer) drawer.classList.add("open");
      portfolioAudio.playPop();
    }
    function closeDrawer() {
      if (drawer) drawer.classList.remove("open");
    }

    if (btnOpenDrawer) btnOpenDrawer.addEventListener("click", openDrawer);
    if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);

    // Drawer Tabs switching
    const drawerNavItems = document.querySelectorAll(".drawer-nav-item");
    const drawerPanes = document.querySelectorAll(".drawer-pane");
    drawerNavItems.forEach(item => {
      item.addEventListener("click", () => {
        drawerNavItems.forEach(i => i.classList.remove("active"));
        drawerPanes.forEach(p => p.classList.remove("active"));

        item.classList.add("active");
        const pane = document.getElementById(item.dataset.pane);
        if (pane) pane.classList.add("active");
        portfolioAudio.playPop();
      });
    });

    // Theme Presets Chips in Drawer
    document.querySelectorAll(".preset-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".preset-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const preset = chip.dataset.setPreset;
        currentData.themeSettings.preset = preset;
        portfolioStorage.saveData(currentData);
        applyThemeSettings(currentData.themeSettings);
        portfolioAudio.playPop();
      });
    });

    // Typography selector in Drawer
    const selectFont = document.getElementById("select-font-family");
    if (selectFont) {
      selectFont.value = currentData.themeSettings.fontFamily || "Prompt";
      selectFont.addEventListener("change", (e) => {
        currentData.themeSettings.fontFamily = e.target.value;
        portfolioStorage.saveData(currentData);
        applyThemeSettings(currentData.themeSettings);
        portfolioAudio.playPop();
      });
    }

    // Effect Checkboxes in Drawer
    const checkSparkles = document.getElementById("check-sparkles");
    if (checkSparkles) {
      checkSparkles.checked = currentData.themeSettings.floatingSparkles !== false;
      checkSparkles.addEventListener("change", (e) => {
        currentData.themeSettings.floatingSparkles = e.target.checked;
        portfolioStorage.saveData(currentData);
        applyThemeSettings(currentData.themeSettings);
      });
    }

    const checkSound = document.getElementById("check-sound");
    if (checkSound) {
      checkSound.checked = currentData.themeSettings.soundEffects !== false;
      checkSound.addEventListener("change", (e) => {
        currentData.themeSettings.soundEffects = e.target.checked;
        portfolioStorage.saveData(currentData);
        applyThemeSettings(currentData.themeSettings);
      });
    }

    // Form Profile Save in Drawer
    const formProfile = document.getElementById("form-edit-profile");
    if (formProfile) {
      formProfile.addEventListener("submit", (e) => {
        e.preventDefault();
        currentData.profile.name = document.getElementById("edit-profile-name").value;
        currentData.profile.nickname = document.getElementById("edit-profile-nickname").value;
        currentData.profile.studentId = document.getElementById("edit-profile-studentId").value;
        currentData.profile.phone = document.getElementById("edit-profile-phone").value;
        currentData.profile.email = document.getElementById("edit-profile-email").value;
        currentData.profile.motto = document.getElementById("edit-profile-motto").value;
        currentData.profile.bio = document.getElementById("edit-profile-bio").value;

        portfolioStorage.saveData(currentData);
        renderProfile(currentData.profile);
        portfolioAudio.playChime();
        alert("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว!");
      });
    }

    // Add Education Item
    const btnAddEdu = document.getElementById("btn-add-edu");
    if (btnAddEdu) {
      btnAddEdu.addEventListener("click", () => {
        const level = prompt("ระบุระดับการศึกษา (เช่น ระดับมัธยมศึกษาตอนปลาย):");
        if (!level) return;
        const inst = prompt("ระบุชื่อสถาบันการศึกษา:");
        const gpa = prompt("ระบุเกรดเฉลี่ย (GPA):", "3.50");
        const period = prompt("ระบุปีการศึกษา (เช่น พ.ศ. 2565 - 2568):", "พ.ศ. 2565 - 2568");

        currentData.education.push({
          id: "edu-" + Date.now(),
          level,
          institution: inst || "วิทยาลัยเทคนิค",
          gpa: gpa || "3.50",
          period: period || "",
          description: "สำเร็จการศึกษาด้วยความตั้งใจและมีผลการเรียนดีเด่น",
          badge: `เกรดเฉลี่ย ${gpa}`
        });

        portfolioStorage.saveData(currentData);
        renderEducation(currentData.education);
        portfolioAudio.playPop();
      });
    }

    // Delete Education Item Event
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-delete-edu");
      if (btn) {
        if (confirm("คุณแน่ใจว่าต้องการลบระดับการศึกษานี้หรือไม่?")) {
          currentData.education = currentData.education.filter(x => x.id !== btn.dataset.id);
          portfolioStorage.saveData(currentData);
          renderEducation(currentData.education);
          portfolioAudio.playPop();
        }
      }
    });

    // Add Course
    const btnAddCourse = document.getElementById("btn-add-course");
    if (btnAddCourse) {
      btnAddCourse.addEventListener("click", () => {
        const code = prompt("ระบุรหัสวิชา (เช่น EE-305):", "EE-305");
        if (!code) return;
        const name = prompt("ระบุชื่อวิชา:");
        const cat = prompt("ระบุหมวดวิชา (เช่น วิศวกรรมไฟฟ้า / วิชาชีพครู):", "วิศวกรรมไฟฟ้า");

        currentData.courses.push({
          id: "course-" + Date.now(),
          code,
          name: name || "รายวิชาใหม่",
          category: cat,
          description: "ศึกษาทฤษฎีและการฝึกปฏิบัติการตามมาตรฐานวิชาชีพ",
          artifacts: []
        });

        portfolioStorage.saveData(currentData);
        renderCourses(currentData.courses);
        portfolioAudio.playPop();
      });
    }

    // Delete Course
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-delete-course");
      if (btn) {
        if (confirm("คุณแน่ใจว่าต้องการลบรายวิชานี้หรือไม่?")) {
          currentData.courses = currentData.courses.filter(x => x.id !== btn.dataset.id);
          portfolioStorage.saveData(currentData);
          renderCourses(currentData.courses);
          portfolioAudio.playPop();
        }
      }
    });

    // Add Activity
    const btnAddAct = document.getElementById("btn-add-activity");
    if (btnAddAct) {
      btnAddAct.addEventListener("click", () => {
        const title = prompt("ระบุชื่อโครงงานหรือกิจกรรม:");
        if (!title) return;
        const cat = prompt("เลือกหมวดหมู่ (โครงงานนวัตกรรม / จิตอาสา & สังคม / การสอน & อบรม / ชิ้นงานในรายวิชา):", "โครงงานนวัตกรรม");
        const date = prompt("ระบุช่วงเวลา (เช่น กันยายน 2568):", "กันยายน 2568");

        currentData.activities.push({
          id: "act-" + Date.now(),
          title,
          category: cat || "โครงงานนวัตกรรม",
          date: date || "",
          image: "assets/images/activity_1.jpg",
          description: "รายละเอียดการดำเนินโครงงานหรือกิจกรรมสร้างสรรค์",
          tags: ["ผลงาน", "นวัตกรรม"]
        });

        portfolioStorage.saveData(currentData);
        renderActivities(currentData.activities);
        portfolioAudio.playPop();
      });
    }

    // Delete Activity
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-delete-activity");
      if (btn) {
        if (confirm("คุณแน่ใจว่าต้องการลบผลงานนี้หรือไม่?")) {
          currentData.activities = currentData.activities.filter(x => x.id !== btn.dataset.id);
          portfolioStorage.saveData(currentData);
          renderActivities(currentData.activities);
          portfolioAudio.playPop();
        }
      }
    });

    // Lightbox view for activities
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-view-activity");
      if (btn) {
        const act = currentData.activities.find(x => x.id === btn.dataset.id);
        if (act) {
          const modal = document.getElementById("modal-lightbox");
          const container = document.getElementById("lightbox-container");
          const title = document.getElementById("lightbox-title");

          if (title) title.innerHTML = `<i class="fa-solid fa-trophy" style="color:var(--primary);"></i> ${act.title}`;
          if (container) {
            container.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center; max-width: 700px; width: 100%;">
                <img src="${act.image || 'assets/images/activity_1.jpg'}" style="max-height: 50vh; border-radius: 8px; margin-bottom: 1rem; width: 100%; object-fit: contain;">
                <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; text-align: left; width: 100%;">${act.description}</p>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; width: 100%;">
                  ${(act.tags || []).map(t => `<span class="tag-pill">#${t}</span>`).join("")}
                </div>
              </div>
            `;
          }
          if (modal) modal.classList.add("active");
          portfolioAudio.playPop();
        }
      }
    });

    // Close Lightbox
    document.querySelectorAll("[data-close-modal='modal-lightbox']").forEach(btn => {
      btn.addEventListener("click", () => {
        const modal = document.getElementById("modal-lightbox");
        if (modal) modal.classList.remove("active");
      });
    });

    // Export & Import Backup handlers
    const btnExportBackup = document.getElementById("btn-export-backup");
    const btnExportJson = document.getElementById("btn-export-json");
    if (btnExportBackup) btnExportBackup.addEventListener("click", () => portfolioStorage.exportBackup());
    if (btnExportJson) btnExportJson.addEventListener("click", () => portfolioStorage.exportBackup());

    const inputImport = document.getElementById("input-import-backup");
    if (inputImport) {
      inputImport.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        const ok = await portfolioStorage.importBackup(text);
        if (ok) {
          alert("นำเข้าข้อมูลสำรองสำเร็จ! กำลังโหลดข้อมูลใหม่...");
          window.location.reload();
        } else {
          alert("เกิดข้อผิดพลาดในการนำเข้าไฟล์ JSON");
        }
      });
    }

    const btnResetDefault = document.getElementById("btn-reset-default");
    if (btnResetDefault) {
      btnResetDefault.addEventListener("click", () => {
        if (confirm("คำเตือน: คุณต้องการล้างข้อมูลทั้งหมดและคืนค่าเริ่มต้นใช่หรือไม่?")) {
          portfolioStorage.resetToDefault();
        }
      });
    }
  }

  // -------------------------------------------------------------
  // UNIVERSAL FILE UPLOADER (Images, Videos, PDFs, Fonts)
  // -------------------------------------------------------------

  function setupUniversalUploader() {
    const dropzone = document.getElementById("file-dropzone");
    const fileInput = document.getElementById("input-universal-file");
    const filesList = document.getElementById("uploaded-files-list");

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "var(--primary)";
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.style.borderColor = "";
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "";
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    });

    async function handleFiles(files) {
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target.result;
          const fileId = "file-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
          const fileObj = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: base64,
            uploadedAt: new Date().toISOString()
          };

          await portfolioStorage.saveFile(fileObj);

          // Handle Custom Fonts
          if (file.name.endsWith(".ttf") || file.name.endsWith(".woff") || file.name.endsWith(".woff2") || file.name.endsWith(".otf")) {
            registerCustomFont(file.name.replace(/\.[^/.]+$/, ""), base64);
          }

          portfolioAudio.playChime();
          renderUploadedFiles();
        };
        reader.readAsDataURL(file);
      }
    }

    async function renderUploadedFiles() {
      if (!filesList) return;
      const files = await portfolioStorage.getAllFiles();
      if (!files.length) {
        filesList.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">ยังไม่มีไฟล์ที่อัปโหลด</span>`;
        return;
      }

      filesList.innerHTML = files.map(f => `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px;">
            <i class="fa-solid fa-file" style="color: var(--primary); margin-right: 0.35rem;"></i>
            <strong>${f.name}</strong> (${(f.size / 1024).toFixed(1)} KB)
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <button class="admin-action-btn btn-light btn-use-file" data-id="${f.id}" title="ใช้เป็นรูปโปรไฟล์">
              <i class="fa-solid fa-user"></i> ใช้รูป
            </button>
            <button class="admin-action-btn btn-danger btn-delete-file" data-id="${f.id}" title="ลบไฟล์">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `).join("");
    }

    // Handle use file / delete file
    document.addEventListener("click", async (e) => {
      const btnUse = e.target.closest(".btn-use-file");
      if (btnUse) {
        const file = await portfolioStorage.getFile(btnUse.dataset.id);
        if (file && file.dataUrl) {
          currentData.profile.avatar = file.dataUrl;
          portfolioStorage.saveData(currentData);
          renderProfile(currentData.profile);
          portfolioAudio.playChime();
          alert("เปลี่ยนรูปโปรไฟล์เป็นรูปที่เลือกเรียบร้อยแล้วค่ะ!");
        }
      }

      const btnDel = e.target.closest(".btn-delete-file");
      if (btnDel) {
        if (confirm("คุณแน่ใจว่าต้องการลบไฟล์นี้ใช่หรือไม่?")) {
          await portfolioStorage.deleteFile(btnDel.dataset.id);
          renderUploadedFiles();
          portfolioAudio.playPop();
        }
      }
    });

    renderUploadedFiles();
  }

  // Register font into document.fonts
  function registerCustomFont(fontName, base64) {
    try {
      const font = new FontFace(fontName, `url(${base64})`);
      font.load().then(loadedFont => {
        document.fonts.add(loadedFont);
        alert(`โหลดฟอนต์ "${fontName}" สำเร็จ! สามารถเลือกใช้ในรายการฟอนต์ได้ทันที`);
        const select = document.getElementById("select-font-family");
        if (select) {
          const opt = document.createElement("option");
          opt.value = fontName;
          opt.textContent = fontName + " (Custom Font)";
          select.appendChild(opt);
          select.value = fontName;
          document.body.style.fontFamily = `'${fontName}', sans-serif`;
        }
      });
    } catch (e) {
      console.error("Font loading error:", e);
    }
  }

  async function loadStoredCustomFonts() {
    const files = await portfolioStorage.getAllFiles();
    files.forEach(f => {
      if (f.name.endsWith(".ttf") || f.name.endsWith(".woff") || f.name.endsWith(".woff2") || f.name.endsWith(".otf")) {
        registerCustomFont(f.name.replace(/\.[^/.]+$/, ""), f.dataUrl);
      }
    });
  }

  // -------------------------------------------------------------
  // PRINT PORTFOLIO HANDLER
  // -------------------------------------------------------------

  function setupPrint() {
    const btnPrint = document.getElementById("btn-print-portfolio");
    if (btnPrint) {
      btnPrint.addEventListener("click", () => {
        window.print();
      });
    }
  }

  // -------------------------------------------------------------
  // HELPER UTILITIES
  // -------------------------------------------------------------

  function setNestedValue(obj, path, value) {
    const parts = path.split(".");
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = value;
  }
});
