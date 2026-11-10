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

      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError) throw authError;

      if (authData.user) {
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
        return;
      }

      const brand = document.querySelector('header .brand');
      if (brand) brand.href = 'index.html';
      const currentPage = location.pathname.split('/').pop() || 'index.html';
      nav.querySelectorAll('a').forEach(link => {
        link.classList.toggle('on', link.getAttribute('href') === currentPage);
      });
    } catch (error) {
      // Fail safely: leave the original navigation in place.
      console.error('Student navigation could not be updated:', error);
    }
  }

  initStudentNavigation();
})();
