const $ = id => document.getElementById(id);
const fileInput = $("videoFile");
const video = $("video");
const empty = $("emptyState");
const startRange = $("startRange");
const endRange = $("endRange");

let objectUrl = null;
let exporting = false;
let frameMode = "fill";
let previewStopHandler = null;

function timecode(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3200);
}

function updateLabels() {
  const start = Number(startRange.value);
  const end = Number(endRange.value);
  $("startLabel").textContent = timecode(start);
  $("endLabel").textContent = timecode(end);
  $("durationLabel").textContent = timecode(Math.max(0, end - start));
}

function setEditorEnabled(enabled) {
  startRange.disabled = !enabled;
  endRange.disabled = !enabled;
  $("markStartBtn").disabled = !enabled;
  $("markEndBtn").disabled = !enabled;
  $("previewClipBtn").disabled = !enabled;
  $("exportBtn").disabled = !enabled;
}

function seekTo(seconds) {
  return new Promise((resolve, reject) => {
    const target = Math.max(0, Math.min(video.duration || 0, seconds));
    if (Math.abs(video.currentTime - target) < 0.04) {
      resolve();
      return;
    }
    const onSeeked = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("No se pudo mover al punto elegido del video.")); };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = target;
  });
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("video/")) {
    toast("Selecciona un archivo de video.");
    fileInput.value = "";
    return;
  }
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  video.pause();
  video.src = objectUrl;
  video.style.display = "block";
  empty.style.display = "none";
  setEditorEnabled(false);
  $("fileHint").textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
  $("exportHint").textContent = "Cargando información del video…";
  video.load();
  fileInput.value = "";
});

video.addEventListener("loadedmetadata", () => {
  const duration = video.duration;
  if (!Number.isFinite(duration) || duration <= 0) {
    toast("No se pudo leer la duración de este video.");
    return;
  }
  startRange.max = duration;
  endRange.max = duration;
  startRange.value = 0;
  endRange.value = duration;
  setEditorEnabled(true);
  updateLabels();
  $("exportHint").textContent = "Mueve los controles o reproduce el video y marca el inicio y el final.";
});

video.addEventListener("error", () => {
  if (video.src) toast("No se pudo abrir este video. Prueba con otro formato, como MP4.");
});

startRange.addEventListener("input", () => {
  const minEnd = Math.min(video.duration, Number(startRange.value) + 0.5);
  if (Number(endRange.value) < minEnd) endRange.value = minEnd;
  updateLabels();
});
endRange.addEventListener("input", () => {
  const maxStart = Math.max(0, Number(endRange.value) - 0.5);
  if (Number(startRange.value) > maxStart) startRange.value = maxStart;
  updateLabels();
});
startRange.addEventListener("change", () => seekTo(Number(startRange.value)).catch(err => toast(err.message)));
endRange.addEventListener("change", () => seekTo(Number(endRange.value)).catch(err => toast(err.message)));

$("markStartBtn").addEventListener("click", () => {
  const next = Math.max(0, Math.min(video.currentTime, video.duration - 0.5));
  startRange.value = next;
  if (Number(endRange.value) <= next) endRange.value = Math.min(video.duration, next + 0.5);
  updateLabels();
  toast("Inicio marcado en " + timecode(next));
});

$("markEndBtn").addEventListener("click", () => {
  const next = Math.min(video.duration, Math.max(video.currentTime, Number(startRange.value) + 0.5));
  endRange.value = next;
  updateLabels();
  toast("Final marcado en " + timecode(next));
});

function setFrameMode(mode) {
  frameMode = mode;
  video.classList.toggle("fit", mode === "fit");
  $("fitBtn").classList.toggle("active", mode === "fit");
  $("fillBtn").classList.toggle("active", mode === "fill");
}
$("fitBtn").addEventListener("click", () => setFrameMode("fit"));
$("fillBtn").addEventListener("click", () => setFrameMode("fill"));

$("previewClipBtn").addEventListener("click", async () => {
  video.pause();
  if (previewStopHandler) video.removeEventListener("timeupdate", previewStopHandler);
  try {
    await seekTo(Number(startRange.value));
    await video.play();
    const end = Number(endRange.value);
    previewStopHandler = () => {
      if (video.currentTime >= end) {
        video.pause();
        video.removeEventListener("timeupdate", previewStopHandler);
        previewStopHandler = null;
      }
    };
    video.addEventListener("timeupdate", previewStopHandler);
  } catch (err) {
    toast("No se pudo iniciar la vista previa. Toca reproducir en el video.");
  }
});

