(() => {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const key = 'akhil-theme';
  let preference = 'system';
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch (_) {}

  const moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 13A8.7 8.7 0 0 1 11 3.4 8.8 8.8 0 1 0 20.6 13Z"/></svg>';
  const sun = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>';
  const isDark = () => preference === 'dark' || (preference === 'system' && system.matches);

  function apply() {
    if (preference === 'system') delete root.dataset.theme;
    else root.dataset.theme = preference;
    const dark = isDark();
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
      button.innerHTML = dark ? sun : moon;
      button.setAttribute('aria-label', label);
      button.title = label;
      if (button.parentElement.classList.contains('theme-control')) button.parentElement.hidden = false;
    });
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.content = dark ? '#181818' : '#faf9f6';
    });
    dispatchEvent(new CustomEvent('portfolio:theme', { detail: { dark } }));
  }

  function toggle() {
    preference = isDark() ? 'light' : 'dark';
    try { localStorage.setItem(key, preference); } catch (_) {}
    apply();
  }

  window.PortfolioTheme = { get isDark() { return isDark(); }, toggle };
  system.addEventListener('change', apply);
  addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : 'system';
    apply();
  });
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', toggle));
    apply();
  });
})();
