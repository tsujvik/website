const clock = document.getElementById("clock");

function updateClock() {
  clock.textContent = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    timeZone: "America/Los_Angeles",
  });
}
updateClock();
setInterval(updateClock, 1000);

// (-1, 1)
const hero = document.querySelector(".hero");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion) {
  hero.addEventListener("mousemove", (event) => {
    const box = hero.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width * 2 - 1;
    const y = (event.clientY - box.top) / box.height * 2 - 1;
    hero.style.setProperty("--mx", x.toFixed(3));
    hero.style.setProperty("--my", y.toFixed(3));
  });
} else {
  document.querySelector(".hero-chrome").pauseAnimations();
}

// filters
const filterButtons = document.querySelectorAll(".filter");
const projects = document.querySelectorAll(".project");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((b) => {
      const active = b === button;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active);
    });

    projects.forEach((project) => {
      const tags = project.dataset.tags.split(" ");
      const show = filter === "all" || tags.includes(filter);
      project.classList.toggle("is-hidden", !show);
    });
  });
});

// Scrapbook: drag items and remember where they were left
const board = document.querySelector(".board");
const scraps = [...board.querySelectorAll(".scrap")];
const wideScreen = window.matchMedia("(min-width: 701px)");
let topZ = 10;

scraps.forEach((s) => {
  s.dataset.home = JSON.stringify({ left: s.style.left, top: s.style.top, r: s.style.getPropertyValue("--r") });
});

function place(s, { left, top, r }) {
  s.style.left = left;
  s.style.top = top;
  s.style.setProperty("--r", r);
}

function save() {
  const layout = scraps.map((s) => ({ left: s.style.left, top: s.style.top, r: s.style.getPropertyValue("--r") }));
  try { localStorage.setItem("scrapbook", JSON.stringify(layout)); } catch (e) {}
}

try {
  const saved = JSON.parse(localStorage.getItem("scrapbook"));
  if (saved && saved.length === scraps.length) scraps.forEach((s, i) => place(s, saved[i]));
} catch (e) {}

scraps.forEach((s) => {
  s.addEventListener("pointerdown", (event) => {
    if (!wideScreen.matches) return;
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
  scraps.forEach((s) => place(s, JSON.parse(s.dataset.home)));
  try { localStorage.removeItem("scrapbook"); } catch (e) {}
});