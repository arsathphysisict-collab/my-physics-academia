(() => {
  const listElement = document.getElementById("preview-list");
  const playerContainer = document.getElementById("preview-player");
  const statusElement = document.getElementById("preview-status");
  const titleElement = document.getElementById("preview-title");
  const chapterElement = document.getElementById("preview-chapter");
  const descriptionElement = document.getElementById("preview-description");

  if (!listElement || !playerContainer || typeof supabaseClient === "undefined") return;

  const VISITOR_KEY = "mpa_preview_visitor_id";
  const WATCHED_KEY = "mpa_preview_watched_v1";

  function getVisitorId() {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }

  function getWatchedIds() {
    try {
      return new Set(JSON.parse(localStorage.getItem(WATCHED_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }

  function saveWatchedId(id) {
    const watched = getWatchedIds();
    watched.add(id);
    localStorage.setItem(WATCHED_KEY, JSON.stringify([...watched]));
  }

  function showStatus(message, isError = false) {
    statusElement.textContent = message;
    statusElement.classList.toggle("error", isError);
  }

  function stopCurrentPlayer() {
    const oldPlayer = playerContainer.querySelector("mux-player");
    if (oldPlayer) {
      try { oldPlayer.pause(); } catch (_) {}
      oldPlayer.remove();
    }
    playerContainer.innerHTML = '<div class="preview-placeholder"><span>▶</span><small>Select a preview lesson to begin</small></div>';
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(Number(seconds))) return "Preview lesson";
    const mins = Math.floor(Number(seconds) / 60);
    const secs = Number(seconds) % 60;
    return mins ? mins + " min " + secs + " sec" : secs + " sec";
  }

  function createPreviewButton(video, index, watched) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preview-item";
    button.dataset.previewId = video.id;
    button.disabled = watched;
    const thumbnail = document.createElement("span");
    thumbnail.className = "preview-thumb";
    thumbnail.setAttribute("aria-hidden", "true");

    if (video.thumbnail_url) {
      const image = document.createElement("img");
      image.src = video.thumbnail_url;
      image.alt = "";
      image.loading = "lazy";
      image.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover";
      thumbnail.appendChild(image);
    }

    const thumbnailLabel = document.createElement("span");
    thumbnailLabel.className = "preview-thumb-label";
    thumbnailLabel.textContent = "FREE PREVIEW";

    const playIcon = document.createElement("span");
    playIcon.className = "preview-thumb-play";
    playIcon.textContent = "▶";
    thumbnail.append(thumbnailLabel, playIcon);

    const copy = document.createElement("span");
    copy.className = "preview-copy";

    const heading = document.createElement("strong");
    heading.textContent = video.title;

    const detail = document.createElement("small");
    const chapter = video.chapter || {};
    detail.textContent = "Class " + (chapter.class_level || "") + " · " +
      (chapter.title || "Chapter") + " · " + formatDuration(video.duration_seconds);

    const state = document.createElement("span");
    state.className = "preview-state";
    state.textContent = watched ? "Already watched" : "▶  Watch preview";

    copy.append(heading, detail, state);
    button.append(thumbnail, copy);
    button.addEventListener("click", () => playPreview(video, button));
    return button;
  }

  async function loadPreviews() {
    showStatus("Loading preview lessons...");
    listElement.innerHTML = "";
    stopCurrentPlayer();

    try {
      const { data, error } = await supabaseClient.functions.invoke("list-preview-videos", {
        body: {}
      });
      if (error) throw error;
      if (!data || data.success !== true || !Array.isArray(data.previews)) {
        throw new Error((data && data.error) || "Preview lessons could not be loaded.");
      }

      if (data.previews.length === 0) {
        showStatus("Preview lessons will be available here soon.");
        return;
      }

      const watched = getWatchedIds();
      data.previews.forEach((video, index) => {
        listElement.appendChild(createPreviewButton(video, index, watched.has(video.id)));
      });
      showStatus("Choose any available preview lesson. Each preview can be started once in this browser.");
    } catch (error) {
      console.error("Preview list load failed:", error);
      showStatus("Could not load preview lessons. Please refresh and try again.", true);
    }
  }

  async function playPreview(video, button) {
    if (button.disabled) return;

    document.querySelectorAll(".preview-item").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    button.disabled = true;
    button.querySelector(".preview-state").textContent = "Preparing video...";
    showStatus("Preparing your preview video...");
    stopCurrentPlayer();

    try {
      const { data, error } = await supabaseClient.functions.invoke("get-preview-playback", {
        body: {
          visitor_id: getVisitorId(),
          concept_id: video.id
        }
      });

      if (error) {
        let detail = "";
        try {
          if (error.context && typeof error.context.json === "function") {
            const responseBody = await error.context.json();
            detail = responseBody.error || responseBody.message || "";
          }
        } catch (_) {}
        if (error.context && error.context.status === 403) {
          saveWatchedId(video.id);
          button.querySelector(".preview-state").textContent = "Already watched";
          showStatus(detail || "This preview has already been used in this browser.", true);
          return;
        }
        throw new Error(detail || error.message || "Could not start this preview.");
      }

      if (!data || !data.playbackId || !data.token) {
        throw new Error((data && data.error) || "Secure playback details were not returned.");
      }

      saveWatchedId(video.id);
      button.querySelector(".preview-state").textContent = "Preview started";
      titleElement.textContent = video.title;
      const chapter = video.chapter || {};
      chapterElement.textContent = "Class " + (chapter.class_level || "") + " · " + (chapter.title || "Chapter");
      descriptionElement.textContent = video.category || "Preview lesson";

      // Wait until the Mux custom element is registered before setting its properties.
      await customElements.whenDefined("mux-player");
      const player = document.createElement("mux-player");
      player.setAttribute("stream-type", "on-demand");
      player.setAttribute("playsinline", "");
      player.style.width = "100%";
      player.style.aspectRatio = "16 / 9";
      player.style.display = "block";

      // Set the signed token BEFORE the playback ID so the first stream request
      // is created with the token already attached.
      player.playbackToken = data.token;
      player.tokens = { playback: data.token };
      player.playbackId = data.playbackId;

      player.addEventListener("error", () => {
        showStatus("The video could not be played. Please contact the website administrator.", true);
      });
      player.addEventListener("ended", () => {
        showStatus("Preview finished. This preview has now been used.");
      });
      playerContainer.replaceChildren(player);
      showStatus("Your preview is ready. Only one video can play at a time.");
    } catch (error) {
      console.error("Preview playback request failed:", error);
      button.disabled = false;
      button.querySelector(".preview-state").textContent = "Try again";
      button.classList.remove("active");
      showStatus(error.message || "Could not start the preview. Please try again.", true);
    }
  }

  loadPreviews();
})();