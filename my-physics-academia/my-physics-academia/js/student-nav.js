(() => {
  async function loadScript(src) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not load account navigation.'));
      document.head.appendChild(script);
    });
  }
  async function initStudentNavigation() {
    const navLink = document.getElementById('student-nav-link') ||
      [...document.querySelectorAll('nav.links a')].find(a =>
        a.textContent.trim() === 'Student Login' || a.textContent.trim() === 'Profile');
    if (!navLink) return;
    try {
      if (typeof supabaseClient === 'undefined') {
        if (!window.supabase) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
        await loadScript('js/supabase.js');
      }
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) throw error;
      if (data.user) {
        navLink.textContent = 'Profile';
        navLink.href = 'profile.html';
        navLink.classList.add('btn');
      } else {
        navLink.textContent = 'Student Login';
        navLink.href = 'student-login.html';
        navLink.classList.remove('btn');
      }
    } catch (error) {
      console.error('Student navigation could not be updated:', error);
    }
  }
  initStudentNavigation();
})();