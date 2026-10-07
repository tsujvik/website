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

const journal = document.getElementById("journal");
const journalContent = journal.querySelector(".page-content");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let openedItem = null;

function openEntry(item) {
  if (journal.open || openedItem) return;
  openedItem = item;
  journalContent.replaceChildren(document.getElementById(item.dataset.entry).content.cloneNode(true));
  setupStacks(journalContent);
  if (item.classList.contains("sticky")) return peelOpen(item);
  const isTicket = item.classList.contains("ticket");
  const isSticky = item.classList.contains("sticky");
  item.classList.add(isTicket ? "is-ripping" : isSticky ? "is-peeling" : "is-opening");
  journal.classList.toggle("from-sticky", isSticky);

  const wait = reduceMotion ? 0 : isTicket ? 800 : isSticky ? 700 : 350;
  setTimeout(() => {
    journal.showModal();
    journal.querySelector(".page").scrollTop = 0;
  }, wait);
}

let peelAnims = [];

function peelOpen(note) {
  const page = journal.querySelector(".page");
  const flap = document.createElement("span");
  flap.className = "peel-flap";
  note.append(flap);

  const curlTime = 450;
  const growTime = 550;
  const curlEase = "cubic-bezier(0.45, 0, 0.25, 1)";

  // 1) bottom-right corner curls up toward the top-left
  peelAnims = [
    note.animate([
      { clipPath: "polygon(0 0, 100% 0, 100% 100%, 100% 100%, 0 100%)", transform: `rotate(${note.style.getPropertyValue("--r")})` },
      { clipPath: "polygon(0 0, 100% 0, 100% 30%, 30% 100%, 0 100%)", transform: `rotate(${note.style.getPropertyValue("--r")}) translateY(-4px) scale(1.04)` },
    ], { duration: curlTime, easing: curlEase, fill: "forwards" }),
    flap.animate([
      { clipPath: "polygon(100% 100%, 100% 100%, 100% 100%)" },
      { clipPath: "polygon(100% 30%, 30% 100%, 30% 30%)" },
    ], { duration: curlTime, easing: curlEase, fill: "forwards" }),
  ];

  // 2) the note lifts off and grows into the journal page
  setTimeout(() => {
    const from = note.getBoundingClientRect();
    page.style.animation = "none";
    journal.showModal();
    page.scrollTop = 0;
    const to = page.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const r = note.style.getPropertyValue("--r") || "0deg";

    peelAnims.push(
      note.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" }),
      page.animate([
        { transform: `translate(${dx}px, ${dy}px) rotate(${r}) scale(${from.width / to.width}, ${from.height / to.height})`, backgroundColor: "#dfe4ff" },
        { transform: "none", backgroundColor: "#fdfdfb" },
      ], { duration: growTime, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.04)" }),
      journalContent.animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: growTime }),
    );
  }, curlTime);
}

function resetPeel(note) {
  peelAnims.forEach((a) => a.cancel());
  peelAnims = [];
  note.querySelector(".peel-flap")?.remove();
  journal.querySelector(".page").style.animation = "";
}

document.querySelectorAll(".scrap[data-entry]").forEach((item) => {
  let startX = 0;
  let startY = 0;

  item.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
  });

  item.addEventListener("pointerup", (e) => {
    if (Math.hypot(e.clientX - startX, e.clientY - startY) < 6) openEntry(item);
  });

  item.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openEntry(item);
    }
  });
});

journal.addEventListener("click", (e) => {
  if (e.target === journal) journal.close();
});

journal.addEventListener("close", () => {
  openedItem.classList.remove("is-ripping", "is-opening", "is-peeling");
  journalContent.replaceChildren();
  resetPeel(openedItem);
  openedItem.focus();
  openedItem = null;
});

function setupStacks(container) {
  container.querySelectorAll(".photo-stack").forEach((stack) => {
    const photos = [...stack.querySelectorAll(".entry-photo")];
    if (photos.length < 2) return;

    let order = photos.slice().reverse();
    const layout = () => order.forEach((p, i) => (p.dataset.pos = i));
    layout();

    const nav = document.createElement("div");
    nav.className = "stack-nav";
    nav.innerHTML = '<button type="button" aria-label="Previous photo">‹</button>' +
      '<button type="button" aria-label="Next photo">›</button>';
    stack.prepend(nav);
    const [prevBtn, nextBtn] = nav.querySelectorAll("button");

    const pullTime = reduceMotion ? 0 : 420;
    const settleTime = reduceMotion ? 0 : 450;
    let busy = false;

    function sendToBack(card, newOrder) {
      busy = true;
      card.classList.add("is-out");
      setTimeout(() => {
        order = newOrder;
        layout();
        card.classList.remove("is-out");
        if (reduceMotion) { busy = false; return; }
        card.classList.add("is-tucking");
        card.addEventListener("animationend", () => {
          card.classList.remove("is-tucking");
          busy = false;
        }, { once: true });
      }, pullTime);
    }

    function bringToFront(card, newOrder) {
      busy = true;
      card.classList.add("is-out");
      setTimeout(() => {
        order = newOrder;
        layout();
        card.classList.remove("is-out");
        setTimeout(() => (busy = false), settleTime);
      }, pullTime);
    }

    nextBtn.addEventListener("click", () => {
      if (busy) return;
      sendToBack(order[0], [...order.slice(1), order[0]]);
    });

    prevBtn.addEventListener("click", () => {
      if (busy) return;
      const bottom = order[order.length - 1];
      bringToFront(bottom, [bottom, ...order.slice(0, -1)]);
    });
  });
}