(() => {
  const COURSE_MAP = {
    '0ec687ef-1617-43c1-8777-c56f6ce835e1': { card: 'card-class11', level: '11' },
    'a0678519-b9ae-4845-a979-515107a34cb9': { card: 'card-class12', level: '12' }
  };

  async function initCourseAccessLabels() {
    try {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) return;

      const courseIds = Object.keys(COURSE_MAP);
      const { data: accessRows, error: accessError } = await supabaseClient
        .from('student_course_access')
        .select('course_id')
        .eq('user_id', authData.user.id)
        .eq('access_status', 'active')
        .in('course_id', courseIds);

      if (accessError) throw accessError;

      const activeCourseIds = new Set((accessRows || []).map(row => row.course_id));
      activeCourseIds.forEach(courseId => {
        const course = COURSE_MAP[courseId];
        if (!course) return;

        const card = document.getElementById(course.card);
        const row = card && card.querySelector('.row');
        const exploreButton = card && card.querySelector('.row a[id^="explore-"]');
        if (!row || !exploreButton) return;

        const status = document.createElement('span');
        status.className = 'course-access-status';
        status.textContent = 'Already Enrolled';
        status.setAttribute('role', 'status');

        const openButton = document.createElement('a');
        openButton.className = 'btn';
        openButton.href = 'student-course.html?class=' + course.level;
        openButton.textContent = 'Go to My Course';

        row.replaceChildren(exploreButton, status, openButton);
      });
    } catch (error) {
      // Keep the normal course options visible if access cannot be verified.
      console.error('Course purchase status could not be loaded:', error);
    }
  }

  initCourseAccessLabels();
})();