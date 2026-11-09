(() => {
  const logout = document.getElementById('profile-logout');
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const avatarEl = document.getElementById('profile-avatar');
  const coursesBox = document.getElementById('profile-courses');
  const courseNames = {
    '0ec687ef-1617-43c1-8777-c56f6ce835e1': { title: 'Class 11 Physics', level: '11' },
    'a0678519-b9ae-4845-a979-515107a34cb9': { title: 'Class 12 Physics', level: '12' }
  };

  const formatDate = value => value
    ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  function addText(parent, tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value;
    parent.appendChild(element);
    return element;
  }

  async function loadProfile() {
    try {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) throw error;
      if (!data.user) {
        location.replace('student-login.html?return=' + encodeURIComponent('profile.html'));
        return;
      }
      const user = data.user;
      const name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || 'Student';
      nameEl.textContent = name;
      emailEl.textContent = user.email || '';
      avatarEl.textContent = name.trim().charAt(0).toUpperCase() || 'S';
      document.getElementById('profile-created').textContent = formatDate(user.created_at);
      document.getElementById('profile-verified').textContent = user.email_confirmed_at ? 'Verified' : 'Not verified';

      const { data: accessRows, error: accessError } = await supabaseClient
        .from('student_course_access')
        .select('course_id,access_status')
        .eq('user_id', user.id)
        .eq('access_status', 'active');
      if (accessError) throw accessError;

      coursesBox.replaceChildren();
      const activeCourses = (accessRows || []).filter(row => courseNames[row.course_id]);
      if (!activeCourses.length) {
        addText(coursesBox, 'p', 'profile-note', 'No active courses are linked to this account yet.');
      }

      for (const row of activeCourses) {
        const course = courseNames[row.course_id];
        const card = document.createElement('article');
        card.className = 'profile-course';

        const top = document.createElement('div');
        top.className = 'profile-course-top';
        addText(top, 'h3', '', course.title);
        addText(top, 'span', 'profile-status', 'Active access');
        card.appendChild(top);

        let chapterCount = 0;
        let lessonCount = 0;
        try {
          const { data: syllabus, error: syllabusError } = await supabaseClient
            .from('student_course_syllabus')
            .select('chapter_id,lesson_id')
            .eq('course_id', row.course_id);
          if (syllabusError) throw syllabusError;
          const chapters = new Set((syllabus || []).map(item => item.chapter_id));
          const lessons = new Set((syllabus || []).map(item => item.lesson_id));
          chapterCount = chapters.size;
          lessonCount = lessons.size;
        } catch (syllabusError) {
          console.warn('Course outline count unavailable:', syllabusError);
        }

        const stats = document.createElement('div');
        stats.className = 'profile-stats';
        const chapterStat = document.createElement('div');
        chapterStat.className = 'profile-stat';
        addText(chapterStat, 'strong', '', String(chapterCount));
        addText(chapterStat, 'span', '', 'Chapters');
        const lessonStat = document.createElement('div');
        lessonStat.className = 'profile-stat';
        addText(lessonStat, 'strong', '', String(lessonCount));
        addText(lessonStat, 'span', '', 'Lessons');
        stats.append(chapterStat, lessonStat);
        card.appendChild(stats);

        const progress = document.createElement('div');
        progress.className = 'profile-progress-panel';
        addText(progress, 'div', 'profile-progress-title', 'Learning progress');
        addText(progress, 'p', '', 'Lesson completion tracking will appear here once progress tracking is connected.');
        card.appendChild(progress);

        const actions = document.createElement('div');
        actions.className = 'profile-course-actions';
        const link = document.createElement('a');
        link.className = 'btn o';
        link.href = 'student-course.html?class=' + course.level;
        link.textContent = 'Continue Learning';
        actions.appendChild(link);
        card.appendChild(actions);

        coursesBox.appendChild(card);
      }
    } catch (error) {
      console.error('Profile load failed:', error);
      nameEl.textContent = 'Profile could not be loaded';
      emailEl.textContent = '';
      coursesBox.replaceChildren();
      addText(coursesBox, 'p', 'profile-note', 'Your account information could not be loaded. Please refresh the page.');
    }
  }

  logout.addEventListener('click', async () => {
    logout.disabled = true;
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      location.assign('index.html');
    } catch (error) {
      console.error('Logout failed:', error);
      logout.disabled = false;
      logout.textContent = 'Logout failed — try again';
    }
  });

  loadProfile();
})();