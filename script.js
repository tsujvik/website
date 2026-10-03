const board = document.querySelector(".board");
const scraps = [...board.querySelectorAll(".scrap")];
const wideScreen = window.matchMedia("(min-width: 701px)");
let topZ = 10;

const storageKey = () => (wideScreen.matches ? "scrapbook-desktop" : "scrapbook-mobile");

scraps.forEach((s) => {
  s.dataset.home = JSON.stringify({ left: s.style.left, top: s.style.top, r: s.style.getPropertyValue("--r") });
});

function homeOf(s) {
  const home = JSON.parse(s.dataset.home);
  if (!wideScreen.matches) {
    const [left, top] = s.dataset.mobile.split(" ");
    return { ...home, left, top };
  }
  return home;
}

function place(s, { left, top, r }) {
  s.style.left = left;
  s.style.top = top;
  s.style.setProperty("--r", r);
}

function save() {
  const layout = scraps.map((s) => ({ left: s.style.left, top: s.style.top, r: s.style.getPropertyValue("--r") }));
  try { localStorage.setItem(storageKey(), JSON.stringify(layout)); } catch (e) {}
}

function applyLayout() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(storageKey())); } catch (e) {}
  const useSaved = saved && saved.length === scraps.length;
  scraps.forEach((s, i) => place(s, useSaved ? saved[i] : homeOf(s)));
}

applyLayout();
wideScreen.addEventListener("change", applyLayout);

scraps.forEach((s) => {
  s.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    s.setPointerCapture(event.pointerId);
    s.style.zIndex = ++topZ;
    s.classList.add("is-dragging");

    const boardBox = board.getBoundingClientRect();
    const offsetX = event.clientX - boardBox.left - s.offsetLeft;
    const offsetY = event.clientY - boardBox.top - s.offsetTop;

    function move(e) {
      const maxX = boardBox.width - s.offsetWidth;
      const maxY = boardBox.height - s.offsetHeight;
      const x = Math.min(Math.max(e.clientX - boardBox.left - offsetX, 0), maxX);
      const y = Math.min(Math.max(e.clientY - boardBox.top - offsetY, 0), maxY);
      s.style.left = (x / boardBox.width * 100).toFixed(2) + "%";
      s.style.top = (y / boardBox.height * 100).toFixed(2) + "%";
    }

    function drop() {
      s.classList.remove("is-dragging");
      s.removeEventListener("pointermove", move);
      save();
    }

    s.addEventListener("pointermove", move);
    s.addEventListener("pointerup", drop, { once: true });
    s.addEventListener("pointercancel", drop, { once: true });
  });
});

document.getElementById("shuffle").addEventListener("click", () => {
  scraps.forEach((s) => {
    const maxLeft = 100 - s.offsetWidth / board.clientWidth * 100;
    const maxTop = 100 - s.offsetHeight / board.clientHeight * 100;
    place(s, {
      left: (Math.random() * maxLeft).toFixed(2) + "%",
      top: (Math.random() * maxTop).toFixed(2) + "%",
      r: (Math.random() * 16 - 8).toFixed(1) + "deg",
    });
  });
  save();
});

document.getElementById("reset").addEventListener("click", () => {
  scraps.forEach((s) => place(s, homeOf(s)));
  try { localStorage.removeItem(storageKey()); } catch (e) {}
});