function drawVerticalFrame(ctx, canvas, sourceWidth, sourceHeight) {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  if (!sourceWidth || !sourceHeight) return;

  if (frameMode === "fit") {
    const scale = Math.min(canvasWidth / sourceWidth, canvasHeight / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    ctx.drawImage(video, (canvasWidth - drawWidth) / 2, (canvasHeight - drawHeight) / 2, drawWidth, drawHeight);
    return;
  }

  const targetRatio = canvasWidth / canvasHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvasWidth, canvasHeight);
}

async function exportClip() {
  if (exporting) return;
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    toast("Este navegador no permite exportar. Prueba con Chrome actualizado en Android.");
    return;
  }

  const start = Number(startRange.value);
  const end = Number(endRange.value);
  if (end - start < 0.5) {
    toast("El fragmento debe durar al menos medio segundo.");
    return;
  }

  exporting = true;
  $("exportBtn").disabled = true;
  $("progress").classList.remove("hidden");
  $("progressBar").style.width = "0%";
  $("exportHint").textContent = "Preparando el clip… No cierres esta pestaña.";

  const oldTime = video.currentTime;
  const wasPaused = video.paused;
  let recorder = null;
  let canvasStream = null;
  let animationId = 0;
  let safetyTimer = 0;
  let onEnded = null;

  try {
    video.pause();
    await seekTo(start);

    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("No se pudo preparar el lienzo de exportación.");

    canvasStream = canvas.captureStream(30);
    let audioIncluded = false;
    const sourceStream = video.captureStream?.() || video.mozCaptureStream?.();
    if (sourceStream) {
      const audioTracks = sourceStream.getAudioTracks();
      audioTracks.forEach(track => canvasStream.addTrack(track));
      audioIncluded = audioTracks.length > 0;
    }

    const mimeOptions = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4"
    ];
    const selectedMime = mimeOptions.find(type => MediaRecorder.isTypeSupported?.(type));
    recorder = selectedMime ? new MediaRecorder(canvasStream, { mimeType: selectedMime }) : new MediaRecorder(canvasStream);
    const chunks = [];
    recorder.ondataavailable = event => { if (event.data && event.data.size) chunks.push(event.data); };

    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = event => reject(event.error || new Error("Falló la grabación del clip."));
    });

    let stopOnce = false;
    const stopRecording = () => {
      if (stopOnce) return;
      stopOnce = true;
      if (recorder && recorder.state !== "inactive") recorder.stop();
    };

    const draw = () => {
      drawVerticalFrame(ctx, canvas, video.videoWidth, video.videoHeight);
      const percent = Math.min(100, Math.max(0, ((video.currentTime - start) / (end - start)) * 100));
      $("progressBar").style.width = percent + "%";
      if (video.currentTime >= end || video.ended) {
        stopRecording();
      } else {
        animationId = requestAnimationFrame(draw);
      }
    };

    onEnded = stopRecording;
    video.addEventListener("ended", onEnded, { once: true });
    recorder.start(250);
    await video.play();
    draw();
    safetyTimer = setTimeout(stopRecording, Math.max(15000, (end - start) * 4000 + 15000));
    await stopped;
    cancelAnimationFrame(animationId);
    clearTimeout(safetyTimer);
    video.pause();

    if (!chunks.length) throw new Error("No se generó el archivo. Intenta con un video más corto.");
    const actualMime = recorder.mimeType || selectedMime || "video/webm";
    const blob = new Blob(chunks, { type: actualMime });
    const extension = actualMime.includes("mp4") ? "mp4" : "webm";
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `clipmaster-${Date.now()}.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);

    $("progressBar").style.width = "100%";
    $("exportHint").textContent = `Exportación terminada en ${extension.toUpperCase()}. Revisa Descargas.`;
    toast(audioIncluded ? "Clip exportado con audio. Revisa Descargas." : "Clip exportado. El navegador podría no haber incluido el audio.");
  } catch (err) {
    console.error(err);
    $("exportHint").textContent = "No se pudo exportar. Prueba con un video más corto.";
    toast(err.message || "No se pudo exportar el clip.");
  } finally {
    cancelAnimationFrame(animationId);
    clearTimeout(safetyTimer);
    if (onEnded) video.removeEventListener("ended", onEnded);
    if (recorder && recorder.state !== "inactive") {
      try { recorder.stop(); } catch (_) {}
    }
    canvasStream?.getTracks().forEach(track => track.stop());
    video.pause();
    try {
      await seekTo(oldTime);
      if (!wasPaused) await video.play();
    } catch (_) {}
    exporting = false;
    $("exportBtn").disabled = false;
    setTimeout(() => $("progress").classList.add("hidden"), 800);
  }
}

$("exportBtn").addEventListener("click", exportClip);

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
