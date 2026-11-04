'use strict';
(() => {
  const input = document.getElementById('photo');
  const status = document.getElementById('photo-status');
  const form = document.getElementById('ai-intake');
  if (!input || !status || !form) return;
  const allowed = new Set(['image/jpeg','image/png','image/webp']);
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) { status.textContent = ''; return; }
    if (!allowed.has(file.type) || file.size > 10 * 1024 * 1024 || file.size === 0) {
      input.value = '';
      status.textContent = 'Please select a JPEG, PNG or WebP photo smaller than 10 MB.';
      return;
    }
    status.textContent = 'Photo selected locally: ' + file.name + '. Nothing has been uploaded.';
  });
  form.addEventListener('submit', event => event.preventDefault());
})();
