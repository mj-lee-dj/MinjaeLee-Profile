(() => {
  // Revalidate the HTML on return to a public tab. Versioned assets identify a
  // release; storage and draft edits are left intact through the reload.
  const signature = (doc) => [...doc.querySelectorAll('script[src], link[rel="stylesheet"][href]')]
    .map((node) => node.getAttribute('src') || node.getAttribute('href'))
    .filter((url) => /[?&]v=/.test(url)).join('\n');
  const current = signature(document);
  let checking = false;
  let reloading = false;
  async function check() {
    if (checking || reloading || document.visibilityState === 'hidden' || !current) return;
    checking = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(location.pathname, { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
      if (!response.ok) return;
      const latest = signature(new DOMParser().parseFromString(await response.text(), 'text/html'));
      if (latest && latest !== current) {
        reloading = true;
        location.reload();
      }
    } catch (_) {
      // Offline visits remain usable; try again when the tab is revisited.
    } finally {
      clearTimeout(timeout);
      checking = false;
    }
  }
  window.addEventListener('pageshow', check);
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', check);
  setInterval(check, 60000);
})();
