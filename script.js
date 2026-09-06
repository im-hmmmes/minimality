(() => {
  "use strict";

  const STORAGE_KEY = "minimality-search-engine";
  const LANGUAGE_KEY = "minimality-language";
  const THEME_KEY = "minimality-theme";
  const engines = {
    google: {
      url: "https://www.google.com/search?q=",
      label: "Google",
    },
    bing: {
      url: "https://www.bing.com/search?q=",
      label: "Bing",
    },
    duckduckgo: {
      url: "https://duckduckgo.com/?q=",
      label: "DuckDuckGo",
    },
    brave: {
      url: "https://search.brave.com/search?q=",
      label: "Brave",
    },
    yahoo: {
      url: "https://search.yahoo.com/search?p=",
      label: "Yahoo",
    },
    baidu: {
      url: "https://www.baidu.com/s?wd=",
      label: "Baidu",
    },
  };

  const translations = {
    zhHant: {
      greeting: ["早安", "午安", "晚安"],
      searchLabel: "搜尋網頁",
      placeholder: "搜尋網頁",
      search: "搜尋",
      searchWith: "使用 {engine} 搜尋",
      engine: "搜尋引擎",
      sidebar: "導覽",
      sidebarLabels: { login: "登入", settings: "設定" },
      sidebarToggleOpen: "展開側欄",
      sidebarToggleClose: "收合側欄",
      dialogClose: "關閉",
      loginTitle: "登入",
      unavailable: "尚未開放",
      loginMessage: "登入功能尚未開發。",
      settingsTitle: "設定",
      savedEngine: "選擇預設搜尋引擎",
      languageSetting: "介面語言",
      languageOptions: { auto: "自動（瀏覽器）", zhHant: "繁體中文", zhHans: "简体中文", en: "English" },
      themeSetting: "外觀",
      themeOptions: { auto: "跟隨系統", light: "淺色", dark: "深色" },
      dateOptions: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
    },
    zhHans: {
      greeting: ["早上好", "下午好", "晚上好"],
      searchLabel: "搜索网页",
      placeholder: "搜索网页",
      search: "搜索",
      searchWith: "使用 {engine} 搜索",
      engine: "搜索引擎",
      sidebar: "导航",
      sidebarLabels: { login: "登录", settings: "设置" },
      sidebarToggleOpen: "展开侧栏",
      sidebarToggleClose: "收起侧栏",
      dialogClose: "关闭",
      loginTitle: "登录",
      unavailable: "尚未开放",
      loginMessage: "登录功能尚未开发。",
      settingsTitle: "设置",
      savedEngine: "选择默认搜索引擎",
      languageSetting: "界面语言",
      languageOptions: { auto: "自动（浏览器）", zhHant: "繁體中文", zhHans: "简体中文", en: "English" },
      themeSetting: "外观",
      themeOptions: { auto: "跟随系统", light: "浅色", dark: "深色" },
      dateOptions: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
    },
    en: {
      greeting: ["Good morning", "Good afternoon", "Good evening"],
      searchLabel: "Search the web",
      placeholder: "Search the web",
      search: "Search",
      searchWith: "Search with {engine}",
      engine: "Search engine",
      sidebar: "Navigation",
      sidebarLabels: { login: "Sign in", settings: "Settings" },
      sidebarToggleOpen: "Open sidebar",
      sidebarToggleClose: "Close sidebar",
      dialogClose: "Close",
      loginTitle: "Sign in",
      unavailable: "Not available yet",
      loginMessage: "Sign-in is not implemented yet.",
      settingsTitle: "Settings",
      savedEngine: "Choose your default search engine",
      languageSetting: "Interface language",
      languageOptions: { auto: "Auto (browser)", zhHant: "繁體中文", zhHans: "简体中文", en: "English" },
      themeSetting: "Appearance",
      themeOptions: { auto: "System", light: "Light", dark: "Dark" },
      dateOptions: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
    },
  };

  const browserLocale = navigator.language || "en-US";
  const getLanguageFromLocale = (locale) => {
    const normalizedLocale = locale.toLowerCase();
    if (["zh", "zh-cn", "zh-sg"].includes(normalizedLocale) || normalizedLocale.startsWith("zh-hans")) return "zhHans";
    if (["zh-tw", "zh-hk", "zh-mo"].includes(normalizedLocale) || normalizedLocale.startsWith("zh-hant")) return "zhHant";
    return "en";
  };

  let languagePreference = "auto";
  try {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
    if (["auto", "zhHant", "zhHans", "en"].includes(savedLanguage)) languagePreference = savedLanguage;
  } catch {
    // Use automatic language detection when storage is unavailable.
  }

  let language = languagePreference === "auto" ? getLanguageFromLocale(browserLocale) : languagePreference;
  let copy = translations[language];
  let formatLocale = language === "zhHant" ? "zh-TW" : language === "zhHans" ? "zh-CN" : "en-US";

  const elements = {
    date: document.querySelector("#date"),
    time: document.querySelector("#time"),
    greeting: document.querySelector("#greeting"),
    form: document.querySelector("#search-form"),
    searchRow: document.querySelector(".search-row"),
    input: document.querySelector("#search-input"),
    searchLabel: document.querySelector("#search-label"),
    submitButton: document.querySelector("#submit-button"),
    themeColor: document.querySelector("#theme-color"),
    sidebar: document.querySelector(".sidebar"),
    sidebarScrim: document.querySelector("#sidebar-scrim"),
    sidebarToggle: document.querySelector("#sidebar-toggle"),
    sidebarToggleLabel: document.querySelector("#sidebar-toggle-label"),
    sidebarButtons: [...document.querySelectorAll("[data-sidebar-action]")],
    sidebarLabels: [...document.querySelectorAll("[data-sidebar-label]")],
    dialog: document.querySelector("#utility-dialog"),
    dialogTitle: document.querySelector("#dialog-title"),
    dialogContent: document.querySelector("#dialog-content"),
    dialogClose: document.querySelector("#dialog-close"),
  };
  let dialogTrigger = null;
  let dialogCloseTimer = null;
  let emptyFeedbackTimer = null;

  let sidebarExpanded = false;
  try {
    sidebarExpanded = window.localStorage.getItem("minimality-sidebar-state") === "expanded";
  } catch {
    // Use the compact sidebar when storage is unavailable.
  }

  const applyLocalization = () => {
    language = languagePreference === "auto" ? getLanguageFromLocale(browserLocale) : languagePreference;
    copy = translations[language];
    formatLocale = language === "zhHant" ? "zh-TW" : language === "zhHans" ? "zh-CN" : "en-US";
    document.documentElement.lang = language === "zhHant" ? "zh-Hant" : language === "zhHans" ? "zh-Hans" : "en";
    document.title = language === "zhHant" ? "新分頁" : language === "zhHans" ? "新标签页" : "New tab";
    elements.searchLabel.textContent = copy.searchLabel;
    elements.input.placeholder = copy.placeholder;
    elements.input.setAttribute("aria-label", copy.searchLabel);
    updateSearchActionLabel();
    elements.sidebar.setAttribute("aria-label", copy.sidebar);
    elements.sidebarLabels.forEach((label) => {
      const buttonLabel = copy.sidebarLabels[label.dataset.sidebarLabel];
      const button = label.closest("button");
      label.textContent = buttonLabel;
      button.setAttribute("aria-label", buttonLabel);
      button.dataset.tooltip = buttonLabel;
    });
    elements.dialogClose.setAttribute("aria-label", copy.dialogClose);
    const toggleLabel = sidebarExpanded ? copy.sidebarToggleClose : copy.sidebarToggleOpen;
    elements.sidebarToggleLabel.textContent = toggleLabel;
    elements.sidebarToggle.setAttribute("aria-label", toggleLabel);
    elements.sidebarToggle.dataset.tooltip = toggleLabel;
  };

  const setSidebarExpanded = (expanded, persist = true) => {
    sidebarExpanded = expanded;
    document.body.classList.toggle("sidebar-expanded", sidebarExpanded);
    document.body.classList.toggle("sidebar-collapsed", !sidebarExpanded);
    elements.sidebarToggle.setAttribute("aria-expanded", String(sidebarExpanded));
    const toggleLabel = sidebarExpanded ? copy.sidebarToggleClose : copy.sidebarToggleOpen;
    elements.sidebarToggleLabel.textContent = toggleLabel;
    elements.sidebarToggle.setAttribute("aria-label", toggleLabel);
    elements.sidebarToggle.dataset.tooltip = toggleLabel;
    if (persist) {
      try {
        window.localStorage.setItem("minimality-sidebar-state", sidebarExpanded ? "expanded" : "collapsed");
      } catch {
        // Keep the current state in memory when storage is unavailable.
      }
    }
  };

  const getGreeting = (hour) => {
    if (hour < 12) return copy.greeting[0];
    if (hour < 18) return copy.greeting[1];
    return copy.greeting[2];
  };

  const updateClock = () => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    elements.greeting.textContent = getGreeting(now.getHours());
    elements.date.textContent = new Intl.DateTimeFormat(formatLocale, copy.dateOptions).format(now);
    elements.date.dateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    elements.time.textContent = new Intl.DateTimeFormat(formatLocale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
    elements.time.dateTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  let selectedEngine = "google";
  try {
    const savedEngine = window.localStorage.getItem(STORAGE_KEY);
    if (savedEngine && engines[savedEngine]) selectedEngine = savedEngine;
  } catch {
    // Private browsing modes can deny localStorage; the page remains usable.
  }

  const updateSearchActionLabel = () => {
    const actionLabel = copy.searchWith.replace("{engine}", engines[selectedEngine].label);
    elements.submitButton.setAttribute("aria-label", actionLabel);
    elements.submitButton.setAttribute("title", actionLabel);
  };

  const setEngine = (engine) => {
    if (!engines[engine]) return;
    selectedEngine = engine;
    try {
      window.localStorage.setItem(STORAGE_KEY, selectedEngine);
    } catch {
      // Keep the current choice in memory when storage is unavailable.
    }
    updateSearchActionLabel();
  };

  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let themePreference = "auto";
  try {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    if (["auto", "light", "dark"].includes(savedTheme)) themePreference = savedTheme;
  } catch {
    // Follow the system theme when storage is unavailable.
  }

  const applyTheme = () => {
    const resolvedTheme = themePreference === "auto" ? (systemTheme.matches ? "dark" : "light") : themePreference;
    document.documentElement.dataset.theme = resolvedTheme;
    elements.themeColor.content = resolvedTheme === "dark" ? "#1d201e" : "#f5f1eb";
  };

  const setThemePreference = (preference) => {
    if (!["auto", "light", "dark"].includes(preference)) return;
    themePreference = preference;
    try {
      window.localStorage.setItem(THEME_KEY, themePreference);
    } catch {
      // Keep the current theme in memory when storage is unavailable.
    }
    applyTheme();
    syncSettingsSelection();
  };

  const setLanguagePreference = (preference) => {
    if (!["auto", "zhHant", "zhHans", "en"].includes(preference)) return;
    languagePreference = preference;
    try {
      window.localStorage.setItem(LANGUAGE_KEY, languagePreference);
    } catch {
      // Keep the current language in memory when storage is unavailable.
    }
    applyLocalization();
    updateClock();
    openDialog("settings", `[data-dialog-language="${preference}"]`);
  };

  const syncChoiceGroup = (selector, dataKey, selectedValue) => {
    elements.dialogContent.querySelectorAll(selector).forEach((button) => {
      const isSelected = button.dataset[dataKey] === selectedValue;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  };

  const syncSettingsSelection = () => {
    syncChoiceGroup("[data-dialog-engine]", "dialogEngine", selectedEngine);
    syncChoiceGroup("[data-dialog-language]", "dialogLanguage", languagePreference);
    syncChoiceGroup("[data-dialog-theme]", "dialogTheme", themePreference);
  };

  const openDialog = (action, focusSelector = "") => {
    if (action === "login") {
      elements.dialogTitle.textContent = copy.loginTitle;
      elements.dialogContent.innerHTML = `
        <div class="unavailable-state">
          <span class="unavailable-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="3.25" />
              <path d="M5.5 19.25c.8-3.2 3.03-4.75 6.5-4.75s5.7 1.55 6.5 4.75" />
            </svg>
          </span>
          <span>
            <span class="unavailable-label">${copy.unavailable}</span>
            <span class="dialog-message">${copy.loginMessage}</span>
          </span>
        </div>`;
    }

    if (action === "settings") {
      elements.dialogTitle.textContent = copy.settingsTitle;
      elements.dialogContent.innerHTML = `
        <div class="settings-section">
          <h3 class="settings-label">${copy.savedEngine}</h3>
          <div class="dialog-engine-picker" role="group" aria-label="${copy.engine}">
            ${Object.entries(engines).map(([id, engine]) => `
              <button class="engine-button" type="button" data-dialog-engine="${id}">
                <span>${engine.label}</span>
                <span class="engine-check" aria-hidden="true">✓</span>
              </button>
            `).join("")}
          </div>
        </div>
        <div class="settings-section">
          <h3 class="settings-label">${copy.languageSetting}</h3>
          <div class="dialog-language-picker" role="group" aria-label="${copy.languageSetting}">
            ${Object.entries(copy.languageOptions).map(([id, label]) => `
              <button class="engine-button" type="button" data-dialog-language="${id}">
                <span>${label}</span>
                <span class="engine-check" aria-hidden="true">✓</span>
              </button>
            `).join("")}
          </div>
        </div>
        <div class="settings-section">
          <h3 class="settings-label">${copy.themeSetting}</h3>
          <div class="dialog-theme-picker" role="group" aria-label="${copy.themeSetting}">
            ${Object.entries(copy.themeOptions).map(([id, label]) => `
              <button class="engine-button" type="button" data-dialog-theme="${id}">
                <span>${label}</span>
                <span class="engine-check" aria-hidden="true">✓</span>
              </button>
            `).join("")}
          </div>
        </div>`;
      elements.dialogContent.querySelectorAll("[data-dialog-engine]").forEach((button) => {
        button.addEventListener("click", () => {
          setEngine(button.dataset.dialogEngine);
          syncSettingsSelection();
        });
      });
      elements.dialogContent.querySelectorAll("[data-dialog-language]").forEach((button) => {
        button.addEventListener("click", () => setLanguagePreference(button.dataset.dialogLanguage));
      });
      elements.dialogContent.querySelectorAll("[data-dialog-theme]").forEach((button) => {
        button.addEventListener("click", () => setThemePreference(button.dataset.dialogTheme));
      });
      syncSettingsSelection();
    }

    if (!elements.dialog.open) elements.dialog.showModal();
    if (focusSelector) {
      window.requestAnimationFrame(() => {
        elements.dialogContent.querySelector(focusSelector)?.focus({ preventScroll: true });
      });
    }
  };

  elements.sidebarToggle.addEventListener("click", () => setSidebarExpanded(!sidebarExpanded));
  elements.sidebarScrim.addEventListener("click", () => setSidebarExpanded(false));

  elements.sidebarButtons.forEach((button) => {
    button.addEventListener("click", () => {
      dialogTrigger = button;
      if (window.matchMedia("(max-width: 720px)").matches) setSidebarExpanded(false);
      openDialog(button.dataset.sidebarAction);
    });
  });
  const resetViewportPosition = () => window.scrollTo(0, 0);
  const closeDialog = () => {
    if (!elements.dialog.open || elements.dialog.classList.contains("is-closing")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.dialog.close();
      return;
    }
    elements.dialog.classList.add("is-closing");
    dialogCloseTimer = window.setTimeout(() => {
      dialogCloseTimer = null;
      if (elements.dialog.open) elements.dialog.close();
    }, 170);
  };

  elements.dialogClose.addEventListener("click", closeDialog);
  elements.dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  elements.dialog.addEventListener("close", () => {
    if (dialogCloseTimer !== null) {
      window.clearTimeout(dialogCloseTimer);
      dialogCloseTimer = null;
    }
    elements.dialog.classList.remove("is-closing");
    resetViewportPosition();
    const trigger = dialogTrigger;
    dialogTrigger = null;
    window.requestAnimationFrame(() => trigger?.focus({ preventScroll: true }));
  });
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) closeDialog();
  });
  document.addEventListener("pointerdown", () => document.body.classList.remove("keyboard-navigation"), true);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab" || event.key.startsWith("Arrow")) {
      document.body.classList.add("keyboard-navigation");
    }
  }, true);
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !elements.dialog.open && document.activeElement !== elements.input) {
      event.preventDefault();
      elements.input.focus({ preventScroll: true });
      return;
    }
    if (event.key === "Escape" && document.activeElement === elements.input && elements.input.value) {
      elements.input.value = "";
      elements.input.removeAttribute("aria-invalid");
      elements.form.classList.remove("is-empty");
      return;
    }
    if (event.key === "Escape" && sidebarExpanded) setSidebarExpanded(false);
  });

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = elements.input.value.trim();
    if (!query) {
      if (emptyFeedbackTimer !== null) window.clearTimeout(emptyFeedbackTimer);
      elements.form.classList.remove("is-empty");
      void elements.form.offsetWidth;
      elements.form.classList.add("is-empty");
      elements.input.setAttribute("aria-invalid", "true");
      elements.input.focus({ preventScroll: true });
      emptyFeedbackTimer = window.setTimeout(() => {
        elements.form.classList.remove("is-empty");
        emptyFeedbackTimer = null;
      }, 420);
      return;
    }
    window.location.assign(`${engines[selectedEngine].url}${encodeURIComponent(query)}`);
  });

  elements.input.addEventListener("input", () => {
    elements.input.removeAttribute("aria-invalid");
    elements.form.classList.remove("is-empty");
    if (emptyFeedbackTimer !== null) {
      window.clearTimeout(emptyFeedbackTimer);
      emptyFeedbackTimer = null;
    }
  });

  systemTheme.addEventListener("change", () => {
    if (themePreference === "auto") applyTheme();
  });

  applyTheme();
  applyLocalization();
  setEngine(selectedEngine);
  setSidebarExpanded(sidebarExpanded, false);
  updateClock();
  window.requestAnimationFrame(() => {
    resetViewportPosition();
    if (!sidebarExpanded && document.visibilityState === "visible" && window.matchMedia("(min-width: 721px) and (hover: hover) and (pointer: fine)").matches) {
      elements.input.focus({ preventScroll: true });
    }
  });
  window.setInterval(updateClock, 1000);
})();
