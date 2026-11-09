const $ = id => document.getElementById(id);
const fileInput=$("videoFile"), video=$("video"), empty=$("emptyState");
const startRange=$("startRange"), endRange=$("endRange");
let objectUrl=null, exporting=false, stopRequested=false;

function timecode(seconds){if(!Number.isFinite(seconds))return "00:00";seconds=Math.max(0,Math.floor(seconds));const m=Math.floor(seconds/60),s=seconds%60;return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800);}
function updateLabels(){$("startLabel").textContent=timecode(+startRange.value);$("endLabel").textContent=timecode(+endRange.value);$("durationLabel").textContent=timecode(Math.max(0,+endRange.value-+startRange.value));}
function setEnabled(on){startRange.disabled=!on;endRange.disabled=!on;$("previewClipBtn").disabled=!on;$("exportBtn").disabled=!on;}
fileInput.addEventListener("change",()=>{
 const file=fileInput.files?.[0];if(!file)return;
 if(!file.type.startsWith("video/")){toast("Selecciona un archivo de video.");return;}
 if(objectUrl)URL.revokeObjectURL(objectUrl);
 objectUrl=URL.createObjectURL(file);video.src=objectUrl;video.style.display="block";empty.style.display="none";
 $("fileHint").textContent=`${file.name} · ${(file.size/1024/1024).toFixed(1)} MB`;
 video.load();
});
video.addEventListener("loadedmetadata",()=>{
 const d=video.duration;if(!Number.isFinite(d)||d<=0){toast("No se pudo leer la duración de este video.");return;}
 startRange.max=endRange.max=d;startRange.value=0;endRange.value=d;
 setEnabled(true);updateLabels();$("exportHint").textContent="Elige el inicio y el final de tu clip.";
});
startRange.addEventListener("input",()=>{if(+startRange.value>=+endRange.value)startRange.value=Math.max(0,+endRange.value-.1);updateLabels();});
endRange.addEventListener("input",()=>{if(+endRange.value<=+startRange.value)endRange.value=Math.min(video.duration,+startRange.value+.1);updateLabels();});
startRange.addEventListener("change",()=>{video.currentTime=+startRange.value;});
endRange.addEventListener("change",()=>{video.currentTime=+endRange.value;});
$("fitBtn").addEventListener("click",()=>{video.classList.add("fit");$("fitBtn").classList.add("active");$("fillBtn").classList.remove("active");});
$("fillBtn").addEventListener("click",()=>{video.classList.remove("fit");$("fillBtn").classList.add("active");$("fitBtn").classList.remove("active");});
$("previewClipBtn").addEventListener("click",async()=>{
 video.pause();video.currentTime=+startRange.value;
 try{await video.play();}catch(e){toast("Toca reproducir para iniciar la vista previa.");}
 const end=+endRange.value;
 const check=()=>{if(video.currentTime>=end){video.pause();video.removeEventListener("timeupdate",check);}};
 video.addEventListener("timeupdate",check);
});
function waitEvent(target,name){return new Promise((resolve,reject)=>{const ok=e=>{cleanup();resolve(e)},bad=e=>{cleanup();reject(e)};const cleanup=()=>{target.removeEventListener(name,ok);target.removeEventListener("error",bad)};target.addEventListener(name,ok,{once:true});target.addEventListener("error",bad,{once:true});});}
async function exportClip(){
 if(exporting)return;
 if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){toast("Este navegador no permite exportar clips. Prueba Chrome actualizado.");return;}
 const start=+startRange.value,end=+endRange.value;
 if(end-start<1){toast("El clip debe durar al menos 1 segundo.");return;}
 exporting=true;stopRequested=false;$("exportBtn").disabled=true;$("progress").classList.remove("hidden");$("progressBar").style.width="0%";
 const oldTime=video.currentTime,wasPaused=video.paused;
 let recorder,raf,stream;
 try{
   video.pause();video.currentTime=start;await waitEvent(video,"seeked");
   const canvas=document.createElement("canvas");canvas.width=720;canvas.height=1280;
   const ctx=canvas.getContext("2d");
   stream=canvas.captureStream(30);
   // Audio is included where the browser exposes captureStream() on video elements.
   const capture=video.captureStream?.()||video.mozCaptureStream?.();
   if(capture){capture.getAudioTracks().forEach(t=>stream.addTrack(t));}
   const mime=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(t=>MediaRecorder.isTypeSupported(t));
   if(!mime)throw new Error("Tu navegador no ofrece un formato de exportación compatible.");
   const chunks=[];recorder=new MediaRecorder(stream,{mimeType:mime});
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   const done=new Promise(resolve=>recorder.onstop=resolve);
   recorder.start(250);
   const draw=()=>{
     const vw=video.videoWidth,vh=video.videoHeight;if(!vw||!vh)return;
     // Recorte central 9:16 para llenar el lienzo vertical.
     const targetRatio=9/16,sourceRatio=vw/vh;let sx=0,sy=0,sw=vw,sh=vh;
     if(sourceRatio>targetRatio){sw=vh*targetRatio;sx=(vw-sw)/2;}else{sh=vw/targetRatio;sy=(vh-sh)/2;}
     ctx.fillStyle="#000";ctx.fillRect(0,0,720,1280);ctx.drawImage(video,sx,sy,sw,sh,0,0,720,1280);
     const pct=Math.min(100,((video.currentTime-start)/(end-start))*100);$("progressBar").style.width=pct+"%";
     if(video.currentTime<end&&!stopRequested)raf=requestAnimationFrame(draw);
     else if(recorder.state!=="inactive")recorder.stop();
   };
   await video.play();draw();
   const ended=()=>{if(recorder.state!=="inactive")recorder.stop();};
   video.addEventListener("ended",ended,{once:true});
   await done;cancelAnimationFrame(raf);video.pause();
   if(!chunks.length)throw new Error("No se generó el archivo. Intenta con otro video.");
   const blob=new Blob(chunks,{type:mime});const url=URL.createObjectURL(blob);
   const a=document.createElement("a");a.href=url;a.download=`clipmaster-${Date.now()}.webm`;document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   toast("Clip exportado. Revisa la carpeta Descargas.");
 }catch(err){console.error(err);toast(err.message||"No se pudo exportar el clip.");}
 finally{
   cancelAnimationFrame(raf);if(recorder&&recorder.state!=="inactive")recorder.stop();
   stream?.getTracks().forEach(t=>t.stop());video.pause();
   try{video.currentTime=oldTime;if(!wasPaused)await video.play();}catch(e){}
   exporting=false;$("exportBtn").disabled=false;$("progress").classList.add("hidden");
 }
}
$("exportBtn").addEventListener("click",exportClip);
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
