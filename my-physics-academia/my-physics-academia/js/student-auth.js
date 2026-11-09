(() => {
  const loginForm = document.getElementById("student-login-form");
  const signupForm = document.getElementById("student-signup-form");
  const statusBox = document.getElementById("student-auth-status");
  const loginTab = document.getElementById("student-show-login");
  const signupTab = document.getElementById("student-show-signup");
  const tabs = document.getElementById("student-auth-tabs");
  const sessionPanel = document.getElementById("student-session-panel");
  const logoutButton = document.getElementById("student-logout-button");
  if (!loginForm || !signupForm || typeof supabaseClient === "undefined") return;

  function setStatus(message, isError = false) {
    statusBox.textContent = message;
    statusBox.classList.toggle("error", isError);
  }

  function setMode(mode) {
    const isLogin = mode === "login";
    loginForm.hidden = !isLogin;
    signupForm.hidden = isLogin;
    loginTab.classList.toggle("o", !isLogin);
    signupTab.classList.toggle("o", isLogin);
    loginTab.setAttribute("aria-pressed", String(isLogin));
    signupTab.setAttribute("aria-pressed", String(!isLogin));
    setStatus(isLogin ? "Enter your student account details." : "Create your student account using your email address.");
  }

  function showSignedIn() {
    tabs.hidden = true;
    loginForm.hidden = true;
    signupForm.hidden = true;
    sessionPanel.hidden = false;
    setStatus("You are already signed in. You can continue to your courses or log out.");
  }

  function showSignedOut() {
    tabs.hidden = false;
    sessionPanel.hidden = true;
    setMode("login");
  }

  function getSafeReturnUrl() {
    const requested = new URLSearchParams(location.search).get("return");
    if (!requested) return "courses.html";
    try {
      const url = new URL(requested, location.origin);
      if (url.origin !== location.origin || url.pathname.endsWith("/student-login.html")) return "courses.html";
      return url.href;
    } catch (_) {
      return "courses.html";
    }
  }

  loginTab.addEventListener("click", () => setMode("login"));
  signupTab.addEventListener("click", () => setMode("signup"));

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.getElementById("student-login-submit");
    button.disabled = true;
    setStatus("Signing in...");
    try {
      const email = document.getElementById("student-login-email").value.trim();
      const password = document.getElementById("student-login-password").value;
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setStatus("Login successful. Redirecting...");
      location.assign(getSafeReturnUrl());
    } catch (error) {
      setStatus(error.message || "Login failed. Please check your details.", true);
    } finally {
      button.disabled = false;
    }
  });

  signupForm.addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.getElementById("student-signup-submit");
    const fullName = document.getElementById("student-signup-name").value.trim();
    const email = document.getElementById("student-signup-email").value.trim();
    const password = document.getElementById("student-signup-password").value;
    const confirm = document.getElementById("student-signup-confirm").value;
    if (password !== confirm) {
      setStatus("The passwords do not match.", true);
      return;
    }
    button.disabled = true;
    setStatus("Creating your student account...");
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, account_type: "student" },
          emailRedirectTo: location.origin + "/student-login.html"
        }
      });
      if (error) throw error;
      if (data.session) {
        setStatus("Student account created. Redirecting...");
        location.assign(getSafeReturnUrl());
      } else {
        setMode("login");
        setStatus("Account created. Please confirm your email using the link we sent, then log in here.");
      }
    } catch (error) {
      setStatus(error.message || "Could not create the student account.", true);
    } finally {
      button.disabled = false;
    }
  });

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    setStatus("Logging out...");
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      showSignedOut();
      setStatus("You have been logged out. You can now log in or create another account.");
    } catch (error) {
      setStatus(error.message || "Logout failed. Please try again.", true);
    } finally {
      logoutButton.disabled = false;
    }
  });

  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) {
      setStatus(error.message || "Could not check your login status.", true);
      return;
    }
    if (data.session) showSignedIn();
    else showSignedOut();
  });
})();