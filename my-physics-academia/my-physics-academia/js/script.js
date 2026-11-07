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

function showAdminDashboard(isSignedIn) {
    if (!loginSection || !dashboard) return;
    loginSection.style.display = isSignedIn ? 'none' : '';
    dashboard.classList.toggle('show', isSignedIn);
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
                console.error('Supabase Login Error:', error);
                loginError.textContent = error.message;
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
                loginForm.reset();
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
