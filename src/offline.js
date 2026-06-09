const params = new URLSearchParams(window.location.search);
const fallbackUrl = 'https://arena.ai/';
const targetUrl = params.get('url') || fallbackUrl;
const error = params.get('error');

document.getElementById('retry').addEventListener('click', () => {
  window.location.href = targetUrl;
});

document.getElementById('browserLink').setAttribute('href', targetUrl);

if (error) {
  document.getElementById('details').textContent = error;
}
