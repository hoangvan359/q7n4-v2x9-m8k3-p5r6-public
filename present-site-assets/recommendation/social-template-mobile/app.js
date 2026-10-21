const $ = selector => document.querySelector(selector);
const phone = $(".phone");
const feed = $(".feed-view");
const formView = $(".form-view");
const overlay = $(".question-overlay");
const carouselTrack = $(".carousel-track");
const creativeSlide = $(".creative-slide");
const carousel = $("#carousel");
const form = $("#lead-form");
const autoControl = $("#autoplay");
let view = "feed";
let slide = 0;
let timer;
let toastTimer;
let returnFocus;
let startPoint;
let swipedAt = 0;
let formAnimation;
let transitionVersion = 0;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

async function animateForm(opening) {
  const version = ++transitionVersion;
  const from = formAnimation ? getComputedStyle(formView).transform : opening ? "translateX(100%)" : "translateX(0)";
  formAnimation?.cancel();
  const animation = formView.animate(
    [{transform: from}, {transform: opening ? "translateX(0)" : "translateX(100%)"}],
    {duration: reducedMotion.matches ? 0 : 320, easing: "cubic-bezier(.22,.61,.36,1)", fill: "both"}
  );
  formAnimation = animation;
  await animation.finished.catch(() => {});
  if (version !== transitionVersion) return false;
  return true;
}

function scheduleAutoplay() {
  clearTimeout(timer);
  if (autoControl.checked && !document.hidden && view === "feed" && slide === 0) {
    timer = setTimeout(() => setSlide(1), 2000);
  }
}
function updateControls() {
  const current = view === "form" ? "form" : slide ? "question" : "feed";
  document.querySelectorAll("[data-view]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.view === current));
  });
  $(".state-label").textContent = "Đang xem: " + ({feed: "Creative", question: "Câu hỏi", form: "Biểu mẫu"})[current];
}
function setSlide(index) {
  slide = index;
  if (view !== "form") phone.dataset.state = slide ? "question" : "feed";
  const inactiveSlide = slide ? creativeSlide : overlay;
  if (inactiveSlide.contains(document.activeElement)) carousel.focus({preventScroll: true});
  carouselTrack.classList.toggle("is-question", Boolean(slide));
  creativeSlide.inert = Boolean(slide);
  creativeSlide.setAttribute("aria-hidden", String(Boolean(slide)));
  overlay.inert = !slide;
  overlay.setAttribute("aria-hidden", String(!slide));
  document.querySelectorAll("[data-slide]").forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.slide) === slide)));
  phone.dataset.nodeId = slide ? "10024:82641" : "10024:80272";
  $(".ad-post").dataset.nodeId = slide ? "10024:82646" : "10024:82143";
  carousel.dataset.nodeId = slide ? "10024:83004" : "10024:82562";
  $(".carousel-dots").dataset.nodeId = slide ? "10041:78585" : "10041:78568";
  $(".swipe-indicator-glyph").src = slide ? "assets/swipe-indicator-question.svg" : "assets/swipe-indicator-creative.svg";
  updateControls();
  scheduleAutoplay();
}
function openForm(answer) {
  if (view === "form") return;
  returnFocus = document.activeElement;
  if (answer) form.querySelector(`input[value="${answer}"]`).checked = true;
  view = "form";
  clearTimeout(timer);
  phone.dataset.state = "form";
  phone.dataset.nodeId = "10040:24469";
  feed.inert = true;
  feed.setAttribute("aria-hidden", "true");
  formView.hidden = false;
  $(".form-scroll").scrollTop = 0;
  updateControls();
  animateForm(true).then(completed => {
    if (completed) { formAnimation.cancel(); formAnimation = null; }
  });
  if (returnFocus !== document.body) $(".close-form").focus({preventScroll: true});
}
async function closeForm(nextSlide = 1) {
  if (view !== "form") return;
  view = "closing";
  if (!await animateForm(false)) return;
  view = "feed";
  phone.dataset.state = "feed";
  formView.hidden = true;
  formAnimation.cancel();
  formAnimation = null;
  feed.inert = false;
  feed.removeAttribute("aria-hidden");
  setSlide(nextSlide);
  (returnFocus?.isConnected && !returnFocus.closest("[hidden]") ? returnFocus : $(".register-button")).focus({preventScroll: true});
}
function showToast(message) {
  clearTimeout(toastTimer);
  $(".toast").textContent = message;
  $(".toast").hidden = false;
  toastTimer = setTimeout(() => { $(".toast").hidden = true; }, 3000);
}
document.querySelectorAll("[data-answer]").forEach(button => {
  button.addEventListener("click", () => {
    if (Date.now() - swipedAt > 300) openForm(button.dataset.answer);
  });
});
document.querySelectorAll("[data-slide]").forEach(button => button.addEventListener("click", () => setSlide(Number(button.dataset.slide))));
document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.view === "form") return openForm();
    const nextSlide = button.dataset.view === "question" ? 1 : 0;
    if (view === "form") return closeForm(nextSlide);
    if (view === "closing") return;
    setSlide(nextSlide);
  });
});
$(".register-button").addEventListener("click", () => openForm());
$(".close-form").addEventListener("click", () => closeForm());
$(".decline-button").addEventListener("click", () => closeForm());
autoControl.addEventListener("change", scheduleAutoplay);
document.addEventListener("visibilitychange", scheduleAutoplay);
carousel.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    setSlide(event.key === "ArrowRight" ? 1 : 0);
  }
});
carousel.addEventListener("pointerdown", event => {
  startPoint = {x: event.clientX, y: event.clientY};
  clearTimeout(timer);
});
carousel.addEventListener("dragstart", event => event.preventDefault());
carousel.addEventListener("pointerup", event => {
  if (!startPoint) return;
  const dx = event.clientX - startPoint.x;
  const dy = event.clientY - startPoint.y;
  startPoint = null;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
    swipedAt = Date.now();
    setSlide(dx < 0 ? 1 : 0);
  } else scheduleAutoplay();
});
carousel.addEventListener("pointercancel", () => { startPoint = null; scheduleAutoplay(); });
form.addEventListener("submit", event => {
  event.preventDefault();
  showToast("Đã gửi thử biểu mẫu. Dữ liệu chỉ ở trong phiên demo này.");
});
$(".like-button").addEventListener("click", event => {
  const button = event.currentTarget;
  const liked = button.getAttribute("aria-pressed") === "true";
  button.setAttribute("aria-pressed", String(!liked));
  $("#like-count").textContent = liked ? "2" : "3";
});
$(".comment-button").addEventListener("click", () => showToast("Phần bình luận nằm ngoài flow đăng ký này."));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && view === "form") closeForm();
});
const params = new URLSearchParams(location.search);
if (params.get("autoplay") === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches) autoControl.checked = false;
setSlide(params.get("state") === "question" ? 1 : 0);
if (params.get("state") === "form") openForm("beginner");
