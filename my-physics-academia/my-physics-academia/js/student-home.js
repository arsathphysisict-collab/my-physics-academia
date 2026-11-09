(() => {
  const COURSE_NAMES = {
    '0ec687ef-1617-43c1-8777-c56f6ce835e1': { title: 'Class 11 Physics', level: '11' },
    'a0678519-b9ae-4845-a979-515107a34cb9': { title: 'Class 12 Physics', level: '12' }
  };
  const box = document.getElementById('learning-courses');
  const status = document.getElementById('learning-status');
  async function init() {
    try {
      const { data: auth, error: authError } = await supabaseClient.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) {
        location.replace('student-login.html?return=' + encodeURIComponent('student-home.html'));
        return;
      }
      const name = auth.user.user_metadata?.full_name || auth.user.user_metadata?.name || 'Student';
      document.getElementById('learning-greeting').textContent = 'Welcome back, ' + name + '!';
      const { data, error } = await supabaseClient.from('student_course_access')
        .select('course_id').eq('user_id', auth.user.id).eq('access_status', 'active');
      if (error) throw error;
      const courses = (data || []).filter(row => COURSE_NAMES[row.course_id]);
      if (!courses.length) {
        location.replace('index.html');
        return;
      }
      box.replaceChildren();
      courses.forEach(row => {
        const course = COURSE_NAMES[row.course_id];
        const card = document.createElement('article');
        card.className = 'learning-card';
        const title = document.createElement('h3');
        title.textContent = course.title;
        const detail = document.createElement('p');
        detail.textContent = 'Your course access is active.';
        const link = document.createElement('a');
        link.className = 'btn';
        link.href = 'student-course.html?class=' + course.level;
        link.textContent = 'Open My Course';
        card.append(title, detail, link);
        box.appendChild(card);
      });
    } catch (error) {
      console.error('Student home load failed:', error);
      status.textContent = error.message || 'Could not load your courses. Please refresh.';
    }
  }
  init();
})();