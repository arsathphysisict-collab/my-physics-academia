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

      // A signed-in account gets the student portal navigation only when it
      // has active access to one of the two official Physics courses.
      if (authData.user) {
        const { data: accessRows, error: accessError } = await supabaseClient
          .from('student_course_access')
          .select('course_id')
          .eq('user_id', authData.user.id)
          .eq('access_status', 'active');

        if (accessError) throw accessError;

        const officialCourseIds = new Set([
          '0ec687ef-1617-43c1-8777-c56f6ce835e1',
          'a0678519-b9ae-4845-a979-515107a34cb9'
        ]);
        const hasActiveCourse = (accessRows || []).some(row =>
          officialCourseIds.has(row.course_id)
        );

        if (hasActiveCourse) {
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

        // Signed in, but has not purchased/enrolled in an official course:
        // keep the public website navigation and hide only Student Login.
        nav.querySelector('a[href="student-login.html"]')?.remove();
      }

      // Public navigation for signed-out visitors and signed-in users
      // who do not have active access to either official course.
      const brand = document.querySelector('header .brand');
      if (brand) brand.href = 'index.html';
      const currentPage = location.pathname.split('/').pop() || 'index.html';
      nav.querySelectorAll('a').forEach(link => {
        link.classList.toggle('on', link.getAttribute('href') === currentPage);
      });
    } catch (error) {
      // Fail safely: leave the original public navigation in place.
      console.error('Student navigation could not be updated:', error);
    }
  }

  initStudentNavigation();
})();