/**
 * Main Application Controller for Arocha Boonlue (Bumbim) Portfolio
 * Features:
 * - Supabase Cloud Realtime synchronization (listening to postgres_changes)
 * - Anti-stale cache prevention (SWR with ISO timestamp validation + Force Fresh Pull)
 * - Universal Drag-and-Drop file & image upload everywhere (avatars, activity cards, dropzone, modals)
 * - Full CRUD & 100% editable controls across all sections (Profile, Stats, Skills, Education, Courses, Activities)
 * - Universal Modal for editing items
 * - ContentEditable quick inline editing
 * - Theme, Presets, Audio Pop, Particle Canvas, and Custom Font manager
 */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize State
  let currentData = portfolioStorage.getData();
  let isLoggedIn = sessionStorage.getItem("bumbim_admin_logged_in") === "true";
  let isQuickEdit = false;
  let activeTab = "home";
  let currentUniversalModalConfig = null; // { mode: 'add'|'edit', entity: '...', id: '...', categoryIndex: ... }

  // 2. Initialize Theme & Effects from stored settings
  applyThemeSettings(currentData.themeSettings);

  // 3. Render all dynamic UI components
  renderAll(currentData);

  // 4. Setup Event Listeners & Integrations
  setupNavigation();
  setupHiddenLogin();
  setupAdminFeatures();
  setupUniversalUploader();
  setupDragAndDropEverywhere();
  setupUniversalItemModal();
  setupSupabaseRealtimeIntegration();
  setupPrint();

  // Load custom fonts from IndexedDB if any
  loadStoredCustomFonts();

  // -------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // -------------------------------------------------------------

  function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `portfolio-toast ${type}`;

    let icon = "fa-solid fa-circle-check";
    if (type === "info") icon = "fa-solid fa-circle-info";
    if (type === "warning") icon = "fa-solid fa-triangle-exclamation";
    if (type === "realtime") icon = "fa-solid fa-bolt";

    toast.innerHTML = `
      <i class="${icon}" style="color: ${type === 'warning' ? '#f59e0b' : 'var(--primary)'};"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // -------------------------------------------------------------
  // FILE & MEDIA ATTACHMENT HELPERS
  // -------------------------------------------------------------

  function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function parseFileInfo(fileOrObj, customTitle = "") {
    if (!fileOrObj) return null;

    let url = "";
    let name = "";
    let size = "";
    let rawType = "";

    if (typeof fileOrObj === "string") {
      url = fileOrObj;
      name = customTitle || url.split("/").pop().split("?")[0] || "ไฟล์แนบ";
    } else if (typeof fileOrObj === "object") {
      url = fileOrObj.url || fileOrObj.file || fileOrObj.src || "";
      name = fileOrObj.name || fileOrObj.title || customTitle || (url ? url.split("/").pop().split("?")[0] : "ไฟล์แนบ");
      size = fileOrObj.sizeFormatted || (fileOrObj.size ? (typeof fileOrObj.size === "number" ? formatFileSize(fileOrObj.size) : fileOrObj.size) : "");
      rawType = fileOrObj.type || fileOrObj.category || "";
    }

    const ext = (url.split(".").pop() || "").split("?")[0].toLowerCase();

    let category = "file";
    let icon = "📄";
    let faIcon = "fa-solid fa-file";
    let label = ext ? ext.toUpperCase() : "FILE";

    if (/^(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(ext) || rawType.startsWith("image/")) {
      category = "image";
      icon = "🖼️";
      faIcon = "fa-solid fa-file-image";
      label = ext ? ext.toUpperCase() : "IMG";
    } else if (/^(pdf)$/i.test(ext) || rawType === "application/pdf") {
      category = "pdf";
      icon = "📕";
      faIcon = "fa-solid fa-file-pdf";
      label = "PDF";
    } else if (/^(mp4|webm|ogg|mov)$/i.test(ext) || rawType.startsWith("video/")) {
      category = "video";
      icon = "🎬";
      faIcon = "fa-solid fa-file-video";
      label = "VIDEO";
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      category = "youtube";
      icon = "▶️";
      faIcon = "fa-brands fa-youtube";
      label = "YOUTUBE";
    } else if (/^(doc|docx)$/i.test(ext) || rawType.includes("word")) {
      category = "document";
      icon = "📝";
      faIcon = "fa-solid fa-file-word";
      label = "DOCX";
    } else if (/^(ppt|pptx)$/i.test(ext) || rawType.includes("presentation")) {
      category = "presentation";
      icon = "📊";
      faIcon = "fa-solid fa-file-powerpoint";
      label = "PPTX";
    } else if (/^(xls|xlsx|csv)$/i.test(ext) || rawType.includes("spreadsheet") || rawType.includes("excel")) {
      category = "spreadsheet";
      icon = "📈";
      faIcon = "fa-solid fa-file-excel";
      label = "EXCEL";
    } else if (/^(zip|rar|7z|tar|gz)$/i.test(ext) || rawType.includes("zip") || rawType.includes("compressed")) {
      category = "archive";
      icon = "🗜️";
      faIcon = "fa-solid fa-file-zipper";
      label = "ZIP";
    } else if (/^(dwg|dxf|cad)$/i.test(ext)) {
      category = "cad";
      icon = "📐";
      faIcon = "fa-solid fa-drafting-compass";
      label = "CAD/DWG";
    }

    return {
      url,
      name,
      ext,
      category,
      icon,
      faIcon,
      label,
      size: size || (typeof fileOrObj === "object" && typeof fileOrObj.size === "number" ? formatFileSize(fileOrObj.size) : "")
    };
  }

  // -------------------------------------------------------------
  // SUPABASE REALTIME & ANTI-STALE SYNC CONTROLLER
  // -------------------------------------------------------------

  function setupSupabaseRealtimeIntegration() {
    const realtimeBadge = document.getElementById("admin-realtime-badge");
    const realtimeDot = document.getElementById("admin-realtime-dot");
    const realtimeText = document.getElementById("admin-realtime-text");
    const supaBadge = document.getElementById("supabase-status-badge");
    const lastSyncTimeEl = document.getElementById("supabase-last-sync-time");
    const btnQuickSync = document.getElementById("btn-quick-sync");
    const btnForcePull = document.getElementById("btn-supabase-force-pull");
    const btnSupaPush = document.getElementById("btn-supabase-push");
    const btnSupaPull = document.getElementById("btn-supabase-pull");
    const formSupabase = document.getElementById("form-supabase-config");
    const inputSupaUrl = document.getElementById("input-supabase-url");
    const inputSupaAnon = document.getElementById("input-supabase-anon");

    // Populate current config if any
    if (window.portfolioSupabase) {
      if (inputSupaUrl) inputSupaUrl.value = portfolioSupabase.config.url || "";
      if (inputSupaAnon) inputSupaAnon.value = portfolioSupabase.config.anonKey || "";
    }

    function updateStatusUI(status, errorMsg = "") {
      const isOnline = portfolioSupabase.isConnected();

      if (realtimeBadge && realtimeDot && realtimeText) {
        realtimeDot.className = "realtime-dot";
        if (status === "SUBSCRIBED") {
          realtimeDot.classList.add("active");
          realtimeText.textContent = "🟢 Realtime ซิงก์สด";
          realtimeBadge.style.borderColor = "#10b981";
        } else if (status === "CONNECTING") {
          realtimeDot.classList.add("syncing");
          realtimeText.textContent = "🔄 กำลังซิงก์ข้อมูล...";
          realtimeBadge.style.borderColor = "#f59e0b";
        } else if (status === "CONNECTED") {
          realtimeDot.classList.add("active");
          realtimeText.textContent = "🟢 เชื่อมต่อคลาวด์แล้ว";
          realtimeBadge.style.borderColor = "#10b981";
        } else {
          realtimeDot.classList.add("offline");
          realtimeText.textContent = isOnline ? "⚪ เชื่อมต่อแล้ว (ไม่มี Realtime)" : "⚪ โหมดในเครื่อง (ออฟไลน์)";
          realtimeBadge.style.borderColor = "rgba(255,255,255,0.25)";
        }
      }

      if (supaBadge) {
        if (status === "SUBSCRIBED") {
          supaBadge.textContent = "🟢 Realtime ทำงานสด (Postgres Changes)";
          supaBadge.style.background = "#dcfce7";
          supaBadge.style.color = "#15803d";
        } else if (status === "CONNECTING") {
          supaBadge.textContent = "🔄 กำลังเชื่อมต่อ / ซิงก์ข้อมูล...";
          supaBadge.style.background = "#fef3c7";
          supaBadge.style.color = "#b45309";
        } else if (status === "CONNECTED") {
          supaBadge.textContent = "🟢 เชื่อมต่อแล้ว";
          supaBadge.style.background = "#dcfce7";
          supaBadge.style.color = "#15803d";
        } else if (status === "ERROR") {
          supaBadge.textContent = `🔴 เกิดข้อผิดพลาด (${errorMsg || 'เชื่อมต่อไม่สำเร็จ'})`;
          supaBadge.style.background = "#fee2e2";
          supaBadge.style.color = "#b91c1c";
        } else {
          supaBadge.textContent = "⚪ ยังไม่ได้เชื่อมต่อ";
          supaBadge.style.background = "#e5e7eb";
          supaBadge.style.color = "#4b5563";
        }
      }

      if (lastSyncTimeEl && portfolioSupabase.lastSyncTime) {
        const d = new Date(portfolioSupabase.lastSyncTime);
        lastSyncTimeEl.textContent = `ซิงก์ข้อมูลล่าสุด: ${d.toLocaleTimeString("th-TH")} (${d.toLocaleDateString("th-TH")})`;
      }
    }

    if (window.portfolioSupabase) {
      portfolioSupabase.onStatusChange((status, err) => {
        updateStatusUI(status, err);
      });

      // 1. Listen for Realtime Postgres Changes from other devices or tabs
      portfolioSupabase.onDataChange((remoteData, updatedAt, source) => {
        console.log(`⚡ [Realtime Event] Received new data update from ${source}`);
        currentData = remoteData;
        portfolioStorage.saveData(currentData, false); // Save locally without echoing back to cloud
        renderAll(currentData);
        applyThemeSettings(currentData.themeSettings);
        portfolioAudio.playChime();
        showToast("⚡ ได้รับข้อมูลอัปเดตแบบเรียวไทร์สดเรียบร้อยแล้ว!", "realtime");
        updateStatusUI("SUBSCRIBED");
      });

      // 2. Anti-Stale Data Check (SWR): Check if cloud has newer data than local
      if (portfolioSupabase.isConnected()) {
        portfolioSupabase.revalidateWithCloud(currentData, (freshData, updatedAt) => {
          currentData = freshData;
          portfolioStorage.saveData(currentData, false);
          renderAll(currentData);
          applyThemeSettings(currentData.themeSettings);
          showToast("⚡ ซิงก์ข้อมูลล่าสุดจาก Supabase เรียบร้อยแล้ว (ไม่ดึงข้อมูลเก่า)", "info");
          updateStatusUI("SUBSCRIBED");
        });
      }
    }

    // Save Supabase Configuration Form
    if (formSupabase) {
      formSupabase.addEventListener("submit", (e) => {
        e.preventDefault();
        const url = inputSupaUrl.value.trim();
        const anon = inputSupaAnon.value.trim();

        const ok = portfolioSupabase.saveConfig(url, anon, true);
        if (ok) {
          portfolioAudio.playChime();
          showToast("บันทึกการตั้งค่า Supabase เรียบร้อยแล้ว! กำลังเชื่อมต่อ Realtime...", "success");
          portfolioSupabase.revalidateWithCloud(currentData, (freshData) => {
            currentData = freshData;
            portfolioStorage.saveData(currentData, false);
            renderAll(currentData);
            applyThemeSettings(currentData.themeSettings);
          });
        }
      });
    }

    // Force Fresh Pull Handler ("ไม่ดึงข้อมูลเก่า" / Bypass Cache)
    async function handleForcePull() {
      if (!portfolioSupabase.isConnected()) {
        alert("กรุณาระบุ URL และ Anon Key ของ Supabase ให้เรียบร้อยก่อนค่ะ");
        return;
      }

      showToast("🔄 กำลังดึงข้อมูลสดจาก Supabase (Bypass Cache)...", "info");
      const res = await portfolioSupabase.pullDataFresh();

      if (res.success && res.data) {
        currentData = res.data;
        portfolioStorage.saveData(currentData, false);
        renderAll(currentData);
        applyThemeSettings(currentData.themeSettings);
        portfolioAudio.playChime();
        updateStatusUI("SUBSCRIBED");
        showToast("⚡ ดึงข้อมูลสดล่าสุดสำเร็จเรียบร้อย ไม่ดึงข้อมูลเก่าอย่างแน่นอน!", "success");
      } else {
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + (res.error || "ไม่พบข้อมูล"));
      }
    }

    if (btnQuickSync) btnQuickSync.addEventListener("click", handleForcePull);
    if (btnForcePull) btnForcePull.addEventListener("click", handleForcePull);
    if (btnSupaPull) btnSupaPull.addEventListener("click", handleForcePull);

    // Push to Cloud Handler
    if (btnSupaPush) {
      btnSupaPush.addEventListener("click", async () => {
        if (!portfolioSupabase.isConnected()) {
          alert("กรุณาระบุ URL และ Anon Key ของ Supabase ให้เรียบร้อยก่อนค่ะ");
          return;
        }

        btnSupaPush.disabled = true;
        btnSupaPush.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังอัปโหลด...`;

        const res = await portfolioSupabase.pushData(currentData);

        btnSupaPush.disabled = false;
        btnSupaPush.innerHTML = `<i class="fa-solid fa-arrow-up-from-bracket"></i> อัปโหลดขึ้นคลาวด์`;

        if (res.success) {
          portfolioAudio.playChime();
          showToast("อัปโหลดข้อมูลและผลงานขึ้น Supabase สำเร็จเรียบร้อยแล้ว!", "success");
          updateStatusUI("SUBSCRIBED");
        } else {
          alert("เกิดข้อผิดพลาดในการอัปโหลด: " + res.error);
        }
      });
    }
  }

  // -------------------------------------------------------------
  // RENDER CONTROLLERS
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

    // 1. Navigation Brand
    const brandAvatar = document.getElementById("nav-brand-avatar");
    const brandName = document.getElementById("nav-brand-name");
    const brandSub = document.getElementById("nav-brand-sub");

    let avatarSrc = profile.avatar || "assets/images/profile_1.jpg?v=20261001";
    if (avatarSrc === "assets/images/profile_1.jpg") {
      avatarSrc = "assets/images/profile_1.jpg?v=20261001";
    }
    if (brandAvatar) brandAvatar.src = avatarSrc;
    if (brandName) brandName.textContent = `${profile.nickname || ''} ${profile.name ? profile.name.split(" ")[1] || profile.name : ''}`;
    if (brandSub) brandSub.textContent = `${profile.major || ''} ${profile.university ? profile.university.replace("มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน", "มทร.อีสาน") : ''}`;

    // 2. Hero Section (Home Tab)
    const heroAvatar = document.getElementById("hero-avatar");
    const heroName = document.getElementById("hero-name");
    const heroNickname = document.getElementById("hero-nickname");
    const heroTitle = document.getElementById("hero-title");
    const heroUni = document.getElementById("hero-uni");
    const heroFac = document.getElementById("hero-fac");
    const heroBio = document.getElementById("hero-bio");
    const heroBadge = document.getElementById("hero-badge");
    const heroMajorPill = document.getElementById("hero-major-pill");

    if (heroAvatar) heroAvatar.src = avatarSrc;
    if (heroName) heroName.textContent = profile.name || "";
    if (heroNickname) heroNickname.textContent = profile.nickname || "";
    if (heroTitle) heroTitle.textContent = profile.title || "";
    if (heroUni) heroUni.textContent = profile.university || "";
    if (heroFac) heroFac.textContent = profile.faculty || "";
    if (heroBio) heroBio.textContent = profile.bio || "";
    if (heroBadge) heroBadge.textContent = profile.statusBadge || "";
    if (heroMajorPill) heroMajorPill.textContent = profile.major || "";

    // Home Highlight Quick Bio
    const homeStudentId = document.getElementById("home-student-id");
    const homeContactInfo = document.getElementById("home-contact-info");
    const homeMotto = document.getElementById("home-motto");
    if (homeStudentId) homeStudentId.textContent = profile.studentId || "";
    if (homeContactInfo) homeContactInfo.textContent = `โทร: ${profile.phone || ''} | ${profile.email || ''}`;
    if (homeMotto) homeMotto.textContent = `"${profile.motto || ''}"`;

    // 3. Profile Tab
    const profilePageAvatar = document.getElementById("profile-page-avatar");
    const profilePageName = document.getElementById("profile-page-name");
    const profilePageNickname = document.getElementById("profile-page-nickname");
    const profilePageMotto = document.getElementById("profile-page-motto");
    const profilePagePhone = document.getElementById("profile-page-phone");
    const profilePageEmail = document.getElementById("profile-page-email");
    const profilePageLine = document.getElementById("profile-page-line");
    const profilePageUni = document.getElementById("profile-page-uni");

    if (profilePageAvatar) profilePageAvatar.src = avatarSrc;
    if (profilePageName) profilePageName.textContent = profile.name || "";
    if (profilePageNickname) profilePageNickname.textContent = profile.nickname || "";
    if (profilePageMotto) profilePageMotto.textContent = profile.motto || "";
    if (profilePagePhone) profilePagePhone.textContent = profile.phone || "";
    if (profilePageEmail) profilePageEmail.textContent = profile.email || "";
    if (profilePageLine) profilePageLine.textContent = (profile.socials && profile.socials.line) || profile.phone || "";
    if (profilePageUni) profilePageUni.textContent = profile.university || "";

    // Profile Details Grid
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

    if (gridName) gridName.textContent = profile.name || "";
    if (gridNickname) gridNickname.textContent = profile.nickname || "";
    if (gridStudentId) gridStudentId.textContent = profile.studentId || "";
    if (gridBirthdate) gridBirthdate.textContent = profile.birthdate || "";
    if (gridAge) gridAge.textContent = profile.age || "";
    if (gridNationality) gridNationality.textContent = profile.nationality || "";
    if (gridEthnicity) gridEthnicity.textContent = profile.ethnicity || "";
    if (gridUni) gridUni.textContent = profile.university || "";
    if (gridFac) gridFac.textContent = profile.faculty || "";
    if (gridMajor) gridMajor.textContent = profile.major || "";

    // 4. Footer Information
    const footerAuthorName = document.getElementById("footer-author-name");
    const footerAuthorMeta = document.getElementById("footer-author-meta");
    const footerPhone = document.getElementById("footer-phone");
    const footerEmail = document.getElementById("footer-email");

    if (footerAuthorName) footerAuthorName.textContent = `จัดทำโดย ${profile.name || ''}`;
    if (footerAuthorMeta) {
      footerAuthorMeta.innerHTML = `
        รหัสนักศึกษา ${profile.studentId || ''} <br>
        ${profile.university || ''} <br>
        ${profile.faculty || ''} ${profile.major || ''}
      `;
    }
    if (footerPhone) footerPhone.textContent = profile.phone || "";
    if (footerEmail) footerEmail.textContent = profile.email || "";

    // 5. Populate Form Fields in Drawer
    const editAvatarPreview = document.getElementById("edit-profile-avatar-preview");
    const editAvatar = document.getElementById("edit-profile-avatar");
    const editName = document.getElementById("edit-profile-name");
    const editNick = document.getElementById("edit-profile-nickname");
    const editTitle = document.getElementById("edit-profile-title");
    const editId = document.getElementById("edit-profile-studentId");
    const editBadge = document.getElementById("edit-profile-statusBadge");
    const editUni = document.getElementById("edit-profile-university");
    const editFac = document.getElementById("edit-profile-faculty");
    const editMajor = document.getElementById("edit-profile-major");
    const editPhone = document.getElementById("edit-profile-phone");
    const editEmail = document.getElementById("edit-profile-email");
    const editBirth = document.getElementById("edit-profile-birthdate");
    const editAge = document.getElementById("edit-profile-age");
    const editNat = document.getElementById("edit-profile-nationality");
    const editEth = document.getElementById("edit-profile-ethnicity");
    const editLine = document.getElementById("edit-profile-line");
    const editFb = document.getElementById("edit-profile-facebook");
    const editMotto = document.getElementById("edit-profile-motto");
    const editBio = document.getElementById("edit-profile-bio");

    if (editAvatarPreview) editAvatarPreview.src = avatarSrc;
    if (editAvatar) editAvatar.value = profile.avatar || "";
    if (editName) editName.value = profile.name || "";
    if (editNick) editNick.value = profile.nickname || "";
    if (editTitle) editTitle.value = profile.title || "";
    if (editId) editId.value = profile.studentId || "";
    if (editBadge) editBadge.value = profile.statusBadge || "";
    if (editUni) editUni.value = profile.university || "";
    if (editFac) editFac.value = profile.faculty || "";
    if (editMajor) editMajor.value = profile.major || "";
    if (editPhone) editPhone.value = profile.phone || "";
    if (editEmail) editEmail.value = profile.email || "";
    if (editBirth) editBirth.value = profile.birthdate || "";
    if (editAge) editAge.value = profile.age || "";
    if (editNat) editNat.value = profile.nationality || "";
    if (editEth) editEth.value = profile.ethnicity || "";
    if (editLine) editLine.value = (profile.socials && profile.socials.line) || "";
    if (editFb) editFb.value = (profile.socials && profile.socials.facebook) || "";
    if (editMotto) editMotto.value = profile.motto || "";
    if (editBio) editBio.value = profile.bio || "";
  }

  function renderStats(stats) {
    const container = document.getElementById("stats-container");
    const drawerList = document.getElementById("drawer-stats-list");
    if (!stats) return;

    if (container) {
      container.innerHTML = stats.map(st => {
        let iconClass = "fa-solid fa-award";
        if (st.icon === "star") iconClass = "fa-solid fa-star";
        if (st.icon === "folder-check" || st.icon === "folder") iconClass = "fa-solid fa-folder-open";
        if (st.icon === "heart") iconClass = "fa-solid fa-heart";
        if (st.icon === "bolt") iconClass = "fa-solid fa-bolt";
        if (st.icon === "graduation-cap") iconClass = "fa-solid fa-graduation-cap";

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

    if (drawerList) {
      drawerList.innerHTML = stats.map((st, idx) => `
        <div style="background: var(--bg-page); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 0.88rem; color: var(--primary);">${st.value}</strong>
            <span style="font-size: 0.85rem; font-weight: 600; margin-left: 0.35rem;">${st.label}</span>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${st.badge} (ไอคอน: ${st.icon})</div>
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <button class="admin-action-btn btn-light btn-edit-stat" data-index="${idx}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="แก้ไขสถิตินี้">
              <i class="fa-solid fa-pen"></i> แก้ไข
            </button>
            <button class="admin-action-btn btn-danger btn-delete-stat" data-index="${idx}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="ลบสถิตินี้">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `).join("");
    }
  }

  function renderSkills(skills) {
    const container = document.getElementById("skills-container");
    const drawerList = document.getElementById("drawer-skills-list");
    if (!skills) return;

    if (container) {
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

    if (drawerList) {
      drawerList.innerHTML = skills.map((cat, catIdx) => `
        <div style="background: var(--bg-page); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border-bottom: 1px dashed var(--border-subtle); padding-bottom: 0.4rem;">
            <strong style="font-size: 0.88rem; color: var(--text-primary);">${cat.category}</strong>
            <button class="admin-action-btn btn-primary btn-add-skill-item" data-cat-index="${catIdx}" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;">
              <i class="fa-solid fa-plus"></i> เพิ่มทักษะในหมวดนี้
            </button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            ${cat.items.map((item, itemIdx) => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 0.35rem 0.6rem; border-radius: 4px; font-size: 0.8rem;">
                <span>${item.name} <b>(${item.level}%)</b></span>
                <div style="display: flex; gap: 0.25rem;">
                  <button class="admin-action-btn btn-light btn-edit-skill-item" data-cat-index="${catIdx}" data-item-index="${itemIdx}" style="padding: 0.2rem 0.45rem; font-size: 0.7rem;">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="admin-action-btn btn-danger btn-delete-skill-item" data-cat-index="${catIdx}" data-item-index="${itemIdx}" style="padding: 0.2rem 0.45rem; font-size: 0.7rem;">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");
    }
  }

  function renderEducation(education) {
    const container = document.getElementById("education-timeline-container");
    const homeHighlight = document.getElementById("home-highlight-edu");
    const drawerList = document.getElementById("drawer-edu-list");
    if (!education) return;

    if (container) {
      container.innerHTML = education.map(edu => `
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
    }

    // Dynamic Home Highlight for Education
    if (homeHighlight) {
      const topEdu = education[education.length - 1]; // Latest
      const otherEdu = education.slice(0, education.length - 1).reverse().slice(0, 2);

      homeHighlight.innerHTML = `
        ${topEdu ? `
          <div style="margin-bottom: 0.75rem;">
            <strong style="color: var(--primary);">${topEdu.level}</strong>
            <p style="font-size: 0.88rem; color: var(--text-secondary);">${topEdu.institution}</p>
          </div>
        ` : ''}
        ${otherEdu.length ? `
          <div style="border-top: 1px dashed var(--border-subtle); padding-top: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem;">
            ${otherEdu.map(ed => `
              <div style="display:flex; justify-content: space-between; align-items:center;">
                <span style="font-size: 0.85rem; font-weight: 600;">${ed.level.replace("ระดับ", "")} ${ed.institution}</span>
                <span class="timeline-gpa-badge" style="font-size: 0.75rem;">${ed.badge || `GPA ${ed.gpa}`}</span>
              </div>
            `).join("")}
          </div>
        ` : ''}
      `;
    }

    if (drawerList) {
      drawerList.innerHTML = education.map(edu => `
        <div style="background: var(--bg-page); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 0.88rem;">${edu.level}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${edu.institution} (${edu.gpa})</div>
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <button class="admin-action-btn btn-light btn-edit-edu" data-id="${edu.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="แก้ไข">
              <i class="fa-solid fa-pen"></i> แก้ไข
            </button>
            <button class="admin-action-btn btn-danger btn-delete-edu" data-id="${edu.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="ลบ">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `).join("");
    }
  }

  function renderCourses(courses) {
    const container = document.getElementById("courses-list-container");
    const drawerList = document.getElementById("drawer-courses-list");
    if (!courses) return;

    if (container) {
      container.innerHTML = courses.map(course => `
        <div class="course-card drag-target-zone course-card-drop-zone" data-course-id="${course.id}" title="ลากไฟล์เอกสารหรือรูปภาพมาวางที่การ์ดนี้เพื่อแนบไฟล์ทันที">
          <div class="course-meta" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="course-code">${course.code}</span>
              <span class="course-category"><i class="fa-solid fa-tag"></i> ${course.category}</span>
            </div>
            <button class="btn-view-course" data-id="${course.id}" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0.25rem 0.6rem; font-size: 0.78rem; color: var(--primary); cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;" title="ดูไฟล์และสื่อทั้งหมด">
              <i class="fa-solid fa-expand"></i> ดูไฟล์ทั้งหมด
            </button>
          </div>
          <h3 class="course-name">${course.name}</h3>
          <p class="course-description">${course.description}</p>

          ${course.files && course.files.length ? `
            <div style="margin-top: 0.75rem; padding-top: 0.6rem; border-top: 1px dashed var(--border-subtle);">
              <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.35rem;">
                <i class="fa-solid fa-paperclip" style="color: var(--primary);"></i> ไฟล์แนบประจำวิชา (${course.files.length} ไฟล์):
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                ${course.files.map(f => {
                  const p = parseFileInfo(f);
                  return `
                    <a href="${p.url}" target="_blank" class="artifact-action" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.35rem; text-decoration: none;" title="${p.name}">
                      <i class="${p.faIcon}"></i>
                      <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</span>
                      ${p.size ? `<span style="font-size: 0.7rem; opacity: 0.75;">(${p.size})</span>` : ''}
                    </a>
                  `;
                }).join("")}
              </div>
            </div>
          ` : ''}

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
                    ${art.files && art.files.length ? `
                      <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.4rem;">
                        ${art.files.map(af => {
                          const ap = parseFileInfo(af);
                          return `
                            <a href="${ap.url}" target="_blank" class="artifact-action" style="padding: 0.2rem 0.45rem; font-size: 0.72rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.25rem; text-decoration: none;" title="${ap.name}">
                              <i class="${ap.faIcon}"></i>
                              <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ap.name}</span>
                            </a>
                          `;
                        }).join("")}
                      </div>
                    ` : (art.file ? `
                      <a href="${art.file}" target="_blank" class="artifact-action" title="เปิดเอกสารชิ้นงาน">
                        <i class="fa-solid fa-file-pdf"></i> เปิดเอกสาร / ดาวน์โหลด (${art.type || 'PDF'})
                      </a>
                    ` : `
                      <span style="font-size: 0.78rem; color: var(--text-muted);">
                        <i class="fa-solid fa-circle-check" style="color: var(--accent-mint);"></i> ชิ้นงานโครงงานภาคปฏิบัติ
                      </span>
                    `)}
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ''}
        </div>
      `).join("");
    }

    if (drawerList) {
      drawerList.innerHTML = courses.map(c => `
        <div style="background: var(--bg-page); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 0.88rem;">${c.code}: ${c.name}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${c.category} (${(c.files ? c.files.length : 0) + (c.artifacts ? c.artifacts.length : 0)} ไฟล์/ชิ้นงาน)</div>
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <button class="admin-action-btn btn-light btn-edit-course" data-id="${c.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="แก้ไข">
              <i class="fa-solid fa-pen"></i> แก้ไข
            </button>
            <button class="admin-action-btn btn-danger btn-delete-course" data-id="${c.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="ลบ">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `).join("");
    }
  }

  function renderActivities(activities, filter = "all") {
    const container = document.getElementById("activities-grid-container");
    const homeHighlight = document.getElementById("home-highlight-activities");
    const drawerList = document.getElementById("drawer-activities-list");
    if (!activities) return;

    const filtered = filter === "all" ? activities : activities.filter(a => a.category === filter);

    if (container) {
      container.innerHTML = filtered.map(act => `
        <div class="activity-card drag-target-zone activity-card-drop-zone" data-activity-id="${act.id}" title="ลากไฟล์รูปหรือเอกสารมาวางที่การ์ดนี้เพื่อแนบไฟล์ทันที">
          <div class="activity-thumb-wrapper" style="position: relative;">
            <img src="${act.image || 'assets/images/activity_1.jpg'}" alt="${act.title}" class="activity-thumb">
            <span class="activity-category-tag">${act.category}</span>
            ${act.files && act.files.length > 0 ? `
              <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.75); color: #fff; padding: 2px 7px; border-radius: 12px; font-size: 0.72rem; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(4px);">
                <i class="fa-solid fa-paperclip" style="color: var(--primary);"></i> ${act.files.length} ไฟล์
              </div>
            ` : ''}
          </div>
          <div class="activity-body">
            <div class="activity-date"><i class="fa-regular fa-clock"></i> ${act.date}</div>
            <h4 class="activity-card-title">${act.title}</h4>
            <p class="activity-card-desc">${act.description}</p>
            <div class="activity-tags">
              ${(act.tags || []).map(t => `<span class="tag-pill">#${t}</span>`).join("")}
            </div>

            ${act.files && act.files.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.5rem; padding-top: 0.4rem; border-top: 1px dashed var(--border-subtle);">
                ${act.files.slice(0, 3).map(f => {
                  const p = parseFileInfo(f);
                  return `
                    <span style="font-size: 0.7rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; max-width: 120px;" title="${p.name}">
                      <i class="${p.faIcon}" style="color: var(--primary);"></i>
                      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</span>
                    </span>
                  `;
                }).join("")}
                ${act.files.length > 3 ? `<span style="font-size: 0.7rem; color: var(--primary); align-self: center;">+${act.files.length - 3}</span>` : ''}
              </div>
            ` : ''}

            <div class="activity-footer">
              <span class="activity-view-btn btn-view-activity" data-id="${act.id}">
                <i class="fa-solid fa-expand"></i> ดูรายละเอียด & ไฟล์
              </span>
              ${act.document ? `
                <a href="${act.document}" target="_blank" class="activity-view-btn" style="color: var(--secondary);">
                  <i class="fa-solid fa-file-lines"></i> เอกสารแนบ
                </a>
              ` : ''}
            </div>
          </div>
        </div>
      `).join("");
    }

    // Dynamic Home Highlight for Featured Work
    if (homeHighlight) {
      const topTwo = activities.slice(0, 2);
      homeHighlight.innerHTML = topTwo.map((act, idx) => `
        <div style="${idx > 0 ? 'border-top: 1px dashed var(--border-subtle); padding-top: 0.5rem; margin-top: 0.5rem;' : 'margin-bottom: 0.5rem;'}">
          <strong style="color: var(--primary);">${act.title}</strong>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">${act.description}</p>
        </div>
      `).join("");
    }

    if (drawerList) {
      drawerList.innerHTML = activities.map(act => `
        <div style="background: var(--bg-page); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <img src="${act.image || 'assets/images/activity_1.jpg'}" style="width: 38px; height: 38px; border-radius: 4px; object-fit: cover;">
            <div>
              <strong style="font-size: 0.85rem;">${act.title}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${act.category} (${act.files ? act.files.length : 1} ไฟล์)</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <button class="admin-action-btn btn-light btn-edit-activity" data-id="${act.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="แก้ไข">
              <i class="fa-solid fa-pen"></i> แก้ไข
            </button>
            <button class="admin-action-btn btn-danger btn-delete-activity" data-id="${act.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="ลบ">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `).join("");
    }
  }

  // -------------------------------------------------------------
  // UNIVERSAL ITEM MODAL (FULL CRUD FOR ALL SECTIONS)
  // -------------------------------------------------------------

  function setupUniversalItemModal() {
    const modal = document.getElementById("modal-universal-item");
    const form = document.getElementById("form-universal-item");
    const titleText = document.getElementById("universal-modal-title-text");
    const body = document.getElementById("universal-modal-body");
    const btnClose = document.getElementById("btn-close-universal-modal");
    const btnCancel = document.getElementById("btn-cancel-universal-modal");

    function closeModal() {
      if (modal) modal.classList.remove("active");
      currentUniversalModalConfig = null;
    }

    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);

    let currentModalFiles = [];

    function renderModalFilesList(containerId, filesArray, coverInputId = null) {
      const listEl = document.getElementById(containerId);
      if (!listEl) return;

      if (!filesArray || filesArray.length === 0) {
        listEl.innerHTML = `<div style="text-align: center; font-size: 0.78rem; color: var(--text-muted); padding: 0.6rem; border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm);">ยังไม่มีไฟล์แนบ (สามารถคลิกหรือลากไฟล์มาวางด้านบนเพื่อเพิ่มได้)</div>`;
        return;
      }

      listEl.innerHTML = filesArray.map((f, idx) => {
        const p = parseFileInfo(f);
        const coverInput = coverInputId ? document.getElementById(coverInputId) : null;
        const isCover = coverInput && coverInput.value === p.url;
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.45rem 0.6rem; background: var(--bg-page); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden; flex: 1;">
              <i class="${p.faIcon}" style="font-size: 1.1rem; color: var(--primary); flex-shrink: 0;"></i>
              <div style="overflow: hidden; flex: 1;">
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${p.name}</div>
                <div style="font-size: 0.68rem; color: var(--text-muted); display: flex; gap: 0.4rem; align-items: center;">
                  <span style="background: var(--bg-surface); padding: 1px 4px; border-radius: 3px; border: 1px solid var(--border-subtle); font-size: 0.65rem;">${p.label}</span>
                  ${p.size ? `<span>${p.size}</span>` : ''}
                  ${isCover ? '<span style="color: #f59e0b; font-weight: 700;">⭐ ภาพปก</span>' : ''}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.3rem; flex-shrink: 0;">
              ${coverInputId && p.category === "image" ? `
                <button type="button" class="admin-action-btn btn-light btn-set-cover" data-idx="${idx}" style="padding: 0.2rem 0.45rem; font-size: 0.7rem;" title="ตั้งเป็นภาพปก">
                  ⭐ ปก
                </button>
              ` : ''}
              <a href="${p.url}" target="_blank" class="admin-action-btn btn-light" style="padding: 0.2rem 0.45rem; font-size: 0.7rem; text-decoration: none;" title="เปิดดูไฟล์">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
              <button type="button" class="admin-action-btn btn-danger btn-remove-modal-file" data-idx="${idx}" style="padding: 0.2rem 0.45rem; font-size: 0.7rem;" title="ลบไฟล์">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        `;
      }).join("");

      // Wire remove buttons
      listEl.querySelectorAll(".btn-remove-modal-file").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx, 10);
          filesArray.splice(idx, 1);
          renderModalFilesList(containerId, filesArray, coverInputId);
        });
      });

      // Wire set cover buttons
      if (coverInputId) {
        listEl.querySelectorAll(".btn-set-cover").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx, 10);
            const p = parseFileInfo(filesArray[idx]);
            const coverInput = document.getElementById(coverInputId);
            const imgPreview = document.getElementById("modal-act-img-preview");
            if (coverInput) coverInput.value = p.url;
            if (imgPreview) imgPreview.src = p.url;
            renderModalFilesList(containerId, filesArray, coverInputId);
            showToast("ตั้งเป็นภาพปกเรียบร้อยแล้วค่ะ!", "success");
          });
        });
      }
    }

    function wireMultiFileUpload({ dropzone, fileInput, urlInput, btnAddUrl, filesArray, containerId, coverInputId, imgPreview }) {
      if (!dropzone || !fileInput) return;

      dropzone.addEventListener("click", () => fileInput.click());

      fileInput.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        showToast(`🔄 กำลังอัปโหลด ${files.length} ไฟล์...`, "info");
        for (const f of files) {
          const res = await portfolioSupabase.uploadFile(f);
          if (res.success && res.url) {
            const fileObj = {
              name: res.name || f.name,
              url: res.url,
              size: res.size || formatFileSize(f.size),
              type: res.type || f.type
            };
            filesArray.push(fileObj);
            if (coverInputId && imgPreview && parseFileInfo(fileObj)?.category === "image") {
              const coverInp = document.getElementById(coverInputId);
              if (coverInp && !coverInp.value) {
                coverInp.value = fileObj.url;
                imgPreview.src = fileObj.url;
              }
            }
          }
        }
        fileInput.value = "";
        renderModalFilesList(containerId, filesArray, coverInputId);
        showToast("✅ อัปโหลดไฟล์เรียบร้อยแล้วค่ะ", "success");
      });

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("drag-active");
      });
      dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-active"));
      dropzone.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-active");
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length === 0) return;
        showToast(`🔄 กำลังอัปโหลด ${files.length} ไฟล์...`, "info");
        for (const f of files) {
          const res = await portfolioSupabase.uploadFile(f);
          if (res.success && res.url) {
            const fileObj = {
              name: res.name || f.name,
              url: res.url,
              size: res.size || formatFileSize(f.size),
              type: res.type || f.type
            };
            filesArray.push(fileObj);
            if (coverInputId && imgPreview && parseFileInfo(fileObj)?.category === "image") {
              const coverInp = document.getElementById(coverInputId);
              if (coverInp && !coverInp.value) {
                coverInp.value = fileObj.url;
                imgPreview.src = fileObj.url;
              }
            }
          }
        }
        renderModalFilesList(containerId, filesArray, coverInputId);
        showToast("✅ อัปโหลดไฟล์เรียบร้อยแล้วค่ะ", "success");
      });

      if (btnAddUrl && urlInput) {
        btnAddUrl.addEventListener("click", () => {
          const urlVal = urlInput.value.trim();
          if (!urlVal) return;
          const parsed = parseFileInfo(urlVal);
          filesArray.push({
            name: parsed.name,
            url: urlVal,
            type: parsed.category === "youtube" ? "video/youtube" : (parsed.category === "image" ? "image/jpeg" : "application/octet-stream"),
            size: ""
          });
          urlInput.value = "";
          renderModalFilesList(containerId, filesArray, coverInputId);
          showToast("เพิ่มไฟล์จาก URL เรียบร้อย", "success");
        });
      }
    }

    // Open Modal for different entities
    window.openUniversalModal = function(config) {
      currentUniversalModalConfig = config;
      const { mode, entity, data } = config;

      if (!modal || !body) return;

      if (entity === "stat") {
        titleText.textContent = mode === "add" ? "เพิ่มสถิติ / เกรดเฉลี่ยใหม่" : "แก้ไขสถิติ / เกรดเฉลี่ย";
        body.innerHTML = `
          <div class="form-group">
            <label class="form-label">หัวข้อสถิติ (Label)</label>
            <input type="text" id="stat-input-label" class="form-input" value="${data?.label || ''}" placeholder="เช่น เกรดเฉลี่ย ปวส." required>
          </div>
          <div class="form-group">
            <label class="form-label">ตัวเลข / ค่าสถิติ (Value)</label>
            <input type="text" id="stat-input-value" class="form-input" value="${data?.value || ''}" placeholder="เช่น 3.85" required>
          </div>
          <div class="form-group">
            <label class="form-label">ข้อความป้ายกำกับ (Badge)</label>
            <input type="text" id="stat-input-badge" class="form-input" value="${data?.badge || ''}" placeholder="เช่น เกียรตินิยมอันดับ 1">
          </div>
          <div class="form-group">
            <label class="form-label">ไอคอน (Icon)</label>
            <select id="stat-input-icon" class="form-select">
              <option value="award" ${data?.icon === 'award' ? 'selected' : ''}>เหรียญรางวัล (award)</option>
              <option value="star" ${data?.icon === 'star' ? 'selected' : ''}>ดาวเกียรตินิยม (star)</option>
              <option value="folder-check" ${data?.icon === 'folder-check' ? 'selected' : ''}>แฟ้มผลงาน (folder-check)</option>
              <option value="heart" ${data?.icon === 'heart' ? 'selected' : ''}>หัวใจจิตอาสา (heart)</option>
              <option value="bolt" ${data?.icon === 'bolt' ? 'selected' : ''}>สายฟ้าไฟฟ้า (bolt)</option>
              <option value="graduation-cap" ${data?.icon === 'graduation-cap' ? 'selected' : ''}>หมวกปริญญา (graduation-cap)</option>
            </select>
          </div>
        `;
      } else if (entity === "skill") {
        titleText.textContent = mode === "add" ? "เพิ่มทักษะความสามารถใหม่" : "แก้ไขทักษะความสามารถ";
        body.innerHTML = `
          <div class="form-group">
            <label class="form-label">ชื่อทักษะ (Skill Name)</label>
            <input type="text" id="skill-input-name" class="form-input" value="${data?.name || ''}" placeholder="เช่น AutoCAD Electrical" required>
          </div>
          <div class="form-group">
            <label class="form-label">ระดับความชำนาญ (% 0-100)</label>
            <input type="number" id="skill-input-level" class="form-input" min="1" max="100" value="${data?.level || 85}" required>
          </div>
        `;
      } else if (entity === "education") {
        titleText.textContent = mode === "add" ? "เพิ่มประวัติการศึกษาใหม่" : "แก้ไขประวัติการศึกษา";
        body.innerHTML = `
          <div class="form-group">
            <label class="form-label">ระดับการศึกษา</label>
            <input type="text" id="edu-input-level" class="form-input" value="${data?.level || ''}" placeholder="เช่น ระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)" required>
          </div>
          <div class="form-group">
            <label class="form-label">ชื่อสถาบันการศึกษา</label>
            <input type="text" id="edu-input-institution" class="form-input" value="${data?.institution || ''}" placeholder="เช่น วิทยาลัยเทคนิคหัวตะพาน" required>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">เกรดเฉลี่ย (GPA)</label>
              <input type="text" id="edu-input-gpa" class="form-input" value="${data?.gpa || ''}" placeholder="เช่น 3.85">
            </div>
            <div class="form-group">
              <label class="form-label">ปีการศึกษา / ช่วงเวลา</label>
              <input type="text" id="edu-input-period" class="form-input" value="${data?.period || ''}" placeholder="เช่น พ.ศ. 2565 - 2567">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">ป้ายกำกับเกียรตินิยม (Badge)</label>
            <input type="text" id="edu-input-badge" class="form-input" value="${data?.badge || ''}" placeholder="เช่น เกียรตินิยมอันดับ 1 (GPA 3.85)">
          </div>
          <div class="form-group">
            <label class="form-label">รายละเอียดผลการเรียนและกิจกรรมเด่น</label>
            <textarea id="edu-input-desc" class="form-textarea" rows="3">${data?.description || ''}</textarea>
          </div>
        `;
      } else if (entity === "course") {
        titleText.textContent = mode === "add" ? "เพิ่มรายวิชาใหม่" : "แก้ไขรายวิชาและชิ้นงาน";
        currentModalFiles = Array.isArray(data?.files) ? JSON.parse(JSON.stringify(data.files)) : [];
        body.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">รหัสวิชา (Code)</label>
              <input type="text" id="course-input-code" class="form-input" value="${data?.code || ''}" placeholder="เช่น EE-305" required>
            </div>
            <div class="form-group">
              <label class="form-label">ชื่อรายวิชา (Name)</label>
              <input type="text" id="course-input-name" class="form-input" value="${data?.name || ''}" placeholder="เช่น วงจรดิจิทัลและลอจิก" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">หมวดหมู่รายวิชา</label>
            <input type="text" id="course-input-category" class="form-input" value="${data?.category || 'วิศวกรรมไฟฟ้า'}" placeholder="เช่น วิศวกรรมไฟฟ้า / วิชาชีพครู">
          </div>
          <div class="form-group">
            <label class="form-label">คำอธิบายรายวิชา</label>
            <textarea id="course-input-desc" class="form-textarea" rows="2">${data?.description || ''}</textarea>
          </div>

          <!-- Course Multi-Files Attachment Section -->
          <div class="form-group" style="margin-top: 1rem; border-top: 1px dashed var(--border-subtle); padding-top: 0.75rem;">
            <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
              <span><i class="fa-solid fa-paperclip" style="color: var(--primary);"></i> ไฟล์แนบและเอกสารประกอบรายวิชา</span>
              <span style="font-size: 0.72rem; color: var(--text-muted);">PDF, Word, Excel, CAD, Video, ZIP</span>
            </label>
            <div class="dropzone drag-target-zone" id="modal-course-dropzone" style="padding: 1rem; text-align: center; cursor: pointer; border: 2px dashed var(--border-subtle); border-radius: var(--radius-sm);">
              <i class="fa-solid fa-cloud-arrow-up" style="font-size: 1.5rem; color: var(--primary); margin-bottom: 0.25rem;"></i>
              <div style="font-size: 0.82rem; font-weight: 600;">คลิกหรือลากไฟล์หลายชนิดมาวางที่นี่เพื่ออัปโหลด</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">อัปโหลดได้พร้อมกันหลายไฟล์</div>
              <input type="file" id="modal-course-file-input" multiple style="display: none;">
            </div>
            <div style="display: flex; gap: 0.4rem; margin-top: 0.4rem;">
              <input type="text" id="modal-course-url-input" class="form-input" placeholder="หรือใส่ URL ลิงก์ไฟล์ / เอกสารคลาวด์..." style="font-size: 0.8rem;">
              <button type="button" id="modal-course-btn-add-url" class="btn-light" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; white-space: nowrap;">
                <i class="fa-solid fa-plus"></i> เพิ่มจาก URL
              </button>
            </div>
            <div id="modal-course-files-list" style="margin-top: 0.6rem; display: flex; flex-direction: column; gap: 0.35rem; max-height: 180px; overflow-y: auto;"></div>
          </div>
        `;

        renderModalFilesList("modal-course-files-list", currentModalFiles);
        wireMultiFileUpload({
          dropzone: document.getElementById("modal-course-dropzone"),
          fileInput: document.getElementById("modal-course-file-input"),
          urlInput: document.getElementById("modal-course-url-input"),
          btnAddUrl: document.getElementById("modal-course-btn-add-url"),
          filesArray: currentModalFiles,
          containerId: "modal-course-files-list"
        });

      } else if (entity === "activity") {
        titleText.textContent = mode === "add" ? "เพิ่มผลงาน / กิจกรรมใหม่" : "แก้ไขผลงานและกิจกรรม";
        currentModalFiles = Array.isArray(data?.files) ? JSON.parse(JSON.stringify(data.files)) : [];
        if (data?.document && !currentModalFiles.some(f => (typeof f === 'string' ? f : f.url) === data.document)) {
          currentModalFiles.push({ name: data.document.split("/").pop(), url: data.document, type: "application/pdf" });
        }
        body.innerHTML = `
          <div class="form-group">
            <label class="form-label">ชื่อโครงงาน / กิจกรรม</label>
            <input type="text" id="act-input-title" class="form-input" value="${data?.title || ''}" placeholder="เช่น โครงงาน Smart Copper Sorter" required>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">หมวดหมู่</label>
              <select id="act-input-category" class="form-select">
                <option value="โครงงานนวัตกรรม" ${data?.category === 'โครงงานนวัตกรรม' ? 'selected' : ''}>โครงงานนวัตกรรม</option>
                <option value="จิตอาสา & สังคม" ${data?.category === 'จิตอาสา & สังคม' ? 'selected' : ''}>จิตอาสา & สังคม</option>
                <option value="การสอน & อบรม" ${data?.category === 'การสอน & อบรม' ? 'selected' : ''}>การสอน & อบรม</option>
                <option value="ชิ้นงานในรายวิชา" ${data?.category === 'ชิ้นงานในรายวิชา' ? 'selected' : ''}>ชิ้นงานในรายวิชา</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">ช่วงเวลาดำเนินงาน</label>
              <input type="text" id="act-input-date" class="form-input" value="${data?.date || ''}" placeholder="เช่น กันยายน 2568">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">ภาพปกผลงาน (Cover Image)</label>
            <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.5rem;">
              <img id="modal-act-img-preview" src="${data?.image || 'assets/images/activity_1.jpg'}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-subtle); flex-shrink: 0;">
              <div style="flex: 1;">
                <input type="text" id="act-input-image" class="form-input" value="${data?.image || ''}" placeholder="URL ภาพปก (จะเปลี่ยนอัตโนมัติเมื่อกด '⭐ ปก')">
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">อัปโหลดรูปภาพด้านล่างแล้วกด '⭐ ปก' เพื่อตั้งเป็นภาพหลัก</div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">รายละเอียดผลงาน</label>
            <textarea id="act-input-desc" class="form-textarea" rows="3">${data?.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">แท็ก (คั่นด้วยจุลภาค เช่น ไฟฟ้า, Arduino, นวัตกรรม)</label>
            <input type="text" id="act-input-tags" class="form-input" value="${(data?.tags || []).join(', ')}">
          </div>

          <!-- Activity Multi-Files Section -->
          <div class="form-group" style="margin-top: 1rem; border-top: 1px dashed var(--border-subtle); padding-top: 0.75rem;">
            <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
              <span><i class="fa-solid fa-paperclip" style="color: var(--primary);"></i> ไฟล์แนบหลายไฟล์ & หลายชนิด (Multi-Files)</span>
              <span style="font-size: 0.72rem; color: var(--text-muted);">PDF, Word, Excel, Video, YouTube, CAD, ZIP</span>
            </label>
            <div class="dropzone drag-target-zone" id="modal-act-dropzone" style="padding: 1rem; text-align: center; cursor: pointer; border: 2px dashed var(--border-subtle); border-radius: var(--radius-sm);">
              <i class="fa-solid fa-cloud-arrow-up" style="font-size: 1.5rem; color: var(--primary); margin-bottom: 0.25rem;"></i>
              <div style="font-size: 0.82rem; font-weight: 600;">คลิกหรือลากไฟล์หลายชนิดมาวางที่นี่เพื่ออัปโหลดพร้อมกัน</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">อัปโหลดไฟล์รูปภาพ เอกสาร หรือวิดีโอได้ไม่จำกัด</div>
              <input type="file" id="modal-act-file-input" multiple style="display: none;">
            </div>
            <div style="display: flex; gap: 0.4rem; margin-top: 0.4rem;">
              <input type="text" id="modal-act-url-input" class="form-input" placeholder="หรือใส่ URL ลิงก์ไฟล์ / YouTube / เอกสารคลาวด์..." style="font-size: 0.8rem;">
              <button type="button" id="modal-act-btn-add-url" class="btn-light" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; white-space: nowrap;">
                <i class="fa-solid fa-plus"></i> เพิ่มจาก URL
              </button>
            </div>
            <div id="modal-act-files-list" style="margin-top: 0.6rem; display: flex; flex-direction: column; gap: 0.35rem; max-height: 200px; overflow-y: auto;"></div>
          </div>
        `;

        renderModalFilesList("modal-act-files-list", currentModalFiles, "act-input-image");
        wireMultiFileUpload({
          dropzone: document.getElementById("modal-act-dropzone"),
          fileInput: document.getElementById("modal-act-file-input"),
          urlInput: document.getElementById("modal-act-url-input"),
          btnAddUrl: document.getElementById("modal-act-btn-add-url"),
          filesArray: currentModalFiles,
          containerId: "modal-act-files-list",
          coverInputId: "act-input-image",
          imgPreview: document.getElementById("modal-act-img-preview")
        });
      }

      modal.classList.add("active");
      portfolioAudio.playPop();
    };

    // Save Form Submission
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!currentUniversalModalConfig) return;

        const { mode, entity, id, index, catIndex, itemIndex } = currentUniversalModalConfig;

        if (entity === "stat") {
          const label = document.getElementById("stat-input-label").value.trim();
          const value = document.getElementById("stat-input-value").value.trim();
          const badge = document.getElementById("stat-input-badge").value.trim();
          const icon = document.getElementById("stat-input-icon").value;

          if (mode === "add") {
            currentData.stats.push({ label, value, badge, icon });
          } else {
            currentData.stats[index] = { label, value, badge, icon };
          }
          renderStats(currentData.stats);
        } else if (entity === "skill") {
          const name = document.getElementById("skill-input-name").value.trim();
          const level = parseInt(document.getElementById("skill-input-level").value) || 80;

          if (mode === "add") {
            if (!currentData.skills[catIndex].items) currentData.skills[catIndex].items = [];
            currentData.skills[catIndex].items.push({ name, level });
          } else {
            currentData.skills[catIndex].items[itemIndex] = { name, level };
          }
          renderSkills(currentData.skills);
        } else if (entity === "education") {
          const level = document.getElementById("edu-input-level").value.trim();
          const institution = document.getElementById("edu-input-institution").value.trim();
          const gpa = document.getElementById("edu-input-gpa").value.trim();
          const period = document.getElementById("edu-input-period").value.trim();
          const badge = document.getElementById("edu-input-badge").value.trim();
          const description = document.getElementById("edu-input-desc").value.trim();

          if (mode === "add") {
            currentData.education.push({
              id: "edu-" + Date.now(),
              level,
              institution,
              gpa,
              period,
              badge,
              description
            });
          } else {
            const idx = currentData.education.findIndex(x => x.id === id);
            if (idx !== -1) {
              currentData.education[idx] = { ...currentData.education[idx], level, institution, gpa, period, badge, description };
            }
          }
          renderEducation(currentData.education);
        } else if (entity === "course") {
          const code = document.getElementById("course-input-code").value.trim();
          const name = document.getElementById("course-input-name").value.trim();
          const category = document.getElementById("course-input-category").value.trim();
          const description = document.getElementById("course-input-desc").value.trim();
          const files = currentModalFiles;

          if (mode === "add") {
            currentData.courses.push({
              id: "course-" + Date.now(),
              code,
              name,
              category,
              description,
              files,
              artifacts: []
            });
          } else {
            const idx = currentData.courses.findIndex(x => x.id === id);
            if (idx !== -1) {
              currentData.courses[idx] = { ...currentData.courses[idx], code, name, category, description, files };
            }
          }
          renderCourses(currentData.courses);
        } else if (entity === "activity") {
          const title = document.getElementById("act-input-title").value.trim();
          const category = document.getElementById("act-input-category").value;
          const date = document.getElementById("act-input-date").value.trim();
          const files = currentModalFiles;
          const firstImage = (files.find(f => parseFileInfo(f)?.category === 'image')?.url);
          const image = document.getElementById("act-input-image").value.trim() || firstImage || "assets/images/activity_1.jpg";
          const description = document.getElementById("act-input-desc").value.trim();
          const tagsStr = document.getElementById("act-input-tags").value.trim();
          const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : ["ผลงาน"];
          const docFile = files.find(f => parseFileInfo(f)?.category === 'pdf' || parseFileInfo(f)?.category === 'document');
          const documentUrl = docFile ? docFile.url : null;

          if (mode === "add") {
            currentData.activities.push({
              id: "act-" + Date.now(),
              title,
              category,
              date,
              image,
              description,
              tags,
              document: documentUrl,
              files
            });
          } else {
            const idx = currentData.activities.findIndex(x => x.id === id);
            if (idx !== -1) {
              currentData.activities[idx] = {
                ...currentData.activities[idx],
                title,
                category,
                date,
                image,
                description,
                tags,
                document: documentUrl || currentData.activities[idx].document,
                files
              };
            }
          }
          renderActivities(currentData.activities);
        }

        // Save data and push to cloud!
        portfolioStorage.saveData(currentData, true);
        closeModal();
        portfolioAudio.playChime();
        showToast("บันทึกข้อมูลเรียบร้อยแล้วค่ะ!", "success");
      });
    }

    // Event Delegations for Edit & Delete buttons across the admin drawer
    document.addEventListener("click", (e) => {
      // 1. Stats CRUD
      const btnAddStat = e.target.closest("#btn-add-stat");
      if (btnAddStat) {
        window.openUniversalModal({ mode: "add", entity: "stat", data: null });
      }

      const btnEditStat = e.target.closest(".btn-edit-stat");
      if (btnEditStat) {
        const idx = parseInt(btnEditStat.dataset.index);
        window.openUniversalModal({ mode: "edit", entity: "stat", index: idx, data: currentData.stats[idx] });
      }

      const btnDelStat = e.target.closest(".btn-delete-stat");
      if (btnDelStat) {
        const idx = parseInt(btnDelStat.dataset.index);
        if (confirm(`คุณแน่ใจว่าต้องการลบสถิติ "${currentData.stats[idx]?.label}" หรือไม่?`)) {
          currentData.stats.splice(idx, 1);
          portfolioStorage.saveData(currentData, true);
          renderStats(currentData.stats);
          portfolioAudio.playPop();
          showToast("ลบสถิติเรียบร้อยแล้วค่ะ", "info");
        }
      }

      // 2. Skills CRUD
      const btnAddSkill = e.target.closest("#btn-add-skill");
      if (btnAddSkill) {
        const catName = prompt("ระบุชื่อหมวดหมู่ทักษะใหม่ (เช่น เครื่องมือดิจิทัล & การสื่อสาร):");
        if (catName) {
          if (!currentData.skills) currentData.skills = [];
          currentData.skills.push({ category: catName, items: [] });
          portfolioStorage.saveData(currentData, true);
          renderSkills(currentData.skills);
        }
      }

      const btnAddSkillItem = e.target.closest(".btn-add-skill-item");
      if (btnAddSkillItem) {
        const catIdx = parseInt(btnAddSkillItem.dataset.catIndex);
        window.openUniversalModal({ mode: "add", entity: "skill", catIndex: catIdx, data: null });
      }

      const btnEditSkillItem = e.target.closest(".btn-edit-skill-item");
      if (btnEditSkillItem) {
        const catIdx = parseInt(btnEditSkillItem.dataset.catIndex);
        const itemIdx = parseInt(btnEditSkillItem.dataset.itemIndex);
        window.openUniversalModal({ mode: "edit", entity: "skill", catIndex: catIdx, itemIndex: itemIdx, data: currentData.skills[catIdx].items[itemIdx] });
      }

      const btnDelSkillItem = e.target.closest(".btn-delete-skill-item");
      if (btnDelSkillItem) {
        const catIdx = parseInt(btnDelSkillItem.dataset.catIndex);
        const itemIdx = parseInt(btnDelSkillItem.dataset.itemIndex);
        if (confirm("คุณต้องการลบทักษะนี้หรือไม่?")) {
          currentData.skills[catIdx].items.splice(itemIdx, 1);
          portfolioStorage.saveData(currentData, true);
          renderSkills(currentData.skills);
          portfolioAudio.playPop();
          showToast("ลบทักษะเรียบร้อยแล้วค่ะ", "info");
        }
      }

      // 3. Education Edit & Delete
      const btnAddEdu = e.target.closest("#btn-add-edu");
      if (btnAddEdu) {
        window.openUniversalModal({ mode: "add", entity: "education", data: null });
      }

      const btnEditEdu = e.target.closest(".btn-edit-edu");
      if (btnEditEdu) {
        const edu = currentData.education.find(x => x.id === btnEditEdu.dataset.id);
        if (edu) {
          window.openUniversalModal({ mode: "edit", entity: "education", id: edu.id, data: edu });
        }
      }

      const btnDelEdu = e.target.closest(".btn-delete-edu");
      if (btnDelEdu) {
        if (confirm("คุณแน่ใจว่าต้องการลบระดับการศึกษานี้หรือไม่?")) {
          currentData.education = currentData.education.filter(x => x.id !== btnDelEdu.dataset.id);
          portfolioStorage.saveData(currentData, true);
          renderEducation(currentData.education);
          portfolioAudio.playPop();
          showToast("ลบประวัติการศึกษาเรียบร้อยแล้วค่ะ", "info");
        }
      }

      // 4. Course Edit & Delete
      const btnAddCourse = e.target.closest("#btn-add-course");
      if (btnAddCourse) {
        window.openUniversalModal({ mode: "add", entity: "course", data: null });
      }

      const btnEditCourse = e.target.closest(".btn-edit-course");
      if (btnEditCourse) {
        const course = currentData.courses.find(x => x.id === btnEditCourse.dataset.id);
        if (course) {
          window.openUniversalModal({ mode: "edit", entity: "course", id: course.id, data: course });
        }
      }

      const btnDelCourse = e.target.closest(".btn-delete-course");
      if (btnDelCourse) {
        if (confirm("คุณแน่ใจว่าต้องการลบรายวิชานี้หรือไม่?")) {
          currentData.courses = currentData.courses.filter(x => x.id !== btnDelCourse.dataset.id);
          portfolioStorage.saveData(currentData, true);
          renderCourses(currentData.courses);
          portfolioAudio.playPop();
          showToast("ลบรายวิชาเรียบร้อยแล้วค่ะ", "info");
        }
      }

      // 5. Activity Edit & Delete
      const btnAddAct = e.target.closest("#btn-add-activity");
      if (btnAddAct) {
        window.openUniversalModal({ mode: "add", entity: "activity", data: null });
      }

      const btnEditAct = e.target.closest(".btn-edit-activity");
      if (btnEditAct) {
        const act = currentData.activities.find(x => x.id === btnEditAct.dataset.id);
        if (act) {
          window.openUniversalModal({ mode: "edit", entity: "activity", id: act.id, data: act });
        }
      }

      const btnDelAct = e.target.closest(".btn-delete-activity");
      if (btnDelAct) {
        if (confirm("คุณแน่ใจว่าต้องการลบผลงานนี้หรือไม่?")) {
          currentData.activities = currentData.activities.filter(x => x.id !== btnDelAct.dataset.id);
          portfolioStorage.saveData(currentData, true);
          renderActivities(currentData.activities);
          portfolioAudio.playPop();
          showToast("ลบผลงานเรียบร้อยแล้วค่ะ", "info");
        }
      }
    });
  }

  // -------------------------------------------------------------
  // UNIVERSAL DRAG-AND-DROP FILE UPLOAD SYSTEM
  // -------------------------------------------------------------

  function setupDragAndDropEverywhere() {
    // 1. Hero Avatar Drop & Click Upload
    const heroWrapper = document.getElementById("hero-portrait-wrapper");
    const inputHeroAvatar = document.getElementById("input-hero-avatar");

    if (heroWrapper && inputHeroAvatar) {
      heroWrapper.addEventListener("click", () => inputHeroAvatar.click());

      inputHeroAvatar.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) handleAvatarUpload(file);
      });

      heroWrapper.addEventListener("dragover", (e) => {
        e.preventDefault();
        heroWrapper.classList.add("drag-active");
      });
      heroWrapper.addEventListener("dragleave", () => heroWrapper.classList.remove("drag-active"));
      heroWrapper.addEventListener("drop", (e) => {
        e.preventDefault();
        heroWrapper.classList.remove("drag-active");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleAvatarUpload(e.dataTransfer.files[0]);
        }
      });
    }

    // 2. Profile Page Avatar Drop & Click Upload
    const profileAvatarOverlay = document.getElementById("profile-avatar-drop-overlay");
    const inputProfileAvatar = document.getElementById("input-profile-page-avatar");

    if (profileAvatarOverlay && inputProfileAvatar) {
      profileAvatarOverlay.addEventListener("click", () => inputProfileAvatar.click());

      inputProfileAvatar.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) handleAvatarUpload(file);
      });

      profileAvatarOverlay.parentElement.addEventListener("dragover", (e) => {
        e.preventDefault();
        profileAvatarOverlay.parentElement.classList.add("drag-active");
      });
      profileAvatarOverlay.parentElement.addEventListener("dragleave", () => profileAvatarOverlay.parentElement.classList.remove("drag-active"));
      profileAvatarOverlay.parentElement.addEventListener("drop", (e) => {
        e.preventDefault();
        profileAvatarOverlay.parentElement.classList.remove("drag-active");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleAvatarUpload(e.dataTransfer.files[0]);
        }
      });
    }

    // 3. Drawer Avatar Dropzone
    const drawerAvatarDropzone = document.getElementById("drawer-avatar-dropzone");
    const inputDrawerAvatar = document.getElementById("input-drawer-avatar");

    if (drawerAvatarDropzone && inputDrawerAvatar) {
      drawerAvatarDropzone.addEventListener("click", () => inputDrawerAvatar.click());
      inputDrawerAvatar.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) handleAvatarUpload(e.target.files[0]);
      });
      drawerAvatarDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        drawerAvatarDropzone.style.borderColor = "var(--primary)";
      });
      drawerAvatarDropzone.addEventListener("dragleave", () => drawerAvatarDropzone.style.borderColor = "");
      drawerAvatarDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        drawerAvatarDropzone.style.borderColor = "";
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleAvatarUpload(e.dataTransfer.files[0]);
        }
      });
    }

    async function handleAvatarUpload(file) {
      showToast("🔄 กำลังอัปโหลดรูปโปรไฟล์...", "info");
      const res = await portfolioSupabase.uploadFile(file);
      if (res.success && res.url) {
        currentData.profile.avatar = res.url;
        portfolioStorage.saveData(currentData, true);
        renderProfile(currentData.profile);
        portfolioAudio.playChime();
        showToast("เปลี่ยนรูปถ่ายโปรไฟล์สำเร็จเรียบร้อยแล้วค่ะ!", "success");
      } else {
        alert("ไม่สามารถอัปโหลดรูปภาพได้: " + (res.error || ""));
      }
    }

    // 4. Drag & Drop Directly onto Activity & Course Cards (Multi-files & Multi-types)
    document.addEventListener("dragover", (e) => {
      const card = e.target.closest(".activity-card, .course-card");
      if (card) {
        e.preventDefault();
        card.classList.add("drag-active");
      }
    });

    document.addEventListener("dragleave", (e) => {
      const card = e.target.closest(".activity-card, .course-card");
      if (card) card.classList.remove("drag-active");
    });

    document.addEventListener("drop", async (e) => {
      const actCard = e.target.closest(".activity-card");
      const courseCard = e.target.closest(".course-card");

      if (actCard && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        e.preventDefault();
        actCard.classList.remove("drag-active");
        const actId = actCard.dataset.activityId;
        const files = Array.from(e.dataTransfer.files);

        showToast(`🔄 กำลังอัปโหลด ${files.length} ไฟล์เข้าสู่กิจกรรม...`, "info");
        try {
          const uploaded = [];
          for (const f of files) {
            const res = await portfolioSupabase.uploadFile(f);
            if (res.success && res.url) {
              uploaded.push({
                name: res.name || f.name,
                url: res.url,
                size: res.size || formatFileSize(f.size),
                type: res.type || f.type
              });
            }
          }
          const act = currentData.activities.find(x => x.id === actId);
          if (act && uploaded.length > 0) {
            if (!Array.isArray(act.files)) act.files = [];
            act.files.push(...uploaded);
            const imgFile = uploaded.find(u => parseFileInfo(u)?.category === "image");
            if (imgFile && (!act.image || act.image.includes("activity_1.jpg"))) {
              act.image = imgFile.url;
            }
            portfolioStorage.saveData(currentData, true);
            renderActivities(currentData.activities);
            portfolioAudio.playChime();
            showToast(`✅ เพิ่ม ${uploaded.length} ไฟล์ในกิจกรรม "${act.title}" สำเร็จแล้ว!`, "success");
          }
        } catch (err) {
          console.error("Drop error:", err);
          showToast("❌ เกิดข้อผิดพลาดในการอัปโหลดไฟล์", "warning");
        }
        return;
      }

      if (courseCard && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        e.preventDefault();
        courseCard.classList.remove("drag-active");
        const courseId = courseCard.dataset.courseId;
        const files = Array.from(e.dataTransfer.files);

        showToast(`🔄 กำลังอัปโหลด ${files.length} ไฟล์เข้าสู่รายวิชา...`, "info");
        try {
          const uploaded = [];
          for (const f of files) {
            const res = await portfolioSupabase.uploadFile(f);
            if (res.success && res.url) {
              uploaded.push({
                name: res.name || f.name,
                url: res.url,
                size: res.size || formatFileSize(f.size),
                type: res.type || f.type
              });
            }
          }
          const course = currentData.courses.find(x => x.id === courseId);
          if (course && uploaded.length > 0) {
            if (!Array.isArray(course.files)) course.files = [];
            course.files.push(...uploaded);
            portfolioStorage.saveData(currentData, true);
            renderCourses(currentData.courses);
            portfolioAudio.playChime();
            showToast(`✅ เพิ่ม ${uploaded.length} ไฟล์ในรายวิชา "${course.name}" สำเร็จแล้ว!`, "success");
          }
        } catch (err) {
          console.error("Drop error:", err);
          showToast("❌ เกิดข้อผิดพลาดในการอัปโหลดไฟล์", "warning");
        }
      }
    });
  }

  // -------------------------------------------------------------
  // UNIVERSAL FILE UPLOADER & FILE MANAGER
  // -------------------------------------------------------------

  function setupUniversalUploader() {
    const dropzone = document.getElementById("file-dropzone");
    const fileInput = document.getElementById("input-universal-file");
    const filesList = document.getElementById("uploaded-files-list");
    const countBadge = document.getElementById("uploaded-files-count");
    const searchInput = document.getElementById("input-search-files");
    const statusText = document.getElementById("dropzone-status");
    let currentCategoryFilter = "all";

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("drag-active");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("drag-active");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("drag-active");
      if (e.dataTransfer.files) {
        handleUploadFiles(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files) {
        handleUploadFiles(e.target.files);
      }
    });

    async function handleUploadFiles(files) {
      if (statusText) {
        statusText.style.display = "block";
        statusText.textContent = `กำลังอัปโหลด ${files.length} ไฟล์...`;
      }

      for (const file of files) {
        const uploadResult = await portfolioSupabase.uploadFile(file);
        const fileId = "file-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);

        let category = "document";
        if (file.type.startsWith("image/")) category = "image";
        else if (file.type.startsWith("video/")) category = "video";
        else if (file.name.endsWith(".pdf")) category = "pdf";
        else if (file.name.endsWith(".ttf") || file.name.endsWith(".woff") || file.name.endsWith(".woff2") || file.name.endsWith(".otf")) category = "font";

        const fileObj = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || category,
          category: category,
          dataUrl: uploadResult.url,
          storage: uploadResult.storage || "local",
          uploadedAt: new Date().toISOString()
        };

        await portfolioStorage.saveFile(fileObj);

        // Auto register custom fonts
        if (category === "font") {
          registerCustomFont(file.name.replace(/\.[^/.]+$/, ""), uploadResult.url);
        }
      }

      if (statusText) {
        statusText.textContent = `✅ อัปโหลดเสร็จสิ้น ${files.length} ไฟล์!`;
        setTimeout(() => statusText.style.display = "none", 3000);
      }

      portfolioAudio.playChime();
      showToast(`อัปโหลดสำเร็จ ${files.length} ไฟล์เรียบร้อยแล้วค่ะ!`, "success");
      renderUploadedFilesList();
    }

    // Category Filter Buttons
    document.querySelectorAll(".file-cat-filter").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".file-cat-filter").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategoryFilter = btn.dataset.fileCat;
        renderUploadedFilesList();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => renderUploadedFilesList());
    }

    async function renderUploadedFilesList() {
      if (!filesList) return;
      const allFiles = await portfolioStorage.getAllFiles();
      const searchQuery = (searchInput?.value || "").toLowerCase().trim();

      const filtered = allFiles.filter(f => {
        const matchesCategory = currentCategoryFilter === "all" || f.category === currentCategoryFilter;
        const matchesSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
      });

      if (countBadge) countBadge.textContent = filtered.length;

      if (!filtered.length) {
        filesList.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem 0;">ไม่พบไฟล์ในคลัง</span>`;
        return;
      }

      filesList.innerHTML = filtered.map(f => {
        let iconClass = "fa-solid fa-file";
        let isImg = f.category === "image";
        if (f.category === "video") iconClass = "fa-solid fa-file-video";
        if (f.category === "pdf") iconClass = "fa-solid fa-file-pdf";
        if (f.category === "font") iconClass = "fa-solid fa-font";

        return `
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem; overflow: hidden; max-width: 280px;">
              ${isImg ? `
                <img src="${f.dataUrl}" style="width: 34px; height: 34px; border-radius: 4px; object-fit: cover; border: 1px solid var(--border-subtle);">
              ` : `
                <div style="width: 34px; height: 34px; border-radius: 4px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1rem;">
                  <i class="${iconClass}"></i>
                </div>
              `}
              <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <strong>${f.name}</strong>
                <div style="font-size: 0.72rem; color: var(--text-muted);">${(f.size / 1024).toFixed(1)} KB • ${f.storage === 'supabase' ? 'Cloud' : 'Local'}</div>
              </div>
            </div>
            <div style="display: flex; gap: 0.3rem;">
              ${isImg ? `
                <button class="admin-action-btn btn-light btn-use-avatar" data-url="${f.dataUrl}" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;" title="ใช้เป็นรูปโปรไฟล์">
                  <i class="fa-solid fa-user"></i> ใช้รูป
                </button>
              ` : ''}
              <button class="admin-action-btn btn-light btn-copy-url" data-url="${f.dataUrl}" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;" title="คัดลอก URL ของไฟล์">
                <i class="fa-solid fa-link"></i> คัดลอก
              </button>
              <button class="admin-action-btn btn-danger btn-delete-stored-file" data-id="${f.id}" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;" title="ลบไฟล์">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      }).join("");
    }

    // Actions delegation for file list
    document.addEventListener("click", async (e) => {
      // Use as Avatar
      const btnUseAvatar = e.target.closest(".btn-use-avatar");
      if (btnUseAvatar) {
        currentData.profile.avatar = btnUseAvatar.dataset.url;
        portfolioStorage.saveData(currentData, true);
        renderProfile(currentData.profile);
        portfolioAudio.playChime();
        showToast("เปลี่ยนรูปถ่ายโปรไฟล์เรียบร้อยแล้วค่ะ!", "success");
      }

      // Copy URL
      const btnCopy = e.target.closest(".btn-copy-url");
      if (btnCopy) {
        const url = btnCopy.dataset.url;
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          portfolioAudio.playPop();
          showToast("คัดลอกลิงก์ไฟล์เรียบร้อยแล้ว!", "info");
        } else {
          prompt("คัดลอกลิงก์นี้:", url);
        }
      }

      // Delete file
      const btnDel = e.target.closest(".btn-delete-stored-file");
      if (btnDel) {
        if (confirm("คุณแน่ใจว่าต้องการลบไฟล์นี้หรือไม่?")) {
          await portfolioStorage.deleteFile(btnDel.dataset.id);
          renderUploadedFilesList();
          portfolioAudio.playPop();
          showToast("ลบไฟล์ออกจากคลังเรียบร้อยแล้ว", "info");
        }
      }
    });

    renderUploadedFilesList();
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

      history.replaceState(null, null, `#${tabId}`);
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (navTabs && navTabs.classList.contains("mobile-open")) {
        navTabs.classList.remove("mobile-open");
      }
    }

    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-go-tab]");
      if (target) {
        e.preventDefault();
        switchTab(target.dataset.goTab);
      }
    });

    const brandHomeBtn = document.getElementById("brand-home-btn");
    if (brandHomeBtn) {
      brandHomeBtn.addEventListener("click", () => switchTab("home"));
    }

    const heroBtnExplore = document.getElementById("hero-btn-explore");
    if (heroBtnExplore) {
      heroBtnExplore.addEventListener("click", () => switchTab("activities"));
    }
    const heroBtnContact = document.getElementById("hero-btn-contact");
    if (heroBtnContact) {
      heroBtnContact.addEventListener("click", () => switchTab("profile"));
    }

    if (mobileMenuBtn && navTabs) {
      mobileMenuBtn.addEventListener("click", () => {
        navTabs.classList.toggle("mobile-open");
        portfolioAudio.playPop();
      });
    }

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

  const btnToggleTheme = document.getElementById("btn-toggle-theme");
  if (btnToggleTheme) {
    btnToggleTheme.addEventListener("click", () => {
      portfolioAudio.playPop();
      currentData.themeSettings.darkMode = !currentData.themeSettings.darkMode;
      portfolioStorage.saveData(currentData, true);
      applyThemeSettings(currentData.themeSettings);
    });
  }

  const btnToggleSound = document.getElementById("btn-toggle-sound");
  if (btnToggleSound) {
    btnToggleSound.addEventListener("click", () => {
      const nowEnabled = portfolioAudio.toggleSound();
      currentData.themeSettings.soundEffects = nowEnabled;
      portfolioStorage.saveData(currentData, true);
      btnToggleSound.querySelector("i").className = nowEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
      if (nowEnabled) portfolioAudio.playPop();
    });
  }

  // -------------------------------------------------------------
  // HIDDEN LOGIN SYSTEM (Ctrl + Alt + P)
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

    let keysPressed = {};
    window.addEventListener("keydown", (e) => {
      const key = (e.key || "").toLowerCase();
      keysPressed[key] = true;

      // Primary shortcut: Ctrl + Alt + P (or Cmd + Alt + P on macOS)
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isP = key === "p" || e.code === "KeyP";

      const isCtrlAltP = isCtrlOrCmd && isAlt && isP;
      const isLegacyCtrlLO = e.ctrlKey && keysPressed["l"] && keysPressed["o"];

      if (isCtrlAltP || isLegacyCtrlLO) {
        e.preventDefault();
        openLoginModal();
      }
    });
    window.addEventListener("keyup", (e) => {
      const key = (e.key || "").toLowerCase();
      delete keysPressed[key];
    });

    if (footerTrigger) footerTrigger.addEventListener("click", openLoginModal);

    function updateLoginButtonsUI(loggedIn) {
      const navBtn = document.getElementById("btn-nav-login");
      const footerBtn = document.getElementById("btn-footer-login");
      const mobileBtn = document.getElementById("btn-mobile-login");

      if (loggedIn) {
        if (navBtn) {
          navBtn.classList.add("logged-in");
          navBtn.title = "แผงควบคุมผู้ดูแล (Admin Bar เปิดอยู่)";
          navBtn.innerHTML = `<i class="fa-solid fa-user-check"></i>`;
        }
        if (footerBtn) {
          footerBtn.classList.add("logged-in");
          footerBtn.title = "คุณเข้าสู่ระบบผู้ดูแลแล้ว (คลิกเพื่อเปิด/ปิด แผงควบคุม)";
          footerBtn.innerHTML = `<i class="fa-solid fa-user-check"></i> <span>ผู้ดูแลระบบ (Admin)</span>`;
        }
        if (mobileBtn) {
          mobileBtn.innerHTML = `<i class="fa-solid fa-user-check"></i> <span>ผู้ดูแลระบบ (Admin)</span>`;
        }
      } else {
        if (navBtn) {
          navBtn.classList.remove("logged-in");
          navBtn.title = "เข้าสู่ระบบผู้ดูแล (Admin Login)";
          navBtn.innerHTML = `<i class="fa-solid fa-lock"></i>`;
        }
        if (footerBtn) {
          footerBtn.classList.remove("logged-in");
          footerBtn.title = "คลิกเพื่อเข้าสู่ระบบผู้ดูแล (Admin Login)";
          footerBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> <span>เข้าสู่ระบบ (Login)</span>`;
        }
        if (mobileBtn) {
          mobileBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> <span>เข้าสู่ระบบ (Login)</span>`;
        }
      }
    }

    function handleLoginButtonClick(e) {
      if (e) e.preventDefault();
      if (isLoggedIn) {
        if (adminBar) {
          adminBar.classList.toggle("active");
          portfolioAudio.playPop();
          showToast(adminBar.classList.contains("active") ? "เปิดแถบเครื่องมือแอดมินแล้ว" : "ซ่อนแถบเครื่องมือแอดมินแล้ว", "info");
        }
      } else {
        openLoginModal();
      }
    }

    document.querySelectorAll(".login-btn-trigger, #btn-footer-login, #btn-nav-login, #btn-mobile-login").forEach(btn => {
      btn.addEventListener("click", handleLoginButtonClick);
    });

    document.querySelectorAll("[data-close-modal='modal-login']").forEach(btn => {
      btn.addEventListener("click", closeLoginModal);
    });

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
          updateLoginButtonsUI(true);
          portfolioAudio.playChime();
          showToast("เข้าสู่ระบบแอดมินสำเร็จ! คุณบุ๋มบิ๋มสามารถแก้ไขทุกจุดได้ทันทีค่ะ", "success");
        } else {
          portfolioAudio.playPop(300);
          if (errorMsg) errorMsg.style.display = "block";
        }
      });
    }

    if (isLoggedIn && adminBar) {
      adminBar.classList.add("active");
    }
    updateLoginButtonsUI(isLoggedIn);

    const btnLogout = document.getElementById("btn-admin-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        isLoggedIn = false;
        sessionStorage.removeItem("bumbim_admin_logged_in");
        if (adminBar) adminBar.classList.remove("active");
        updateLoginButtonsUI(false);
        exitQuickEdit();
        closeDrawer();
        portfolioAudio.playPop();
        showToast("ออกจากระบบแอดมินเรียบร้อยแล้ว", "info");
      });
    }
  }

  // -------------------------------------------------------------
  // ADMIN DRAWER & QUICK EDIT MODE
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
      showToast("เปิดโหมดแก้ไขด่วน: คลิกที่ข้อความบนหน้าเว็บเพื่อแก้ไขได้โดยตรง", "info");
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
        renderAll(currentData);
        showToast("ยกเลิกการแก้ไขด่วนแล้ว", "info");
      });
    }

    if (btnSaveQuick) {
      btnSaveQuick.addEventListener("click", () => {
        document.querySelectorAll("[data-editable]").forEach(el => {
          const path = el.dataset.editable;
          const val = el.innerText.trim();
          setNestedValue(currentData, path, val);
        });

        portfolioStorage.saveData(currentData, true);
        exitQuickEdit();
        renderAll(currentData);
        portfolioAudio.playChime();
        showToast("บันทึกการแก้ไขข้อความด่วนทั้งหมดเรียบร้อยแล้วค่ะ!", "success");
      });
    }

    // Admin Drawer Control
    const drawer = document.getElementById("admin-drawer");
    const btnOpenDrawer = document.getElementById("btn-open-drawer");
    const btnCloseDrawer = document.getElementById("btn-close-drawer");
    const btnQuickFiles = document.getElementById("btn-quick-files");

    window.openDrawer = function(targetPane = null) {
      if (drawer) drawer.classList.add("open");
      if (targetPane) {
        document.querySelectorAll(".drawer-nav-item").forEach(i => {
          i.classList.toggle("active", i.dataset.pane === targetPane);
        });
        document.querySelectorAll(".drawer-pane").forEach(p => {
          p.classList.toggle("active", p.id === targetPane);
        });
      }
      portfolioAudio.playPop();
    };

    window.closeDrawer = function() {
      if (drawer) drawer.classList.remove("open");
    };

    if (btnOpenDrawer) btnOpenDrawer.addEventListener("click", () => openDrawer());
    if (btnQuickFiles) btnQuickFiles.addEventListener("click", () => openDrawer("pane-upload"));
    if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", () => closeDrawer());

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
        portfolioStorage.saveData(currentData, true);
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
        portfolioStorage.saveData(currentData, true);
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
        portfolioStorage.saveData(currentData, true);
        applyThemeSettings(currentData.themeSettings);
      });
    }

    const checkSound = document.getElementById("check-sound");
    if (checkSound) {
      checkSound.checked = currentData.themeSettings.soundEffects !== false;
      checkSound.addEventListener("change", (e) => {
        currentData.themeSettings.soundEffects = e.target.checked;
        portfolioStorage.saveData(currentData, true);
        applyThemeSettings(currentData.themeSettings);
      });
    }

    // Full Profile Form Save in Drawer
    const formProfile = document.getElementById("form-edit-profile");
    if (formProfile) {
      formProfile.addEventListener("submit", (e) => {
        e.preventDefault();

        currentData.profile.name = document.getElementById("edit-profile-name").value.trim();
        currentData.profile.nickname = document.getElementById("edit-profile-nickname").value.trim();
        currentData.profile.title = document.getElementById("edit-profile-title").value.trim();
        currentData.profile.studentId = document.getElementById("edit-profile-studentId").value.trim();
        currentData.profile.statusBadge = document.getElementById("edit-profile-statusBadge").value.trim();
        currentData.profile.university = document.getElementById("edit-profile-university").value.trim();
        currentData.profile.faculty = document.getElementById("edit-profile-faculty").value.trim();
        currentData.profile.major = document.getElementById("edit-profile-major").value.trim();
        currentData.profile.phone = document.getElementById("edit-profile-phone").value.trim();
        currentData.profile.email = document.getElementById("edit-profile-email").value.trim();
        currentData.profile.birthdate = document.getElementById("edit-profile-birthdate").value.trim();
        currentData.profile.age = document.getElementById("edit-profile-age").value.trim();
        currentData.profile.nationality = document.getElementById("edit-profile-nationality").value.trim();
        currentData.profile.ethnicity = document.getElementById("edit-profile-ethnicity").value.trim();
        currentData.profile.motto = document.getElementById("edit-profile-motto").value.trim();
        currentData.profile.bio = document.getElementById("edit-profile-bio").value.trim();

        if (document.getElementById("edit-profile-avatar").value.trim()) {
          currentData.profile.avatar = document.getElementById("edit-profile-avatar").value.trim();
        }

        if (!currentData.profile.socials) currentData.profile.socials = {};
        currentData.profile.socials.line = document.getElementById("edit-profile-line").value.trim();
        currentData.profile.socials.facebook = document.getElementById("edit-profile-facebook").value.trim();

        portfolioStorage.saveData(currentData, true);
        renderProfile(currentData.profile);
        portfolioAudio.playChime();
        showToast("บันทึกข้อมูลส่วนตัวทั้งหมดเรียบร้อยแล้วค่ะ!", "success");
      });
    }

    // Lightbox view for activities & courses (Multi-media switcher & Attached files)
    function openLightboxViewer({ title, category, dateOrCode, description, tags, mediaList, filesList }) {
      const modal = document.getElementById("modal-lightbox");
      const container = document.getElementById("lightbox-container");
      const titleEl = document.getElementById("lightbox-title");

      if (titleEl) titleEl.innerHTML = title;

      if (!container) return;

      function renderMediaViewer(mediaItem) {
        if (!mediaItem) {
          return `<div style="padding: 2rem; color: var(--text-muted); font-size: 0.85rem;"><i class="fa-solid fa-file-circle-check"></i> ไม่พบไฟล์แสดงตัวอย่างสื่อ</div>`;
        }
        const p = parseFileInfo(mediaItem);
        if (p.category === "youtube") {
          const ytMatch = p.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
          const ytId = ytMatch ? ytMatch[1] : null;
          if (ytId) {
            return `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" style="width: 100%; height: 380px; border: none; border-radius: 8px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
          }
        }
        if (p.category === "video") {
          return `<video src="${p.url}" controls autoplay style="max-height: 48vh; width: 100%; border-radius: 8px; background: #000;"></video>`;
        }
        if (p.category === "image") {
          return `<img src="${p.url}" alt="${p.name}" style="max-height: 48vh; width: 100%; object-fit: contain; border-radius: 8px; background: rgba(0,0,0,0.03);">`;
        }
        return `
          <div style="padding: 2.5rem; text-align: center;">
            <i class="${p.faIcon}" style="font-size: 3rem; color: var(--primary); margin-bottom: 0.75rem; display: block;"></i>
            <div style="font-weight: 600; font-size: 1rem; color: var(--text-primary);">${p.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">${p.label} ${p.size ? `(${p.size})` : ''}</div>
            <a href="${p.url}" target="_blank" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.4rem; margin-top: 1rem; padding: 0.4rem 1rem; text-decoration: none; font-size: 0.85rem;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> เปิดดูเอกสารในแท็บใหม่
            </a>
          </div>
        `;
      }

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; width: 100%; max-width: 820px;">
          <!-- Active Media Viewer Frame -->
          <div id="lightbox-active-viewer" style="width: 100%; min-height: 200px; display: flex; align-items: center; justify-content: center; background: #000; border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 0.75rem;">
            ${renderMediaViewer(mediaList[0])}
          </div>

          <!-- Multi-media Thumbnail Switcher Strip -->
          ${mediaList.length > 1 ? `
            <div id="lightbox-gallery-strip" style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 0.75rem;">
              ${mediaList.map((m, idx) => {
                const mp = parseFileInfo(m);
                return `
                  <div class="lightbox-thumb-btn ${idx === 0 ? 'active' : ''}" data-idx="${idx}" style="cursor: pointer; width: 68px; height: 50px; border-radius: 4px; overflow: hidden; border: 2px solid ${idx === 0 ? 'var(--primary)' : 'var(--border-subtle)'}; flex-shrink: 0; background: var(--bg-surface); display: flex; align-items: center; justify-content: center;">
                    ${mp.category === 'image' ? `<img src="${mp.url}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="${mp.faIcon}" style="font-size: 1.2rem; color: var(--primary);"></i>`}
                  </div>
                `;
              }).join("")}
            </div>
          ` : ''}

          <!-- Header Tags & Date -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.78rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 3px 10px; border-radius: 12px; color: var(--primary); font-weight: 600;">
              ${category}
            </span>
            ${dateOrCode ? `<span style="font-size: 0.78rem; color: var(--text-muted);"><i class="fa-regular fa-clock"></i> ${dateOrCode}</span>` : ''}
          </div>

          <!-- Description -->
          <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.75rem;">${description || ''}</p>

          <!-- Tags -->
          ${tags && tags.length ? `
            <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem;">
              ${tags.map(t => `<span class="tag-pill">#${t}</span>`).join("")}
            </div>
          ` : ''}

          <!-- Attached Files Section -->
          ${filesList && filesList.length ? `
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-top: 0.5rem;">
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-paperclip" style="color: var(--primary);"></i> ไฟล์แนบและเอกสารทั้งหมด (${filesList.length} รายการ):
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.45rem; max-height: 220px; overflow-y: auto;">
                ${filesList.map(f => {
                  const p = parseFileInfo(f);
                  return `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.75rem; background: var(--bg-page); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); gap: 0.5rem;">
                      <div style="display: flex; align-items: center; gap: 0.6rem; overflow: hidden; flex: 1;">
                        <i class="${p.faIcon}" style="font-size: 1.25rem; color: var(--primary); flex-shrink: 0;"></i>
                        <div style="overflow: hidden; flex: 1;">
                          <div style="font-size: 0.84rem; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${p.name}</div>
                          <div style="font-size: 0.7rem; color: var(--text-muted); display: flex; gap: 0.5rem; align-items: center; margin-top: 2px;">
                            <span style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 1px 5px; border-radius: 3px; font-weight: 600; font-size: 0.68rem;">${p.label}</span>
                            ${p.size ? `<span>${p.size}</span>` : ''}
                          </div>
                        </div>
                      </div>
                      <div style="display: flex; gap: 0.35rem; flex-shrink: 0;">
                        <a href="${p.url}" target="_blank" class="artifact-action" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; text-decoration: none; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.3rem;">
                          <i class="fa-solid fa-eye"></i> เปิดดู
                        </a>
                        <a href="${p.url}" download="${p.name}" target="_blank" class="artifact-action" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; text-decoration: none; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.3rem;">
                          <i class="fa-solid fa-download"></i> ดาวน์โหลด
                        </a>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      // Wire gallery strip clicks
      const galleryStrip = document.getElementById("lightbox-gallery-strip");
      const activeViewer = document.getElementById("lightbox-active-viewer");
      if (galleryStrip && activeViewer) {
        galleryStrip.querySelectorAll(".lightbox-thumb-btn").forEach(thumb => {
          thumb.addEventListener("click", () => {
            const idx = parseInt(thumb.dataset.idx, 10);
            galleryStrip.querySelectorAll(".lightbox-thumb-btn").forEach(t => {
              t.style.borderColor = "var(--border-subtle)";
              t.classList.remove("active");
            });
            thumb.style.borderColor = "var(--primary)";
            thumb.classList.add("active");
            activeViewer.innerHTML = renderMediaViewer(mediaList[idx]);
          });
        });
      }

      if (modal) modal.classList.add("active");
      portfolioAudio.playPop();
    }

    document.addEventListener("click", (e) => {
      // 1. View Activity in Lightbox
      const btnAct = e.target.closest(".btn-view-activity");
      if (btnAct) {
        const act = currentData.activities.find(x => x.id === btnAct.dataset.id);
        if (act) {
          const allFiles = Array.isArray(act.files) ? [...act.files] : [];
          if (act.image && !allFiles.some(f => (typeof f === 'string' ? f : f.url) === act.image)) {
            allFiles.unshift({ name: "ภาพหน้าปก", url: act.image, type: "image/jpeg" });
          }
          if (act.document && !allFiles.some(f => (typeof f === 'string' ? f : f.url) === act.document)) {
            allFiles.push({ name: "เอกสารแนบ", url: act.document, type: "application/pdf" });
          }

          const mediaList = allFiles.filter(f => {
            const p = parseFileInfo(f);
            return p && (p.category === "image" || p.category === "video" || p.category === "youtube");
          });
          if (mediaList.length === 0 && act.image) {
            mediaList.push({ name: act.title, url: act.image, type: "image/jpeg" });
          }

          openLightboxViewer({
            title: `<i class="fa-solid fa-trophy" style="color:var(--primary);"></i> ${act.title}`,
            category: act.category,
            dateOrCode: act.date,
            description: act.description,
            tags: act.tags || [],
            mediaList,
            filesList: allFiles
          });
        }
        return;
      }

      // 2. View Course in Lightbox
      const btnCourse = e.target.closest(".btn-view-course");
      if (btnCourse) {
        const course = currentData.courses.find(x => x.id === btnCourse.dataset.id);
        if (course) {
          const allFiles = Array.isArray(course.files) ? [...course.files] : [];
          if (Array.isArray(course.artifacts)) {
            course.artifacts.forEach(art => {
              if (Array.isArray(art.files)) {
                art.files.forEach(af => allFiles.push(af));
              } else if (art.file) {
                allFiles.push({ name: art.title, url: art.file, type: art.type || "application/pdf" });
              }
            });
          }

          const mediaList = allFiles.filter(f => {
            const p = parseFileInfo(f);
            return p && (p.category === "image" || p.category === "video" || p.category === "youtube");
          });
          if (mediaList.length === 0 && allFiles.length > 0) {
            mediaList.push(allFiles[0]);
          }

          openLightboxViewer({
            title: `<i class="fa-solid fa-book-open" style="color:var(--primary);"></i> ${course.code}: ${course.name}`,
            category: course.category,
            dateOrCode: course.code,
            description: course.description,
            tags: [course.category, `${course.artifacts ? course.artifacts.length : 0} ชิ้นงาน`],
            mediaList,
            filesList: allFiles
          });
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

    // Factory Reset
    const btnReset = document.getElementById("btn-reset-default");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        if (confirm("คำเตือน: คุณแน่ใจว่าต้องการล้างข้อมูลทั้งหมดและคืนค่าเริ่มต้นจากโรงงานใช่หรือไม่? ข้อมูลที่แก้ไขจะหายไป")) {
          localStorage.removeItem("bumbim_portfolio_data_v1");
          window.location.reload();
        }
      });
    }
  }

  // -------------------------------------------------------------
  // CUSTOM FONTS
  // -------------------------------------------------------------

  function registerCustomFont(fontName, base64OrUrl) {
    try {
      const font = new FontFace(fontName, `url(${base64OrUrl})`);
      font.load().then(loadedFont => {
        document.fonts.add(loadedFont);
        const select = document.getElementById("select-font-family");
        if (select) {
          let opt = select.querySelector(`option[value="${fontName}"]`);
          if (!opt) {
            opt = document.createElement("option");
            opt.value = fontName;
            opt.textContent = `${fontName} (Custom Font)`;
            select.appendChild(opt);
          }
          select.value = fontName;
          document.body.style.fontFamily = `'${fontName}', sans-serif`;
        }
      });
    } catch (e) {
      console.warn("Font loading note:", e);
    }
  }

  async function loadStoredCustomFonts() {
    const files = await portfolioStorage.getAllFiles();
    files.forEach(f => {
      if (f.category === "font" || f.name.endsWith(".ttf") || f.name.endsWith(".woff") || f.name.endsWith(".woff2") || f.name.endsWith(".otf")) {
        registerCustomFont(f.name.replace(/\.[^/.]+$/, ""), f.dataUrl);
      }
    });
  }

  // -------------------------------------------------------------
  // PRINT
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
  // UTILITY HELPERS
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
