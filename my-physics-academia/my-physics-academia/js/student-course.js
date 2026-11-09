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

  function showMessage(message) {
    const box = document.createElement('div');
    box.className = 'student-course-message';
    box.textContent = message;
    syllabusEl.replaceChildren(box);
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
              item.textContent = concept.concept_title;
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