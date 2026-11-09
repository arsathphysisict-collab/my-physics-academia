(() => {
  const logout = document.getElementById('profile-logout');
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const avatarEl = document.getElementById('profile-avatar');

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
    } catch (error) {
      console.error('Profile load failed:', error);
      nameEl.textContent = 'Profile could not be loaded';
      emailEl.textContent = '';
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