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
    const nav = document.querySelector('nav.links');
    if (!nav) return;
    try {
      if (typeof supabaseClient === 'undefined') {
        if (!window.supabase) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
        await loadScript('js/supabase.js');
      }
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) throw error;
      if (!data.user) {
        const enroll = document.getElementById('nav-enroll');
        if (enroll) enroll.style.visibility = 'visible';
        return;
      }
      const enroll = document.getElementById('nav-enroll');
      if (enroll) enroll.remove();

      const links = [
        ['My Learning', 'student-home.html'],
        ['Courses', 'courses.html'],
        ['Free Resources', 'resources.html'],
        ['Blog', 'blog.html'],
        ['About', 'about.html'],
        ['Contact', 'contact.html'],
        ['Profile', 'profile.html']
      ];
      const currentPage = location.pathname.split('/').pop() || 'index.html';
      nav.replaceChildren();
      links.forEach(([label, href]) => {
        const link = document.createElement('a');
        link.textContent = label;
        link.href = href;
        if (href === currentPage) link.classList.add('on');
        nav.appendChild(link);
      });
      const brand = document.querySelector('header .brand');
      if (brand) brand.href = 'student-home.html';
    } catch (error) {
      const enroll = document.getElementById('nav-enroll');
      if (enroll) enroll.style.visibility = 'visible';
      console.error('Student navigation could not be updated:', error);
    }
  }

  initStudentNavigation();
})();