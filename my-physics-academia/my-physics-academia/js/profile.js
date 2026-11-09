(() => {
  const status = document.getElementById('profile-status');
  const coursesBox = document.getElementById('profile-courses');
  const logout = document.getElementById('profile-logout');
  const COURSE_NAMES = {
    '0ec687ef-1617-43c1-8777-c56f6ce835e1': 'Class 11 Physics',
    'a0678519-b9ae-4845-a979-515107a34cb9': 'Class 12 Physics'
  };
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle('error', error);
  };
  async function loadProfile() {
    try {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        location.replace('student-login.html?return=' + encodeURIComponent('profile.html'));
        return;
      }
      const user = authData.user;
      const name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || 'Student';
      document.getElementById('profile-name').textContent = name;
      document.getElementById('profile-full-name').textContent = name;
      document.getElementById('profile-email').textContent = user.email || '';
      document.getElementById('profile-email-detail').textContent = user.email || '—';
      document.getElementById('profile-avatar').textContent = name.trim().charAt(0).toUpperCase() || 'S';

      const { data: accessRows, error: accessError } = await supabaseClient
        .from('student_course_access')
        .select('course_id,access_status,created_at')
        .eq('user_id', user.id)
        .eq('access_status', 'active');
      if (accessError) throw accessError;
      coursesBox.replaceChildren();
      const activeCourses = (accessRows || []).filter(row => COURSE_NAMES[row.course_id]);
      if (!activeCourses.length) {
        const note = document.createElement('p');
        note.className = 'sub';
        note.textContent = 'No active course access is linked to this account yet.';
        coursesBox.appendChild(note);
      } else {
        activeCourses.forEach(row => {
          const card = document.createElement('div');
          card.className = 'profile-course';
          const title = document.createElement('strong');
          title.textContent = COURSE_NAMES[row.course_id];
          const state = document.createElement('p');
          state.className = 'sub';
          state.textContent = 'Access status: Active';
          card.append(title, state);
          coursesBox.appendChild(card);
        });
      }
      setStatus('Your account details are up to date.');
    } catch (error) {
      console.error('Profile load failed:', error);
      setStatus(error.message || 'Could not load your profile. Please refresh.', true);
    }
  }
  logout.addEventListener('click', async () => {
    logout.disabled = true;
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      location.assign('index.html');
    } catch (error) {
      setStatus(error.message || 'Logout failed. Please try again.', true);
      logout.disabled = false;
    }
  });
  loadProfile();
})();