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