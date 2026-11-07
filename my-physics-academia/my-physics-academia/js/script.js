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
const loginForm = document.getElementById('admin-login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const error = document.getElementById('login-error');
        const button = document.getElementById('login-btn');

        error.textContent = '';
        button.disabled = true;
        button.textContent = 'Logging in...';

        const { data, error: loginError } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        button.disabled = false;
        button.textContent = 'Login';

        if (loginError) {
    console.error("Supabase Login Error:", loginError);

    error.textContent = loginError.message;
    return;
}
        if (data.user) {
            document.getElementById('login').style.display = 'none';
            document.getElementById('dash').classList.add('show');
        }
    });
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
