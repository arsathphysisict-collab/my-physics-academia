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
    const clipStart = video.start_time_seconds == null ? 0 : Number(video.start_time_seconds);
    const clipEnd = video.end_time_seconds == null ? Number(video.duration_seconds) : Number(video.end_time_seconds);
    const clipDuration = Number.isFinite(clipStart) && Number.isFinite(clipEnd) && clipEnd > clipStart
      ? clipEnd - clipStart
      : video.duration_seconds;
    detail.textContent = "Class " + (chapter.class_level || "") + " · " +
      (chapter.title || "Chapter") + " · " + formatDuration(clipDuration);

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
      // Send the selected class to the Edge Function so it filters
      // before applying the three-preview limit.
      const requestedClass = new URLSearchParams(window.location.search).get("class");
      const { data, error } = await supabaseClient.functions.invoke("list-preview-videos", {
        body: {
          class_level: requestedClass
        }
      });
      if (error) throw error;
      if (!data || data.success !== true || !Array.isArray(data.previews)) {
        throw new Error((data && data.error) || "Preview lessons could not be loaded.");
      }

      // When opened from a specific course, show previews for that class only.
      const previews = requestedClass === "11" || requestedClass === "12"
        ? data.previews.filter(video => String((video.chapter || {}).class_level) === requestedClass)
        : data.previews;

      if (previews.length === 0) {
        showStatus(requestedClass
          ? "Preview lessons for Class " + requestedClass + " will be available here soon."
          : "Preview lessons will be available here soon.");
        return;
      }

      const watched = getWatchedIds();
      previews.forEach((video, index) => {
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

      const clipStart = Number(data.startTime);
      const clipEnd = Number(data.endTime);
      if (
        !Number.isFinite(clipStart) ||
        !Number.isFinite(clipEnd) ||
        clipStart < 0 ||
        clipEnd <= clipStart
      ) {
        throw new Error("The preview clip range is invalid.");
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
      // Keep the Mux element inside the fixed 16:9 player frame.
      // Portrait videos remain centered with side space instead of showing
      // their own tall aspect-ratio box outside the player.
      player.style.position = "absolute";
      player.style.inset = "0";
      player.style.width = "100%";
      player.style.height = "100%";
      player.style.aspectRatio = "auto";
      player.style.display = "block";
      player.style.setProperty("--media-object-fit", "contain");
      player.style.setProperty("--media-object-position", "center");

      // Use clip-specific controls instead of Mux's full-asset timeline.
      player.controls = false;
      player.removeAttribute("controls");

      // Set the signed token BEFORE the playback ID so the first stream request
      // is created with the token already attached.
      player.playbackToken = data.token;
      player.tokens = { playback: data.token };
      player.playbackId = data.playbackId;

      let clipFinished = false;

      const enforceClipStart = () => {
        if (player.currentTime < clipStart) {
          player.currentTime = clipStart;
        }
      };

      player.addEventListener("loadedmetadata", enforceClipStart);
      player.addEventListener("canplay", enforceClipStart);

      player.addEventListener("seeking", () => {
        if (player.currentTime < clipStart) {
          player.currentTime = clipStart;
        } else if (player.currentTime > clipEnd) {
          player.currentTime = clipEnd;
        }
      });

      // If the viewer presses Play again after reaching the clip end,
      // restart at the selected clip's start instead of continuing into the
      // unused part of the original Mux asset.
      player.addEventListener("play", () => {
        if (player.currentTime >= clipEnd - 0.05) {
          clipFinished = false;
          player.currentTime = clipStart;
        }
        playButton.textContent = "Ⅱ";
        playButton.setAttribute("aria-label", "Pause preview");
      });

      player.addEventListener("pause", () => {
        playButton.textContent = "▶";
        playButton.setAttribute("aria-label", "Play preview");
      });

      player.addEventListener("timeupdate", () => {
        const progress = Math.max(0, Math.min(1, (player.currentTime - clipStart) / (clipEnd - clipStart)));
        progressBar.value = String(Math.round(progress * 100));
        progressBar.style.setProperty("--clip-progress", (progress * 100) + "%");

        if (!clipFinished && player.currentTime >= clipEnd) {
          clipFinished = true;
          player.pause();
          player.currentTime = clipEnd;
          progressBar.value = "100";
          progressBar.style.setProperty("--clip-progress", "100%");
          showStatus("Preview finished. This preview has now been used.");
        }
      });

      player.addEventListener("error", () => {
        showStatus("The video could not be played. Please contact the website administrator.", true);
      });
      player.addEventListener("ended", () => {
        clipFinished = true;
        showStatus("Preview finished. This preview has now been used.");
      });
      const controls = document.createElement("div");
      controls.className = "preview-custom-controls";
      controls.style.cssText = "position:absolute;left:0;right:0;bottom:0;z-index:10;display:flex;align-items:center;gap:12px;padding:12px 14px;background:linear-gradient(transparent,rgba(0,0,0,.82));color:#fff";
      const controlButtonStyle = "border:0;background:transparent;color:#fff;font-size:18px;cursor:pointer;padding:4px 6px;min-width:30px";
      const playButton = document.createElement("button");
      playButton.type = "button";
      playButton.textContent = "▶";
      playButton.setAttribute("aria-label", "Play preview");
      playButton.style.cssText = controlButtonStyle;
      playButton.addEventListener("click", async () => {
        try {
          if (player.paused) await player.play();
          else player.pause();
        } catch (error) {
          showStatus("Could not play this preview. Please try again.", true);
        }
      });

      const progressBar = document.createElement("input");
      progressBar.type = "range";
      progressBar.min = "0";
      progressBar.max = "100";
      progressBar.step = "0.1";
      progressBar.value = "0";
      progressBar.setAttribute("aria-label", "Preview progress");
      progressBar.style.cssText = "flex:1;min-width:40px;width:100%;height:5px;margin:0;accent-color:#fff;cursor:pointer;padding:0";
      progressBar.addEventListener("input", () => {
        const fraction = Number(progressBar.value) / 100;
        player.currentTime = clipStart + fraction * (clipEnd - clipStart);
        clipFinished = false;
      });

      const volumeButton = document.createElement("button");
      volumeButton.type = "button";
      volumeButton.textContent = "🔊";
      volumeButton.setAttribute("aria-label", "Mute or unmute");
      volumeButton.style.cssText = controlButtonStyle;
      volumeButton.addEventListener("click", () => {
        player.muted = !player.muted;
        volumeButton.textContent = player.muted ? "🔇" : "🔊";
      });

      const volumeBar = document.createElement("input");
      volumeBar.type = "range";
      volumeBar.min = "0";
      volumeBar.max = "1";
      volumeBar.step = "0.05";
      volumeBar.value = "1";
      volumeBar.setAttribute("aria-label", "Volume");
      volumeBar.style.cssText = "width:72px;height:5px;margin:0;padding:0;accent-color:#fff;cursor:pointer";
      volumeBar.addEventListener("input", () => {
        player.volume = Number(volumeBar.value);
        player.muted = player.volume === 0;
        volumeButton.textContent = player.muted ? "🔇" : "🔊";
      });

      const fullscreenButton = document.createElement("button");
      fullscreenButton.type = "button";
      fullscreenButton.textContent = "⛶";
      fullscreenButton.setAttribute("aria-label", "Fullscreen");
      fullscreenButton.style.cssText = controlButtonStyle;
      fullscreenButton.addEventListener("click", async () => {
        try {
          if (!document.fullscreenElement) await playerContainer.requestFullscreen();
          else await document.exitFullscreen();
        } catch (_) {
          showStatus("Fullscreen is not available in this browser.", true);
        }
      });

      controls.append(playButton, progressBar, volumeButton, volumeBar, fullscreenButton);
      playerContainer.replaceChildren(player, controls);
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