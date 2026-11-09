(() => {
  const navLink = document.getElementById('student-nav-link') ||
    [...document.querySelectorAll('nav.links a')].find(a => a.textContent.trim() === 'Student Login' || a.textContent.trim() === 'Profile');
  if (!navLink || typeof supabaseClient === 'undefined') return;
  supabaseClient.auth.getUser().then(({ data, error }) => {
    if (error) return;
    if (data.user) {
      navLink.textContent = 'Profile';
      navLink.href = 'profile.html';
      navLink.classList.add('btn');
    } else {
      navLink.textContent = 'Student Login';
      navLink.href = 'student-login.html';
      navLink.classList.remove('btn');
    }
  });
})();