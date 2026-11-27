const menuToggle = document.querySelector(".menu-toggle");
const mainNavigation = document.querySelector(".main-nav");
const navigationLinks = document.querySelectorAll(".main-nav a");
const siteHeader = document.querySelector(".site-header");

function closeMenu(restoreFocus = false) {
  if (!menuToggle || !mainNavigation || menuToggle.getAttribute("aria-expanded") !== "true") return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menú de navegación");
  mainNavigation.classList.remove("is-open");
  document.body.classList.remove("mobile-menu-open");
  if (restoreFocus) menuToggle.focus();
}

if (menuToggle && mainNavigation && siteHeader) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
      return;
    }

    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Cerrar menú de navegación");
    mainNavigation.classList.add("is-open");
    document.body.classList.add("mobile-menu-open");
    requestAnimationFrame(() => mainNavigation.querySelector("a")?.focus({ preventScroll: true }));
  });

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu(true);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!siteHeader.contains(event.target)) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });
}

const currentYear = document.querySelector("#current-year");
if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}
