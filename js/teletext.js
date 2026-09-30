/**
 * Broadcast Teletext Magazine Controller
 * Provides interactive Ceefax/Teletext page navigation, live scoreboard,
 * real-time digital clock, reveal/hold buttons, and keyboard page tuning.
 */

class TeletextManager {
  constructor() {
    this.currentPage = "302";
    this.isHeld = false;
    this.isRevealed = false;
    this.keyBuffer = "";
    this.keyBufferTimeout = null;
    this.init();
  }

  init() {
    this.initClock();
    this.bindEvents();
    this.renderFromData();
  }

  // Live Digital Clock (Matches image: COMING UP [Clock Icon] 17:42 Kick-off)
  initClock() {
    const clockEl = document.getElementById("tele-clock-time");
    if (!clockEl) return;

    const updateClock = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      const secs = String(now.getSeconds()).padStart(2, "0");
      clockEl.textContent = `${hrs}:${mins}:${secs}`;
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  bindEvents() {
    // 1. Navigation Links (<< 302 HOME  303 WORKS  304 EDU ... >>)
    document.querySelectorAll(".tele-nav-link").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const targetPage = btn.getAttribute("data-page");
        if (targetPage) this.navigateTo(targetPage);
      });
    });

    // 2. Latest Highlights Links
    document.querySelectorAll(".tele-latest-item").forEach((item) => {
      item.addEventListener("click", () => {
        const page = item.getAttribute("data-target-page") || "303";
        this.navigateTo(page);
      });
    });

    // 3. HOLD Button
    const btnHold = document.getElementById("btn-tele-hold");
    if (btnHold) {
      btnHold.addEventListener("click", () => {
        this.isHeld = !this.isHeld;
        btnHold.classList.toggle("active", this.isHeld);
        btnHold.textContent = this.isHeld ? "HELD" : "HOLD";
        if (window.portfolioAudio) portfolioAudio.playPop();
      });
    }

    // 4. REVEAL Button & Quiz Box
    const btnReveal = document.getElementById("btn-tele-reveal");
    const quizBox = document.getElementById("tele-quiz-box");
    const quizIcon = document.getElementById("tele-quiz-icon");

    const toggleReveal = () => {
      this.isRevealed = !this.isRevealed;
      if (btnReveal) btnReveal.classList.toggle("active", this.isRevealed);
      if (quizBox) quizBox.classList.toggle("revealed", this.isRevealed);
      if (window.portfolioAudio) portfolioAudio.playChime();
    };

    if (btnReveal) btnReveal.addEventListener("click", toggleReveal);
    if (quizIcon) quizIcon.addEventListener("click", toggleReveal);

    // 5. Teletext Extra Button (Admin / Find Out More)
    const btnExtra = document.getElementById("btn-tele-extra");
    if (btnExtra) {
      btnExtra.addEventListener("click", () => {
        // Toggle Admin Drawer or trigger quick info modal
        const drawer = document.getElementById("admin-drawer");
        if (drawer) {
          drawer.classList.add("active");
          if (window.portfolioAudio) portfolioAudio.playPop();
        } else {
          this.navigateTo("306");
        }
      });
    }

    // 6. Action Button (GO TO LIVE SCORES / GO TO PORTFOLIO)
    const btnExplore = document.getElementById("btn-tele-explore");
    if (btnExplore) {
      btnExplore.addEventListener("click", (e) => {
        e.preventDefault();
        this.navigateTo("303");
      });
    }

    // 7. More Scores Button
    const btnMoreScores = document.getElementById("btn-tele-more-scores");
    if (btnMoreScores) {
      btnMoreScores.addEventListener("click", () => {
        this.navigateTo("305");
      });
    }

    // 8. Mode Switcher (Teletext <-> Classic UI)
    const btnThemeToggle = document.getElementById("btn-tele-theme-toggle");
    const btnClassicToggle = document.getElementById("btn-toggle-teletext-classic");
    if (btnThemeToggle) {
      btnThemeToggle.addEventListener("click", () => this.toggleMode());
    }
    if (btnClassicToggle) {
      btnClassicToggle.addEventListener("click", () => this.toggleMode());
    }

    // 9. Numpad / Number Key Teletext Page Tuning (Typing 302, 303, etc.)
    window.addEventListener("keydown", (e) => {
      // Ignore if typing in input/textarea or if modifier keys held
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (/^[0-9]$/.test(e.key)) {
        this.keyBuffer += e.key;
        clearTimeout(this.keyBufferTimeout);

        const pageDisplay = document.getElementById("tele-page-num-top");
        if (pageDisplay) {
          pageDisplay.textContent = this.keyBuffer.padEnd(3, ".");
        }

        if (this.keyBuffer.length === 3) {
          const target = this.keyBuffer;
          this.keyBuffer = "";
          this.navigateTo(target);
        } else {
          this.keyBufferTimeout = setTimeout(() => {
            this.keyBuffer = "";
            if (pageDisplay) pageDisplay.textContent = this.currentPage;
          }, 1500);
        }
      }
    });

    // 10. Hero Art Toggle (Pixel Ball <-> Dithered Avatar) & Drag-Drop
    const heroWrapper = document.getElementById("tele-hero-art-wrapper");
    const ballSvg = document.getElementById("tele-hero-ball-svg");
    const avatarImg = document.getElementById("tele-avatar-img");
    const heroInput = document.getElementById("input-hero-avatar");

    if (heroWrapper) {
      heroWrapper.addEventListener("click", (e) => {
        // Toggle view between pixel soccer ball and avatar
        if (ballSvg && avatarImg) {
          const isBallVisible = ballSvg.style.display !== "none";
          ballSvg.style.display = isBallVisible ? "none" : "block";
          avatarImg.style.display = isBallVisible ? "block" : "none";
          if (window.portfolioAudio) portfolioAudio.playPop();
        }
      });

      heroWrapper.addEventListener("dragover", (e) => {
        e.preventDefault();
        heroWrapper.style.filter = "drop-shadow(0 0 15px #ffff00)";
      });
      heroWrapper.addEventListener("dragleave", () => {
        heroWrapper.style.filter = "drop-shadow(0 0 6px rgba(0, 255, 255, 0.5))";
      });
      heroWrapper.addEventListener("drop", (e) => {
        e.preventDefault();
        heroWrapper.style.filter = "drop-shadow(0 0 6px rgba(0, 255, 255, 0.5))";
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (window.portfolioStorage) {
              const data = portfolioStorage.getData();
              data.profile.avatar = ev.target.result;
              portfolioStorage.saveData(data, true);
            }
            if (avatarImg) {
              avatarImg.src = ev.target.result;
              avatarImg.style.display = "block";
            }
            if (ballSvg) ballSvg.style.display = "none";
            if (window.showToast) showToast("อัปเดตรูปโปรไฟล์ใหม่สำเร็จแล้ว!", "success");
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  navigateTo(page) {
    if (this.isHeld && page !== this.currentPage) {
      // If held, un-hold or briefly alert
      this.isHeld = false;
      const btnHold = document.getElementById("btn-tele-hold");
      if (btnHold) {
        btnHold.classList.remove("active");
        btnHold.textContent = "HOLD";
      }
    }

    const validPages = ["302", "303", "304", "305", "306", "307"];
    const targetPage = validPages.includes(page) ? page : "302";

    this.currentPage = targetPage;

    // Update Top Page Number
    const pageNumEl = document.getElementById("tele-page-num-top");
    const pageTagEl = document.getElementById("tele-page-tag-top");
    const subpagesEl = document.getElementById("tele-subpages-counter");

    const pageTags = {
      "302": "MATCH DAY / HOME",
      "303": "WORKS & PROJECTS",
      "304": "EDUCATION",
      "305": "SKILLS & STATS",
      "306": "ABOUT AROCHA",
      "307": "CERTIFICATES"
    };

    const pageIndices = {
      "302": "01/06",
      "303": "02/06",
      "304": "03/06",
      "305": "04/06",
      "306": "05/06",
      "307": "06/06"
    };

    if (pageNumEl) pageNumEl.textContent = targetPage;
    if (pageTagEl) pageTagEl.textContent = pageTags[targetPage] || "TELETEXT";
    if (subpagesEl) subpagesEl.textContent = `SUBPAGES ${pageIndices[targetPage] || "01/06"}`;

    // Update Nav Active State
    document.querySelectorAll(".tele-nav-link").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("data-page") === targetPage);
    });

    // Toggle Subpage Displays
    document.querySelectorAll(".tele-subpage").forEach((sec) => {
      sec.classList.remove("active");
    });

    const activeSec = document.getElementById(`tele-subpage-${targetPage}`);
    if (activeSec) {
      activeSec.classList.add("active");
    }

    if (window.portfolioAudio) portfolioAudio.playPop();
  }

  toggleMode() {
    const isTeletext = document.body.classList.contains("teletext-mode");
    if (isTeletext) {
      document.body.classList.remove("teletext-mode");
      localStorage.setItem("portfolio_ui_mode", "classic");
    } else {
      document.body.classList.add("teletext-mode");
      localStorage.setItem("portfolio_ui_mode", "teletext");
    }
    if (window.portfolioAudio) portfolioAudio.playChime();
  }

  // Populate dynamic data from StorageManager
  renderFromData() {
    if (!window.portfolioStorage) return;
    const data = portfolioStorage.getData();
    if (!data) return;

    // 1. Profile Data
    const p = data.profile || {};
    const avatarSrc = p.avatar || "assets/images/profile_1.jpg?v=20261001";
    const ballImg = document.getElementById("tele-avatar-img");
    if (ballImg) ballImg.src = avatarSrc;

    // Quiz Reveal Motto
    const quizAnswer = document.getElementById("tele-quiz-answer-text");
    if (quizAnswer) {
      quizAnswer.textContent = `คำคมคุณบุ๋มบิ๋ม: "${p.motto || 'ความรู้ทางวิชาการสร้างรากฐาน ความมุ่งมั่นและการปฏิบัติจริงสร้างอนาคต'}"`;
    }

    // 2. Scoreboard Stats (Match Cards)
    const stats = data.stats || [];
    if (stats.length >= 2) {
      const s0 = document.getElementById("tele-score-0");
      const s1 = document.getElementById("tele-score-1");
      const s2 = document.getElementById("tele-score-2");
      const s3 = document.getElementById("tele-score-3");

      if (s0 && stats[0]) s0.textContent = (stats[0].value || "3.85").replace(".", " - ");
      if (s1 && stats[1]) s1.textContent = (stats[1].value || "3.80").replace(".", " - ");
      if (s2 && stats[2]) s2.textContent = (stats[2].value || "15+").replace("+", " - +");
      if (s3 && stats[3]) s3.textContent = (stats[3].value || "60+").replace("+", " - +");
    }

    // 3. Render Works Subpage (303)
    const worksContainer = document.getElementById("tele-works-list");
    if (worksContainer && data.activities) {
      worksContainer.innerHTML = data.activities.map((act) => `
        <div class="tele-card">
          ${act.image ? `<img src="${act.image}" class="tele-card-img" alt="${act.title}">` : ''}
          <div class="tele-card-title">${act.title}</div>
          <div style="color:var(--tt-cyan); font-size:14px;">[${act.category || 'ผลงาน'}] • ${act.date || ''}</div>
          <p class="tele-card-desc">${act.description || ''}</p>
          <div class="tele-card-tags">
            ${(act.tags || []).map(t => `<span class="tele-card-tag">#${t}</span>`).join('')}
          </div>
          ${act.document ? `<a href="${act.document}" target="_blank" class="tele-btn-action-yellow" style="font-size:16px; padding:3px 8px; margin-top:4px;">เปิดเอกสาร PDF &gt;</a>` : ''}
        </div>
      `).join("");
    }

    // 4. Render Education Subpage (304)
    const eduContainer = document.getElementById("tele-edu-list");
    if (eduContainer && data.education) {
      eduContainer.innerHTML = data.education.map((edu) => `
        <div class="tele-card" style="border-left: 4px solid var(--tt-yellow);">
          <div style="color:var(--tt-cyan); font-size:22px; font-weight:700;">${edu.level || ''} (${edu.year || ''})</div>
          <div style="color:var(--tt-white); font-size:20px;">${edu.institution || ''}</div>
          <div style="color:var(--tt-yellow); font-size:18px;">${edu.major || ''} ${edu.gpa ? `• GPA: ${edu.gpa}` : ''}</div>
          ${edu.honors ? `<div style="color:var(--tt-green); font-size:16px;">🏆 ${edu.honors}</div>` : ''}
          <p class="tele-card-desc">${edu.details || ''}</p>
        </div>
      `).join("");
    }

    // 5. Render Skills Subpage (305)
    const skillsContainer = document.getElementById("tele-skills-list");
    if (skillsContainer && data.skills) {
      skillsContainer.innerHTML = data.skills.map((grp) => `
        <div class="tele-card">
          <div style="color:var(--tt-yellow); font-size:22px; font-weight:700; border-bottom:1px solid var(--tt-cyan); padding-bottom:4px;">
            ${grp.category || 'ทักษะ'}
          </div>
          <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
            ${(grp.items || []).map(it => `
              <div style="display:flex; justify-content:space-between; font-size:18px;">
                <span style="color:var(--tt-white);">${it.name || ''}</span>
                <span style="color:var(--tt-cyan); font-weight:700;">[ ${it.level || 'เชี่ยวชาญ'} ]</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join("");
    }
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.portfolioTeletext = new TeletextManager();

  // Check saved mode or default to teletext mode
  const savedMode = localStorage.getItem("portfolio_ui_mode");
  if (savedMode === "classic") {
    document.body.classList.remove("teletext-mode");
  } else {
    // Default to teletext mode as requested by user
    document.body.classList.add("teletext-mode");
  }
});
