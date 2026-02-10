const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("capture");
const downloadBtn = document.getElementById("download-btn");
const resetBtn = document.getElementById("reset-btn");
const stickers = document.querySelectorAll(".sticker");
const ctx = canvas.getContext("2d");

let photoCaptured = false;
let placedStickers = [];
let capturedImage = null;

stickers.forEach((s) => s.classList.add("disabled"));

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => alert("Camera access error: " + err));

captureBtn.addEventListener("click", () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  capturedImage = new Image();
  capturedImage.src = canvas.toDataURL("image/png");

  video.style.display = "none";
  canvas.style.display = "block";

  photoCaptured = true;
  stickers.forEach((s) => s.classList.remove("disabled"));

  console.log("📸 Photo captured");
});

stickers.forEach((sticker) => {
  sticker.addEventListener("click", () => {
    if (!photoCaptured) return;

    const img = new Image();
    img.src = sticker.src;
    img.onload = () => {
      const x = Math.random() * (canvas.width - 100);
      const y = Math.random() * (canvas.height - 100);
      placedStickers.push({ img, x, y, size: 100 });
      drawAll();
    };
  });
});

function drawAll() {
  if (!capturedImage) return;
  if (capturedImage.complete) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(capturedImage, 0, 0, canvas.width, canvas.height);
    placedStickers.forEach((s) =>
      ctx.drawImage(s.img, s.x, s.y, s.size, s.size)
    );
  } else {
    capturedImage.onload = drawAll;
  }
}


let dragging = false;
let dragIndex = null;
let offsetX, offsetY;

canvas.addEventListener("mousedown", (e) => {
  if (!photoCaptured) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  for (let i = placedStickers.length - 1; i >= 0; i--) {
    const s = placedStickers[i];
    if (x >= s.x && x <= s.x + s.size && y >= s.y && y <= s.y + s.size) {
      dragging = true;
      dragIndex = i;
      offsetX = x - s.x;
      offsetY = y - s.y;
      break;
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const s = placedStickers[dragIndex];
  s.x = x - offsetX;
  s.y = y - offsetY;
  drawAll();
});

canvas.addEventListener("mouseup", () => (dragging = false));
canvas.addEventListener("mouseleave", () => (dragging = false));
downloadBtn.addEventListener("click", () => {
  if (!photoCaptured) return alert("Capture photo first!");

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  function exportCanvas() {
    tempCtx.drawImage(capturedImage, 0, 0, tempCanvas.width, tempCanvas.height);
    placedStickers.forEach((s) =>
      tempCtx.drawImage(s.img, s.x, s.y, s.size, s.size)
    );

    const link = document.createElement("a");
    link.download = "coffee-booth-photo.png";
    link.href = tempCanvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log("✅ Download triggered");
  }

  if (!capturedImage.complete) {
    capturedImage.onload = exportCanvas;
  } else {
    exportCanvas();
  }
});

// === Reset to Camera ===
resetBtn.addEventListener("click", () => {
  photoCaptured = false;
  placedStickers = [];
  capturedImage = null;

  canvas.style.display = "none";
  video.style.display = "block";
  stickers.forEach((s) => s.classList.add("disabled"));

  console.log("🔄 Reset done");
});
