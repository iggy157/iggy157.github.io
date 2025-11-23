// ===== Smooth scroll for internal hash links (if any) =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    e.preventDefault();
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ===== Scroll-to-top button =====
const toTopBtn = document.querySelector('.to-top');

function updateToTopVisibility() {
  if (!toTopBtn) return;
  const shouldShow = window.scrollY > window.innerHeight * 0.8;
  toTopBtn.style.display = shouldShow ? 'flex' : 'none';
}

if (toTopBtn) {
  toTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', updateToTopVisibility, { passive: true });
  updateToTopVisibility();
}

// ===== Status bar & lock screen time/date =====
const statusTimeEl = document.getElementById('status-time');
const lockTimeEl = document.getElementById('lock-time');
const lockDateEl = document.getElementById('lock-date');

function updateTimeAndDate() {
  const now = new Date();

  // Time
  const timeString = now.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  if (statusTimeEl) statusTimeEl.textContent = timeString;
  if (lockTimeEl) lockTimeEl.textContent = timeString;

  // Date：ロック画面の日付は簡易にロケール表示
  if (lockDateEl) {
    const enDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    const jaDate = now.toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short'
    });

    const enSpan = lockDateEl.querySelector('[data-lang="en"]');
    const jaSpan = lockDateEl.querySelector('[data-lang="ja"]');
    if (enSpan) enSpan.textContent = enDate;
    if (jaSpan) jaSpan.textContent = `${jaDate}`;
  }
}

updateTimeAndDate();
setInterval(updateTimeAndDate, 30 * 1000);

// ===== Language switching =====
const LANG_KEY = 'portfolio-lang';
const THEME_KEY = 'portfolio-theme';
const langButtons = document.querySelectorAll('[data-lang-switch]');

function applyLang(lang) {
  const body = document.body;
  if (!body) return;
  if (lang !== 'ja' && lang !== 'en') lang = 'en';

  body.classList.remove('lang-en', 'lang-ja');
  body.classList.add(`lang-${lang}`);
  document.documentElement.setAttribute('lang', lang === 'ja' ? 'ja' : 'en');

  langButtons.forEach((btn) => {
    const target = btn.getAttribute('data-lang-switch');
    btn.classList.toggle('active', target === lang);
  });

  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (e) {
    // localStorage 使えない環境は無視
  }
}

langButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-lang-switch');
    applyLang(target);
  });
});

(function initLang() {
  let stored = null;
  try {
    stored = localStorage.getItem(LANG_KEY);
  } catch (e) {
    stored = null;
  }

  if (stored) {
    applyLang(stored);
    return;
  }

  const navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  const defaultLang = navLang.startsWith('ja') ? 'ja' : 'en';
  applyLang(defaultLang);
})();

// ===== Theme switching =====
function applyTheme(theme) {
  const body = document.body;
  const btn = document.getElementById('theme-toggle-btn');
  if (!body) return;

  if (theme !== 'light' && theme !== 'dark') {
    theme = 'dark';
  }

  body.classList.remove('theme-light', 'theme-dark');
  body.classList.add(`theme-${theme}`);

  if (btn) {
    // アイコンを切り替え（ライトテーマのとき太陽マーク）
    btn.textContent = theme === 'light' ? '☀︎' : '☾';
  }

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // localStorage 使えない環境は無視
  }
}

// 初期テーマ：localStorage -> OS設定 -> dark
(function initTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch (e) {
    stored = null;
  }

  if (stored === 'light' || stored === 'dark') {
    applyTheme(stored);
    return;
  }

  const prefersDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  applyTheme(prefersDark ? 'dark' : 'light');
})();

// トグルボタンのイベント
const themeBtn = document.getElementById('theme-toggle-btn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const body = document.body;
    if (!body) return;
    const isDark = body.classList.contains('theme-dark');
    applyTheme(isDark ? 'light' : 'dark');
  });
}

// ===== App open animation for icons =====
document.querySelectorAll('.icon-card.app-link').forEach((icon) => {
  icon.addEventListener('click', (e) => {
    const href = icon.getAttribute('href');
    const isExternal = icon.target === '_blank' || /^https?:\/\//.test(href || '');

    if (!href || isExternal) {
      // 外部リンクやmailto等はそのまま
      return;
    }

    e.preventDefault();
    icon.classList.add('opening');

    setTimeout(() => {
      window.location.href = href;
    }, 130); // 軽く "ポチッ" としてからページ遷移
  });
});

// ===== Blog posts loader (for /blog/index.html) =====
async function loadPosts(lang) {
  const listId = `blog-list-${lang}`;
  const emptyId = `blog-empty-${lang}`;
  const listEl = document.getElementById(listId);
  const emptyEl = document.getElementById(emptyId);

  if (!listEl) return;

  try {
    const res = await fetch(`/assets/data/posts_${lang}.json`, {
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('failed to fetch');
    const posts = await res.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    listEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'none';

    posts.forEach((post) => {
      const item = document.createElement('div');
      item.className = 'blog-item';

      const titleLink = document.createElement('a');
      titleLink.className = 'blog-item-title';
      titleLink.href = post.url || '#';
      titleLink.textContent = post.title || 'Untitled';
      titleLink.target = '_blank';
      titleLink.rel = 'noreferrer';

      const meta = document.createElement('div');
      meta.className = 'blog-item-meta';
      const dateText = post.date ? post.date : '';
      const tagText =
        post.tags && post.tags.length ? ` · ${post.tags.join(', ')}` : '';
      meta.textContent = `${dateText}${tagText}`;

      item.appendChild(titleLink);
      if (dateText || tagText) item.appendChild(meta);

      listEl.appendChild(item);
    });
  } catch (e) {
    if (emptyEl) emptyEl.style.display = 'block';
  }
}

// ブログページにいる場合のみ発火（要素があれば読み込み）
loadPosts('en');
loadPosts('ja');
