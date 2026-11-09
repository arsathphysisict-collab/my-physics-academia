(() => {
  const COURSES = {
    '11': { id: '0ec687ef-1617-43c1-8777-c56f6ce835e1', title: 'Class 11 Physics' },
    '12': { id: 'a0678519-b9ae-4845-a979-515107a34cb9', title: 'Class 12 Physics' }
  };
  const params = new URLSearchParams(location.search);
  const level = params.get('class');
  const course = COURSES[level];
  const titleEl = document.getElementById('student-course-title');
  const countEl = document.getElementById('student-course-count');
  const syllabusEl = document.getElementById('student-course-syllabus');
  const playerSection = document.getElementById('student-video-section');
  const playerTitle = document.getElementById('student-video-title');
  const playerStatus = document.getElementById('student-video-status');
  const playerContainer = document.getElementById('student-video-player');
  let activePlayer = null;

  function showMessage(message) {
    const box = document.createElement('div');
    box.className = 'student-course-message';
    box.textContent = message;
    syllabusEl.replaceChildren(box);
  }

  function showPlayerStatus(message, isError = false) {
    playerStatus.textContent = message;
    playerStatus.classList.toggle('error', isError);
  }

  function stopCurrentPlayer() {
    if (activePlayer) {
      try { activePlayer.pause(); } catch (_) {}
      activePlayer.remove();
      activePlayer = null;
    }
    playerContainer.replaceChildren();
  }

  async function playConcept(concept, button) {
    if (!concept.concept_id && !concept.id) {
      showPlayerStatus('This concept is missing its video identifier. Please contact the administrator.', true);
      return;
    }

    document.querySelectorAll('.student-concept-button').forEach(item => {
      item.classList.remove('active');
      item.disabled = false;
    });
    button.classList.add('active');
    button.disabled = true;
    playerSection.hidden = false;
    playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    playerTitle.textContent = concept.concept_title || 'Course video';
    showPlayerStatus('Checking your course access and preparing the video...');
    stopCurrentPlayer();

    try {
      const { data, error } = await supabaseClient.functions.invoke('get-paid-playback', {
        body: { concept_id: concept.concept_id || concept.id }
      });

      if (error) {
        let detail = '';
        try {
          if (error.context && typeof error.context.json === 'function') {
            const responseBody = await error.context.json();
            detail = responseBody.error || responseBody.message || '';
          }
        } catch (_) {}
        if (error.context && error.context.status === 401) {
          throw new Error(detail || 'Your login session has expired. Please log in again.');
        }
        if (error.context && error.context.status === 403) {
          throw new Error(detail || 'You do not have active access to this course.');
        }
        throw new Error(detail || error.message || 'Could not prepare this video.');
      }

      if (!data || !data.playbackId || !data.token) {
        throw new Error((data && data.error) || 'Secure playback details were not returned.');
      }

      const clipStart = Number(data.startTime ?? 0);
      const clipEnd = data.endTime == null ? null : Number(data.endTime);
      if (!Number.isFinite(clipStart) || clipStart < 0 ||
          (clipEnd !== null && (!Number.isFinite(clipEnd) || clipEnd <= clipStart))) {
        throw new Error('The video clip range is invalid.');
      }

      await customElements.whenDefined('mux-player');
      const player = document.createElement('mux-player');
      player.setAttribute('stream-type', 'on-demand');
      player.setAttribute('playsinline', '');
      player.style.position = 'absolute';
      player.style.inset = '0';
      player.style.width = '100%';
      player.style.height = '100%';
      player.style.display = 'block';
      player.style.aspectRatio = 'auto';
      player.style.setProperty('--media-object-fit', 'contain');
      player.style.setProperty('--media-object-position', 'center');

      // Use our own clip-relative controls so the original Mux asset duration
      // and timeline are never exposed to the student.
      player.controls = false;
      player.removeAttribute('controls');
      [
        '--play-button','--center-controls','--time-range','--time-display',
        '--duration-display','--mute-button','--volume-range','--fullscreen-button',
        '--pip-button','--captions-button','--airplay-button','--cast-button',
        '--playback-rate-button','--seek-backward-button','--seek-forward-button'
      ].forEach(variable => player.style.setProperty(variable, 'none'));

      player.playbackToken = data.token;
      player.tokens = { playback: data.token };
      player.playbackId = data.playbackId;

      const clipDuration = clipEnd === null ? null : clipEnd - clipStart;
      let clipFinished = false;
      const controls = document.createElement('div');
      controls.style.cssText = "position:absolute;left:0;right:0;bottom:0;z-index:10;display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(transparent,rgba(0,0,0,.86));color:#fff";
      const controlButtonStyle = "border:0;background:transparent;color:#fff;font-size:18px;cursor:pointer;padding:4px 6px;min-width:30px";

      const playButton = document.createElement('button');
      playButton.type = 'button';
      playButton.textContent = '▶';
      playButton.setAttribute('aria-label', 'Play video');
      playButton.style.cssText = controlButtonStyle;
      playButton.addEventListener('click', async () => {
        try {
          if (clipFinished || (clipEnd !== null && player.currentTime >= clipEnd - 0.05)) {
            clipFinished = false;
            player.currentTime = clipStart;
          }
          if (player.paused) await player.play();
          else player.pause();
        } catch (_) { showPlayerStatus('Could not play this video. Please try again.', true); }
      });

      const progress = document.createElement('input');
      progress.type = 'range';
      progress.min = '0';
      progress.max = String(clipDuration || 100);
      progress.step = '0.1';
      progress.value = '0';
      progress.setAttribute('aria-label', 'Video progress');
      progress.style.cssText = 'flex:1;min-width:40px;width:100%;height:5px;margin:0;padding:0;accent-color:#fff;cursor:pointer';
      progress.addEventListener('input', () => {
        if (clipDuration === null) return;
        player.currentTime = clipStart + Number(progress.value);
        clipFinished = false;
      });

      const timeLabel = document.createElement('span');
      timeLabel.style.cssText = 'font-size:12px;white-space:nowrap;min-width:72px;text-align:center';
      const formatTime = value => {
        const seconds = Math.max(0, Math.floor(Number(value) || 0));
        return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
      };
      const volumeButton = document.createElement('button');
      volumeButton.type = 'button';
      volumeButton.textContent = '🔊';
      volumeButton.setAttribute('aria-label', 'Mute or unmute');
      volumeButton.style.cssText = controlButtonStyle;
      volumeButton.addEventListener('click', () => {
        player.muted = !player.muted;
        volumeButton.textContent = player.muted ? '🔇' : '🔊';
      });

      const volume = document.createElement('input');
      volume.type = 'range';
      volume.min = '0';
      volume.max = '1';
      volume.step = '0.05';
      volume.value = '1';
      volume.setAttribute('aria-label', 'Volume');
      volume.style.cssText = 'width:75px;min-width:55px;height:5px;margin:0;padding:0;accent-color:#fff;cursor:pointer';
      volume.addEventListener('input', () => {
        player.volume = Number(volume.value);
        player.muted = player.volume === 0;
      });

      const fullscreen = document.createElement('button');
      fullscreen.type = 'button';
      fullscreen.textContent = '⛶';
      fullscreen.setAttribute('aria-label', 'Fullscreen');
      fullscreen.style.cssText = controlButtonStyle;
      fullscreen.addEventListener('click', async () => {
        try {
          if (!document.fullscreenElement) await playerContainer.requestFullscreen();
          else await document.exitFullscreen();
        } catch (_) { showPlayerStatus('Fullscreen is not available in this browser.', true); }
      });

      controls.append(playButton, progress, timeLabel, volumeButton, volume, fullscreen);
      player.addEventListener('loadedmetadata', () => {
        if (player.currentTime < clipStart) player.currentTime = clipStart;
        if (clipDuration !== null) progress.max = String(clipDuration);
      });
      player.addEventListener('canplay', () => {
        if (player.currentTime < clipStart) player.currentTime = clipStart;
      });
      player.addEventListener('seeking', () => {
        if (player.currentTime < clipStart) player.currentTime = clipStart;
        if (clipEnd !== null && player.currentTime > clipEnd) player.currentTime = clipEnd;
      });
      player.addEventListener('timeupdate', () => {
        const elapsed = Math.max(0, player.currentTime - clipStart);
        if (clipDuration !== null) {
          progress.value = String(Math.min(clipDuration, elapsed));
          timeLabel.textContent = formatTime(elapsed) + ' / ' + formatTime(clipDuration);
        } else {
          timeLabel.textContent = formatTime(elapsed);
        }
        if (clipEnd !== null && !clipFinished && player.currentTime >= clipEnd) {
          clipFinished = true;
          player.pause();
          player.currentTime = clipEnd;
          progress.value = String(clipDuration);
          playButton.textContent = '▶';
          showPlayerStatus('This lesson video has finished.');
        }
      });
      player.addEventListener('play', () => {
        if (clipEnd !== null && player.currentTime >= clipEnd - 0.05) {
          clipFinished = false;
          player.currentTime = clipStart;
        }
        playButton.textContent = 'Ⅱ';
      });
      player.addEventListener('pause', () => { playButton.textContent = '▶'; });
      player.addEventListener('volumechange', () => {
        volume.value = String(player.muted ? 0 : player.volume);
        volumeButton.textContent = player.muted ? '🔇' : '🔊';
      });
      player.addEventListener('error', () => {
        showPlayerStatus('The video could not be played. Please refresh and try again.', true);
      });

      playerContainer.style.position = 'relative';
      playerContainer.replaceChildren(player, controls);
      activePlayer = player;

    } catch (error) {
      console.error('Paid playback request failed:', error);
      showPlayerStatus(error.message || 'Could not start this video. Please try again.', true);
      button.disabled = false;
      button.classList.remove('active');
    }
  }

  async function init() {
    if (!course) {
      titleEl.textContent = 'Course not found';
      countEl.textContent = '';
      showMessage('The requested course could not be identified.');
      return;
    }
    titleEl.textContent = course.title;
    document.title = course.title + ' | My Physics Academia';

    try {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        location.replace('student-login.html?return=' + encodeURIComponent('student-course.html?class=' + level));
        return;
      }

      const { data: accessRows, error: accessError } = await supabaseClient
        .from('student_course_access')
        .select('course_id')
        .eq('user_id', authData.user.id)
        .eq('course_id', course.id)
        .eq('access_status', 'active')
        .limit(1);
      if (accessError) throw accessError;
      if (!accessRows || !accessRows.length) {
        countEl.textContent = 'Course access required';
        showMessage('This course is not currently activated for your account. Return to My Learning or contact the administrator.');
        return;
      }

      const { data: syllabus, error: syllabusError } = await supabaseClient
        .from('student_course_syllabus')
        .select('course_id,course_title,class_level,chapter_id,chapter_title,chapter_sort_order,lesson_id,lesson_title,lesson_description,duration_seconds,lesson_sort_order')
        .eq('course_id', course.id)
        .order('chapter_sort_order', { ascending: true })
        .order('lesson_sort_order', { ascending: true });
      if (syllabusError) throw syllabusError;
      if (!syllabus || !syllabus.length) {
        countEl.textContent = 'Course content is being prepared';
        showMessage('The syllabus for this course is not available yet.');
        return;
      }

      const { data: concepts, error: conceptsError } = await supabaseClient.rpc('get_my_course_concepts', {
        p_course_id: course.id
      });
      if (conceptsError) throw conceptsError;

      const conceptsByLesson = new Map();
      (concepts || []).forEach(item => {
        if (!conceptsByLesson.has(item.lesson_id)) conceptsByLesson.set(item.lesson_id, []);
        conceptsByLesson.get(item.lesson_id).push(item);
      });

      const chapters = new Map();
      syllabus.forEach(row => {
        if (!chapters.has(row.chapter_id)) {
          chapters.set(row.chapter_id, { title: row.chapter_title, order: row.chapter_sort_order, lessons: new Map() });
        }
        const chapter = chapters.get(row.chapter_id);
        if (!chapter.lessons.has(row.lesson_id)) {
          chapter.lessons.set(row.lesson_id, {
            id: row.lesson_id, title: row.lesson_title, order: row.lesson_sort_order,
            description: row.lesson_description, duration: row.duration_seconds
          });
        }
      });

      const chapterList = [...chapters.values()].sort((a,b) => Number(a.order) - Number(b.order));
      const lessonTotal = chapterList.reduce((sum, chapter) => sum + chapter.lessons.size, 0);
      countEl.textContent = chapterList.length + ' chapters · ' + lessonTotal + ' lessons';

      const fragment = document.createDocumentFragment();
      chapterList.forEach((chapter, index) => {
        const chapterDetails = document.createElement('details');
        chapterDetails.className = 'student-chapter';
        const chapterSummary = document.createElement('summary');
        chapterSummary.textContent = 'Chapter ' + (index + 1) + ': ' + chapter.title;
        chapterDetails.appendChild(chapterSummary);

        const lessonList = document.createElement('div');
        lessonList.className = 'student-lesson-list';
        [...chapter.lessons.values()].sort((a,b) => Number(a.order) - Number(b.order)).forEach(lesson => {
          const lessonDetails = document.createElement('details');
          lessonDetails.className = 'student-lesson';
          const lessonSummary = document.createElement('summary');
          lessonSummary.textContent = lesson.title;
          lessonDetails.appendChild(lessonSummary);

          const lessonConcepts = conceptsByLesson.get(lesson.id) || [];
          if (lessonConcepts.length) {
            const list = document.createElement('ul');
            list.className = 'student-concepts';
            lessonConcepts.sort((a,b) => Number(a.sort_order) - Number(b.sort_order)).forEach(concept => {
              const item = document.createElement('li');
              const button = document.createElement('button');
              button.type = 'button';
              button.className = 'student-concept-button';
              button.textContent = concept.concept_title;
              button.addEventListener('click', () => playConcept(concept, button));
              item.appendChild(button);
              list.appendChild(item);
            });
            lessonDetails.appendChild(list);
          } else {
            const note = document.createElement('p');
            note.className = 'sub';
            note.textContent = 'Lessons for this section will be added soon.';
            lessonDetails.appendChild(note);
          }
          lessonList.appendChild(lessonDetails);
        });
        chapterDetails.appendChild(lessonList);
        fragment.appendChild(chapterDetails);
      });
      syllabusEl.replaceChildren(fragment);
    } catch (error) {
      console.error('Student course page failed:', error);
      countEl.textContent = 'Unable to load course';
      showMessage(error.message || 'Course content could not be loaded. Please refresh the page.');
    }
  }
  init();
})();