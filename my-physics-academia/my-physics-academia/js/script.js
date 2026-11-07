/* Demo-only interactions. No backend; NO tracking is active. */
/* ---- dataLayer structure: connect to Google Tag Manager later ---- */
window.dataLayer = window.dataLayer || [];
function track(name, el){
  window.dataLayer.push({event:name, element_id:el.id||null, label:el.dataset.label||el.textContent.trim().slice(0,40), page:location.pathname});
}
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2600)}
function modal(m){$('#modal p').textContent=m;$('#modal').classList.add('show')}
$('#burger').onclick=()=>$('.links').classList.toggle('open');
$('#modal').onclick=e=>{if(e.target.id==='modal'||e.target.dataset.close!==undefined)$('#modal').classList.remove('show')};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-track],[data-demo],[data-modal]');if(!el)return;
  if(el.dataset.track)track(el.dataset.track,el);
  if(el.dataset.modal){e.preventDefault();modal(el.dataset.modal)}
  else if(el.dataset.demo){e.preventDefault();toast(el.dataset.demo)}
});
$$('.rv').forEach(el=>new IntersectionObserver((en,ob)=>en.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');ob.unobserve(x.target)}})).observe(el));
const COURSES={
 11:{t:'Class 11 Physics',p:'₹2,999',ch:['Units and Measurements','Motion in a Straight Line','Motion in a Plane','Laws of Motion','Work, Energy and Power','System of Particles and Rotational Motion','Gravitation','Mechanical Properties of Solids','Mechanical Properties of Fluids','Thermal Properties of Matter','Thermodynamics','Kinetic Theory','Oscillations','Waves']},
 12:{t:'Class 12 Physics',p:'₹3,499',ch:['Electric Charges and Fields','Electrostatic Potential and Capacitance','Current Electricity','Moving Charges and Magnetism','Magnetism and Matter','Electromagnetic Induction','Alternating Current','Electromagnetic Waves','Ray Optics','Wave Optics','Dual Nature of Radiation and Matter','Atoms','Nuclei','Semiconductor Electronics']}};
if($('#course-detail')){const n=new URLSearchParams(location.search).get('class')==='11'?11:12,c=COURSES[n];
 document.title=c.t+' Course | My Physics Academia';$('#cd-title').textContent=c.t;$('#cd-price').textContent=c.p;
 $('#cd-count').textContent=c.ch.length+' chapters · Demo content';
 $('#cd-syl').innerHTML=c.ch.map((x,i)=>`<details><summary>Chapter ${i+1}: ${x}</summary><ul><li>Lesson ${i+1}.1 – Core concepts</li><li>Lesson ${i+1}.2 – Derivations and laws</li><li>Lesson ${i+1}.3 – Solved numericals</li><li>Lesson ${i+1}.4 – Chapter recap quiz</li></ul></details>`).join('');
 $('#cd-learn').innerHTML=c.ch.slice(0,6).map(x=>`<li>${x}, explained concept-first</li>`).join('')}
let cur=0;function sel(i){const all=$$('.rel a');if(!all.length)return;cur=(i+all.length)%all.length;all.forEach(x=>x.classList.remove('on'));const a=all[cur];a.classList.add('on');$('#l-title').textContent=a.dataset.t;$('#l-desc').textContent=a.dataset.d;$('#l-ch').textContent=a.dataset.c}
$$('.rel a').forEach((a,i)=>a.onclick=e=>{e.preventDefault();sel(i)});
$('#prev')&&($('#prev').onclick=()=>sel(cur-1));$('#next')&&($('#next').onclick=()=>sel(cur+1));
// Supabase admin-page session handling
const loginForm = document.getElementById('admin-login-form');
const loginSection = document.getElementById('login');
const dashboard = document.getElementById('dash');
const loginError = document.getElementById('login-error');
const loginButton = document.getElementById('login-btn');
const logoutButton = document.getElementById('admin-logout-btn');

function clearAdminLoginFields() {
    const emailField = document.getElementById('admin-email');
    const passwordField = document.getElementById('admin-password');
    if (emailField) emailField.value = '';
    if (passwordField) passwordField.value = '';
    if (loginForm) loginForm.reset();
}

function showAdminDashboard(isSignedIn) {
    if (!loginSection || !dashboard) return;
    loginSection.style.display = isSignedIn ? 'none' : '';
    dashboard.classList.toggle('show', isSignedIn);
    if (isSignedIn) loadAdminDashboardData();
}

async function loadAdminDashboardData() {
    if (typeof supabaseClient === 'undefined') return;

    const coursesBody = document.getElementById('admin-courses-list');
    const lessonsBody = document.getElementById('admin-lessons-list');
    const coursesCount = document.getElementById('total-courses');
    const lessonsCount = document.getElementById('total-lessons');

    try {
        const { data: authData, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !authData.user) throw new Error('Please sign in again.');

        // Confirm this signed-in account is present in the admin allowlist.
        const { data: adminRecord, error: adminError } = await supabaseClient
            .from('admin_users')
            .select('user_id')
            .eq('user_id', authData.user.id)
            .maybeSingle();

        if (adminError) throw new Error('Could not verify admin permission. Check Supabase policies.');
        if (!adminRecord) throw new Error('This account is not registered as an admin.');

        const [
            { data: courses, error: coursesError, count: courseCount },
            { data: lessons, error: lessonsError, count: lessonCount }
        ] = await Promise.all([
            supabaseClient.from('courses').select('id,title,class_level,is_published', { count: 'exact' }).order('created_at', { ascending: false }),
            supabaseClient.from('lessons').select('id,title,course_id,is_published,sort_order', { count: 'exact' }).order('sort_order', { ascending: true })
        ]);

        if (coursesError) throw coursesError;
        if (lessonsError) throw lessonsError;

        if (coursesCount) coursesCount.textContent = courseCount ?? courses.length;
        if (lessonsCount) lessonsCount.textContent = lessonCount ?? lessons.length;

        const courseNames = new Map((courses || []).map(course => [course.id, course.title]));
        if (coursesBody) {
            coursesBody.innerHTML = courses && courses.length
                ? courses.map(course => `<tr><td>${escapeAdminText(course.title)}</td><td>Class ${course.class_level}</td><td>${course.is_published ? 'Published' : 'Draft'}</td></tr>`).join('')
                : '<tr><td colspan="3">No courses yet. Add your first course next.</td></tr>';
        }

        if (lessonsBody) {
            lessonsBody.innerHTML = lessons && lessons.length
                ? lessons.map(lesson => `<tr><td>${escapeAdminText(lesson.title)}</td><td>${escapeAdminText(courseNames.get(lesson.course_id) || 'Course unavailable')}</td><td>${lesson.is_published ? 'Published' : 'Draft'}</td></tr>`).join('')
                : '<tr><td colspan="3">No lessons yet. Lessons will appear here after you add them.</td></tr>';
        }
    } catch (error) {
        console.error('Admin dashboard data load failed:', error);
        if (coursesBody) coursesBody.innerHTML = '<tr><td colspan="3">Could not load courses. Please refresh.</td></tr>';
        if (lessonsBody) lessonsBody.innerHTML = '<tr><td colspan="3">Could not load lessons. Please refresh.</td></tr>';
        toast(error.message || 'Could not load admin data.');
    }
}

function escapeAdminText(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}

if (loginForm && typeof supabaseClient !== 'undefined') {
    // Check the saved Supabase session whenever this page opens or refreshes.
    (async () => {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
            console.error('Could not restore Supabase session:', error);
            showAdminDashboard(false);
            if (loginError) loginError.textContent = 'Could not check login session. Please try again.';
            return;
        }
        showAdminDashboard(Boolean(data.session));
        if (!data.session) {
            clearAdminLoginFields();
            // Some browsers apply saved autofill shortly after page load.
            window.setTimeout(clearAdminLoginFields, 300);
        }
    })();

    // Keep the page in sync when the user signs in or signs out.
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        showAdminDashboard(Boolean(session));
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value;

        loginError.textContent = '';
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) {
                // Use the same message for every authentication failure.
                // Do not reveal whether the email or password was incorrect.
                console.error('Supabase authentication failed.');
                loginError.textContent = 'Invalid email or password. Please try again.';
                // Keep both fields unchanged so the user can review and edit them.
                return;
            }
            showAdminDashboard(Boolean(data.session));
        } catch (err) {
            console.error('Unexpected login error:', err);
            loginError.textContent = 'Unable to log in. Please check your connection and try again.';
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            logoutButton.disabled = true;
            logoutButton.textContent = 'Logging out...';
            try {
                const { error } = await supabaseClient.auth.signOut();
                if (error) {
                    console.error('Supabase Logout Error:', error);
                    toast('Logout failed. Please try again.');
                    return;
                }
                showAdminDashboard(false);
                clearAdminLoginFields();
                if (loginError) loginError.textContent = '';
            } catch (err) {
                console.error('Unexpected logout error:', err);
                toast('Unable to log out. Please try again.');
            } finally {
                logoutButton.disabled = false;
                logoutButton.textContent = 'Logout';
            }
        });
    }
} else if (loginForm) {
    showAdminDashboard(false);
    if (loginError) loginError.textContent = 'Authentication service is not available. Please refresh the page.';
}
$$('.tabs button').forEach(b=>b.onclick=()=>{$$('.tabs button').forEach(x=>x.classList.remove('on'));$$('.pane').forEach(x=>x.classList.remove('on'));b.classList.add('on');$('#'+b.dataset.pane).classList.add('on')});
$$('.drop').forEach(dz=>{['dragover','dragenter'].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.add('hot')}));['dragleave','drop'].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.remove('hot');if(v==='drop')toast('Demo only: file not uploaded')}))});
$$('form').forEach(f => {
    if (f.id !== 'admin-login-form') {
        f.onsubmit = e => {
            e.preventDefault();
            toast('Demo only: nothing was submitted');
        };
    }
});
