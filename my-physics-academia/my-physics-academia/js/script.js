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
 const previewCourseButton=$('#preview-course');
 if(previewCourseButton) previewCourseButton.href='lessons.html?class='+n;
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
const addCoursePanel = document.getElementById('add-course-panel');
const addCourseButton = document.getElementById('add-course');
const addCourseForm = document.getElementById('add-course-form');
const cancelCourseButton = document.getElementById('cancel-course-btn');
const saveCourseButton = document.getElementById('save-course-btn');


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

        const { data: adminRecord, error: adminError } = await supabaseClient
            .from('admin_users').select('user_id').eq('user_id', authData.user.id).maybeSingle();
        if (adminError) throw new Error('Could not verify admin permission. Check Supabase policies.');
        if (!adminRecord) throw new Error('This account is not registered as an admin.');

        const [
            { data: concepts, error: conceptsError, count: conceptCount },
            { data: chapters, error: chaptersError }
        ] = await Promise.all([
            supabaseClient.from('concepts').select('id,title,chapter_id,category,is_published,mux_status,sort_order,is_preview,preview_order,thumbnail_url', { count: 'exact' }).order('created_at', { ascending: false }),
            supabaseClient.from('chapters').select('id,title,class_level,sort_order').order('class_level', { ascending: true }).order('sort_order', { ascending: true }).range(0, 999)
        ]);

        if (conceptsError) throw conceptsError;
        if (chaptersError) throw chaptersError;

        // The two official class courses come from the public syllabus, not legacy test rows.
        if (coursesCount) coursesCount.textContent = Object.keys(COURSES).length;
        if (lessonsCount) lessonsCount.textContent = conceptCount ?? concepts.length;

        if (coursesBody) {
            coursesBody.innerHTML = Object.entries(COURSES).map(([classLevel, course]) =>
                '<tr><td>' + escapeAdminText(course.t) + '</td><td>Class ' + escapeAdminText(classLevel) + '</td><td>Active</td></tr>'
            ).join('');
        }

        const chapterMap = new Map((chapters || []).map(ch => [ch.id, ch]));
        if (lessonsBody) {
            lessonsBody.innerHTML = concepts && concepts.length
                ? concepts.map(concept => {
                    const chapter = chapterMap.get(concept.chapter_id);
                    const chapterLabel = chapter
                        ? 'Class ' + chapter.class_level + ' / Chapter ' + chapter.sort_order + ': ' + ((COURSES[Number(chapter.class_level)] && COURSES[Number(chapter.class_level)].ch[Number(chapter.sort_order) - 1]) || chapter.title)
                        : 'Chapter unavailable';
                    const previewValue = concept.is_preview ? String(concept.preview_order || '') : '';
                    const previewOptions = [['', 'Not a Preview'], ['1', 'Preview Slot 1'], ['2', 'Preview Slot 2'], ['3', 'Preview Slot 3']]
                        .map(([value, label]) => '<option value="' + value + '" ' + (previewValue === value ? 'selected' : '') + '>' + label + '</option>').join('');
                    return '<tr><td>' + escapeAdminText(concept.title) + '</td><td>' + escapeAdminText(chapterLabel) + '</td><td>' + escapeAdminText(concept.category) + '</td><td>' + escapeAdminText(concept.mux_status || 'Not uploaded') + '</td><td>' + (concept.is_published ? 'Published' : 'Draft') + '</td><td>' + (concept.thumbnail_url ? '<img src="' + escapeAdminText(concept.thumbnail_url) + '" alt="Current video thumbnail" style="width:76px;height:44px;object-fit:cover;border-radius:6px;display:block;margin-bottom:6px">' : '<span style="display:block;font-size:12px;margin-bottom:6px">No thumbnail set</span>') + '<input type="file" accept="image/png,image/jpeg,image/webp" data-thumbnail-upload="' + escapeAdminText(concept.id) + '" aria-label="Upload video thumbnail" style="max-width:180px;font-size:12px"><div style="margin-top:8px"><label style="display:block;font-size:11px;margin-bottom:3px">Preview placement</label><select data-preview-setting="' + escapeAdminText(concept.id) + '" aria-label="Preview status and slot" style="max-width:150px;font-size:12px">' + previewOptions + '</select></div></td><td><button type="button" class="btn ' + (concept.is_published ? 'o' : '') + '" data-publish-concept="' + escapeAdminText(concept.id) + '" data-published="' + (concept.is_published ? 'true' : 'false') + '" ' + (concept.mux_status === 'ready' ? '' : 'disabled title="Video must be ready before publishing"') + '>' + (concept.is_published ? 'Unpublish' : 'Publish') + '</button></td></tr>';
                  }).join('')
                : '<tr><td colspan="6">No concepts uploaded yet. Add a concept using Upload Interface.</td></tr>';
        }
    } catch (error) {
        console.error('Admin dashboard data load failed:', error);
        if (coursesBody) coursesBody.innerHTML = '<tr><td colspan="3">Could not load courses. Please refresh.</td></tr>';
        if (lessonsBody) lessonsBody.innerHTML = '<tr><td colspan="6">Could not load concepts. Please refresh.</td></tr>';
        toast(error.message || 'Could not load admin data.');
    }
}


        const manageLessonsBody = document.getElementById('admin-lessons-list');
        if (manageLessonsBody && !manageLessonsBody.dataset.previewSettingHandlerAttached) {
            manageLessonsBody.dataset.previewSettingHandlerAttached = 'true';
            manageLessonsBody.addEventListener('change', async (event) => {
                const select = event.target.closest('[data-preview-setting]');
                if (!select) return;
                const conceptId = select.dataset.previewSetting;
                const selectedSlot = select.value;
                select.disabled = true;
                try {
                    const { data: authData, error: authError } = await supabaseClient.auth.getUser();
                    if (authError || !authData.user) throw new Error('Your login session has expired. Please log in again.');
                    const { data: adminRecord, error: adminError } = await supabaseClient
                        .from('admin_users').select('user_id').eq('user_id', authData.user.id).maybeSingle();
                    if (adminError || !adminRecord) throw new Error('Admin permission could not be verified.');
                    const update = selectedSlot
                        ? { is_preview: true, preview_order: Number(selectedSlot) }
                        : { is_preview: false, preview_order: null };
                    const { error: updateError } = await supabaseClient
                        .from('concepts').update(update).eq('id', conceptId);
                    if (updateError) {
                        if (updateError.code === '23505') throw new Error('That Preview Slot is already in use. Choose another free slot.');
                        throw updateError;
                    }
                    toast(selectedSlot ? 'Preview slot assigned.' : 'Preview status removed.');
                    await loadAdminDashboardData();
                } catch (error) {
                    console.error('Preview setting update failed:', error);
                    toast(error.message || 'Could not update preview setting.');
                    select.disabled = false;
                    await loadAdminDashboardData();
                }
            });
        }

        if (manageLessonsBody && !manageLessonsBody.dataset.thumbnailHandlerAttached) {
            manageLessonsBody.dataset.thumbnailHandlerAttached = 'true';
            manageLessonsBody.addEventListener('change', async (event) => {
                const input = event.target.closest('[data-thumbnail-upload]');
                if (!input || !input.files || !input.files[0]) return;
                const file = input.files[0];
                const conceptId = input.dataset.thumbnailUpload;
                if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                    toast('Choose a PNG, JPG or WebP image.');
                    input.value = '';
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    toast('Thumbnail must be 5 MB or smaller.');
                    input.value = '';
                    return;
                }
                input.disabled = true;
                try {
                    const { data: authData, error: authError } = await supabaseClient.auth.getUser();
                    if (authError || !authData.user) throw new Error('Your login session has expired. Please log in again.');
                    const { data: adminRecord, error: adminError } = await supabaseClient
                        .from('admin_users').select('user_id').eq('user_id', authData.user.id).maybeSingle();
                    if (adminError || !adminRecord) throw new Error('Admin permission could not be verified.');

                    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
                    const storagePath = conceptId + '/' + crypto.randomUUID() + '.' + extension;
                    const { error: uploadError } = await supabaseClient.storage
                        .from('preview-thumbnails')
                        .upload(storagePath, file, { contentType: file.type, upsert: false });
                    if (uploadError) throw uploadError;

                    const { data: publicData } = supabaseClient.storage
                        .from('preview-thumbnails')
                        .getPublicUrl(storagePath);
                    const thumbnailUrl = publicData && publicData.publicUrl;
                    if (!thumbnailUrl) throw new Error('Could not create the thumbnail URL.');

                    const { error: updateError } = await supabaseClient
                        .from('concepts').update({ thumbnail_url: thumbnailUrl }).eq('id', conceptId);
                    if (updateError) throw updateError;
                    toast('Video thumbnail saved successfully.');
                    await loadAdminDashboardData();
                } catch (error) {
                    console.error('Video thumbnail upload failed:', error);
                    toast(error.message || 'Could not upload the video thumbnail.');
                    input.disabled = false;
                    input.value = '';
                }
            });
        }

        if (manageLessonsBody && !manageLessonsBody.dataset.publishHandlerAttached) {
            manageLessonsBody.dataset.publishHandlerAttached = 'true';
            manageLessonsBody.addEventListener('click', async (event) => {
                const publishButton = event.target.closest('[data-publish-concept]');
                if (!publishButton || publishButton.disabled) return;
                const conceptId = publishButton.dataset.publishConcept;
                const currentlyPublished = publishButton.dataset.published === 'true';
                const nextPublished = !currentlyPublished;
                publishButton.disabled = true;
                publishButton.textContent = nextPublished ? 'Publishing...' : 'Unpublishing...';
                try {
                    const { data: authData, error: authError } = await supabaseClient.auth.getUser();
                    if (authError || !authData.user) throw new Error('Your login session has expired. Please log in again.');
                    const { data: adminRecord, error: adminError } = await supabaseClient
                        .from('admin_users').select('user_id').eq('user_id', authData.user.id).maybeSingle();
                    if (adminError || !adminRecord) throw new Error('Admin permission could not be verified.');
                    const { error: updateError } = await supabaseClient
                        .from('concepts').update({ is_published: nextPublished }).eq('id', conceptId);
                    if (updateError) throw updateError;
                    toast(nextPublished ? 'Concept published.' : 'Concept moved back to draft.');
                    await loadAdminDashboardData();
                } catch (error) {
                    console.error('Concept publish status update failed:', error);
                    toast(error.message || 'Could not update publish status.');
                    await loadAdminDashboardData();
                }
            });
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

if (addCourseButton && addCoursePanel) {
    addCourseButton.addEventListener('click', () => {
        addCoursePanel.style.display = 'block';
        document.getElementById('new-course-title').focus();
        addCoursePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
if (cancelCourseButton && addCoursePanel && addCourseForm) {
    cancelCourseButton.addEventListener('click', () => {
        addCourseForm.reset();
        document.getElementById('add-course-error').textContent = '';
        addCoursePanel.style.display = 'none';
    });
}
if (addCourseForm) {
    addCourseForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const errorBox = document.getElementById('add-course-error');
        const title = document.getElementById('new-course-title').value.trim();
        const classLevel = Number(document.getElementById('new-course-class').value);
        const description = document.getElementById('new-course-description').value.trim();
        const isPublished = document.getElementById('new-course-published').checked;
        errorBox.textContent = '';

        if (!title || ![11, 12].includes(classLevel)) {
            errorBox.textContent = 'Please enter a course title and select Class 11 or Class 12.';
            return;
        }
        saveCourseButton.disabled = true;
        saveCourseButton.textContent = 'Saving...';
        try {
            const { data: authData, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !authData.user) throw new Error('Your login session has expired. Please log in again.');

            const { data: adminRecord, error: adminError } = await supabaseClient
                .from('admin_users').select('user_id').eq('user_id', authData.user.id).maybeSingle();
            if (adminError || !adminRecord) throw new Error('Admin permission could not be verified.');

            const { error } = await supabaseClient.from('courses').insert([{
                title,
                class_level: classLevel,
                description: description || null,
                is_published: isPublished
            }]);
            if (error) throw error;

            addCourseForm.reset();
            addCoursePanel.style.display = 'none';
            toast('Course saved successfully!');
            await loadAdminDashboardData();
        } catch (error) {
            console.error('Course save failed:', error);
            errorBox.textContent = error.message || 'Could not save the course. Please try again.';
        } finally {
            saveCourseButton.disabled = false;
            saveCourseButton.textContent = 'Save Course';
        }
    });
}


const addLessonButton = document.getElementById('add-lesson');
if (addLessonButton) addLessonButton.style.display = 'none';
if (addCourseButton) addCourseButton.style.display = 'none';
const addLessonPanel = document.getElementById('add-lesson-panel');
const addLessonForm = document.getElementById('add-lesson-form');
const cancelLessonButton = document.getElementById('cancel-lesson-btn');
const saveLessonButton = document.getElementById('save-lesson-btn');

if (addLessonButton && addLessonPanel) {
    addLessonButton.addEventListener('click', async () => {
        addLessonPanel.style.display = 'block';
        await loadAdminDashboardData();
        document.getElementById('new-lesson-course').focus();
        addLessonPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
if (cancelLessonButton && addLessonPanel && addLessonForm) {
    cancelLessonButton.addEventListener('click', () => {
        addLessonForm.reset();
        document.getElementById('add-lesson-error').textContent = '';
        addLessonPanel.style.display = 'none';
    });
}
if (addLessonForm) {
    addLessonForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const errorBox = document.getElementById('add-lesson-error');
        const courseId = document.getElementById('new-lesson-course').value;
        const title = document.getElementById('new-lesson-title').value.trim();
        const description = document.getElementById('new-lesson-description').value.trim();
        const isPublished = document.getElementById('new-lesson-published').checked;
        errorBox.textContent = '';

        if (!courseId || !title) {
            errorBox.textContent = 'Please select a course and enter a lesson title.';
            return;
        }
        saveLessonButton.disabled = true;
        saveLessonButton.textContent = 'Saving...';
        try {
            const { data: authData, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !authData.user) throw new Error('Your login session has expired. Please log in again.');

            const { data: adminRecord, error: adminError } = await supabaseClient
                .from('admin_users').select('user_id').eq('user_id', authData.user.id).maybeSingle();
            if (adminError || !adminRecord) throw new Error('Admin permission could not be verified.');

            const { data: existingLessons, error: listError } = await supabaseClient
                .from('lessons').select('sort_order').eq('course_id', courseId).order('sort_order', { ascending: false }).limit(1);
            if (listError) throw listError;
            const nextOrder = existingLessons && existingLessons.length ? (existingLessons[0].sort_order || 0) + 1 : 1;

            const { error } = await supabaseClient.from('lessons').insert([{
                course_id: courseId,
                title,
                description: description || null,
                is_published: isPublished,
                sort_order: nextOrder
            }]);
            if (error) throw error;

            addLessonForm.reset();
            addLessonPanel.style.display = 'none';
            toast('Lesson saved successfully!');
            await loadAdminDashboardData();
        } catch (error) {
            console.error('Lesson save failed:', error);
            errorBox.textContent = error.message || 'Could not save the lesson. Please try again.';
        } finally {
            saveLessonButton.disabled = false;
            saveLessonButton.textContent = 'Save Lesson';
        }
    });
}


// Concept-based Mux upload flow: Class -> Chapter -> Category -> Concept -> Video.
const uploadClassSelect = document.getElementById('upload-class-select');
const uploadChapterSelect = document.getElementById('upload-chapter-select');
const uploadLessonSelect = document.getElementById('upload-lesson-select');

async function loadUploadChapters(classLevel) {
    if (!uploadChapterSelect) return;
    uploadChapterSelect.disabled = true;
    uploadChapterSelect.innerHTML = '<option value="">Loading chapters...</option>';
    if (!classLevel) {
        uploadChapterSelect.innerHTML = '<option value="">Select a class first</option>';
        return;
    }

    // Display the exact 14 syllabus chapter names used on the public course page.
    const courseInfo = COURSES[Number(classLevel)];
    if (!courseInfo || !Array.isArray(courseInfo.ch)) {
        uploadChapterSelect.innerHTML = '<option value="">Chapter list unavailable</option>';
        throw new Error('The syllabus chapter list is unavailable.');
    }

    // Match each displayed syllabus chapter to its existing database row by class + order.
    const { data, error } = await supabaseClient
        .from('chapters')
        .select('id,class_level,sort_order,title')
        .eq('class_level', Number(classLevel))
        .order('sort_order', { ascending: true })
        .range(0, 99);

    if (error) {
        console.error('Chapter ID lookup failed:', error);
        uploadChapterSelect.innerHTML = '<option value="">Could not load chapter records</option>';
        throw new Error('Could not load chapter records. Please refresh and try again.');
    }

    const rowsByOrder = new Map((data || []).map(row => [Number(row.sort_order), row]));
    uploadChapterSelect.innerHTML = '<option value="">Select a chapter</option>' +
        courseInfo.ch.map((chapterTitle, index) => {
            const row = rowsByOrder.get(index + 1);
            if (!row) {
                return '<option value="" disabled>Chapter ' + (index + 1) + ': ' + escapeAdminText(chapterTitle) + ' (database record missing)</option>';
            }
            return '<option value="' + escapeAdminText(row.id) + '">Chapter ' + (index + 1) + ': ' + escapeAdminText(chapterTitle) + '</option>';
        }).join('');

    uploadChapterSelect.disabled = !data || data.length === 0;
    if (!data || data.length !== 14) {
        console.warn('Class ' + classLevel + ' should have 14 chapter records; found ' + ((data || []).length) + '. The displayed names are from the public course syllabus.');
    }
}

async function loadUploadLessons(chapterId) {
    if (!uploadLessonSelect) return;
    uploadLessonSelect.disabled = true;
    uploadLessonSelect.innerHTML = '<option value="">Loading lessons...</option>';

    if (!chapterId) {
        uploadLessonSelect.innerHTML = '<option value="">Select a chapter first</option>';
        return;
    }

    const { data, error } = await supabaseClient
        .from('lessons')
        .select('id,title,sort_order')
        .eq('chapter_id', chapterId)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Lesson lookup failed:', error);
        uploadLessonSelect.innerHTML = '<option value="">Could not load lessons</option>';
        throw new Error('Could not load lessons for this chapter. Please refresh and try again.');
    }

    uploadLessonSelect.innerHTML = '<option value="">Select a lesson</option>' +
        (data || []).map(lesson =>
            '<option value="' + escapeAdminText(lesson.id) + '">' +
            escapeAdminText(lesson.title) + '</option>'
        ).join('');

    uploadLessonSelect.disabled = !data || data.length === 0;
    if (!data || data.length === 0) {
        uploadLessonSelect.innerHTML = '<option value="">No lessons found for this chapter</option>';
    }
}

if (uploadClassSelect) {
    uploadClassSelect.addEventListener('change', async () => {
        uploadLessonSelect.innerHTML = '<option value="">Select a chapter first</option>';
        uploadLessonSelect.disabled = true;
        try { await loadUploadChapters(uploadClassSelect.value); }
        catch (error) { document.getElementById('upload-video-error').textContent = error.message; }
    });
}

if (uploadChapterSelect) {
    uploadChapterSelect.addEventListener('change', async () => {
        document.getElementById('upload-video-error').textContent = '';
        try { await loadUploadLessons(uploadChapterSelect.value); }
        catch (error) { document.getElementById('upload-video-error').textContent = error.message; }
    });
}

const uploadVideoForm = document.getElementById('upload-video-form');
if (uploadVideoForm) uploadVideoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = document.getElementById('upload-video-error');
    const classLevel = Number(uploadClassSelect.value);
    const chapterId = uploadChapterSelect.value;
    const lessonId = uploadLessonSelect.value;
    const conceptTitle = document.getElementById('upload-concept-title').value.trim();
    const file = document.getElementById('lesson-video-file').files[0];
    const button = document.getElementById('start-video-upload');
    const progressWrap = document.getElementById('upload-progress-wrap');
    const progress = document.getElementById('upload-progress');
    const percent = document.getElementById('upload-percent');
    const status = document.getElementById('upload-status');
    errorBox.textContent = '';
    if (![11, 12].includes(classLevel) || !chapterId || !lessonId || !conceptTitle || !file) {
        errorBox.textContent = 'Please select class, chapter, lesson, enter concept name and choose a video.';
        return;
    }
    if (!file.type.startsWith('video/')) {
        errorBox.textContent = 'Please choose a valid video file.';
        return;
    }
    button.disabled = true;
    button.textContent = 'Preparing...';
    progressWrap.style.display = 'block';
    progress.value = 0;
    percent.textContent = '0%';
    status.textContent = 'Checking admin session...';
    let conceptId = null;
    try {
        const { data: authData, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !authData.user) throw new Error('Your login session has expired. Please log in again.');
        const { data: adminRecord, error: adminError } = await supabaseClient.from('admin_users').select('user_id').eq('user_id', authData.user.id).maybeSingle();
        if (adminError || !adminRecord) throw new Error('Admin permission could not be verified.');

        status.textContent = 'Checking selected lesson...';
        const { data: lessonRecord, error: lessonError } = await supabaseClient
            .from('lessons')
            .select('id,title,chapter_id')
            .eq('id', lessonId)
            .eq('chapter_id', chapterId)
            .single();
        if (lessonError || !lessonRecord) throw new Error('The selected lesson does not belong to this chapter. Please select it again.');

        status.textContent = 'Creating concept record...';
        const { data: concept, error: conceptError } = await supabaseClient.from('concepts')
            .insert([{
                chapter_id: chapterId,
                lesson_id: lessonRecord.id,
                category: lessonRecord.title,
                title: conceptTitle,
                mux_status: 'not_uploaded',
                is_published: false
            }])
            .select('id').single();
        if (conceptError) throw new Error('Could not save concept: ' + conceptError.message);
        conceptId = concept.id;

        status.textContent = 'Creating secure upload link...';
        const { data: uploadData, error: functionError } = await supabaseClient.functions.invoke('create-mux-upload', { body: {} });
        if (functionError) throw new Error(functionError.message || 'Could not create Mux upload link.');
        if (!uploadData || !uploadData.uploadUrl || !uploadData.uploadId) throw new Error((uploadData && uploadData.error) || 'Mux did not return a valid upload link.');

        const { error: saveError } = await supabaseClient.from('concepts').update({ mux_upload_id: uploadData.uploadId, mux_status: 'uploading' }).eq('id', conceptId);
        if (saveError) throw new Error('Could not save upload details: ' + saveError.message);

        status.textContent = 'Uploading video to Mux...';
        button.textContent = 'Uploading...';
        await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadData.uploadUrl, true);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const value = Math.round((e.loaded / e.total) * 100);
                    progress.value = value;
                    percent.textContent = value + '%';
                }
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) resolve();
                else reject(new Error('Mux upload failed (HTTP ' + xhr.status + '). Please try again.'));
            };
            xhr.onerror = () => reject(new Error('Network error while uploading. Check your connection and try again.'));
            xhr.onabort = () => reject(new Error('Upload was cancelled.'));
            xhr.send(file);
        });

        const { error: finishError } = await supabaseClient.from('concepts').update({ mux_status: 'processing' }).eq('id', conceptId);
        if (finishError) throw new Error('Video uploaded, but processing status could not be saved. Refresh the dashboard.');
        progress.value = 100;
        percent.textContent = '100%';
        status.textContent = 'Upload complete. Mux is processing the video now.';
        toast('Video uploaded! Mux is processing it.');
        document.getElementById('lesson-video-file').value = '';
        document.getElementById('upload-concept-title').value = '';
    } catch (error) {
        console.error('Mux concept video upload failed:', error);
        errorBox.textContent = error.message || 'Video upload failed. Please try again.';
        status.textContent = conceptId ? 'Concept record saved. Upload did not complete; check its status before retrying.' : 'Upload not completed.';
        toast('Video upload failed.');
    } finally {
        button.disabled = false;
        button.textContent = 'Upload Video';
    }
});

$$('.tabs button').forEach(b=>b.addEventListener('click',()=>{$$('.tabs button').forEach(x=>x.classList.remove('on'));$$('.pane').forEach(x=>x.classList.remove('on'));b.classList.add('on');const pane=document.getElementById(b.dataset.pane);if(pane)pane.classList.add('on');}));
$$('.drop').forEach(dz=>{['dragover','dragenter'].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.add('hot')}));['dragleave','drop'].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.remove('hot');if(v==='drop')toast('Demo only: file not uploaded')}))});
$$('form').forEach(f => {
    if (!['admin-login-form', 'add-course-form', 'add-lesson-form', 'upload-video-form'].includes(f.id)) {
        f.onsubmit = e => {
            e.preventDefault();
            toast('Demo only: nothing was submitted');
        };
    }
});
