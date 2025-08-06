document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('mobile-menu-button');
  const nav = document.getElementById('side-nav');
  if (button && nav) {
    button.addEventListener('click', () => {
      nav.classList.toggle('hidden');
      nav.classList.toggle('show');
    });
  }
});
