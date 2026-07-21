const pageMenuButton = document.querySelector(".menu-toggle");
const pageNavigation = document.querySelector(".site-nav");

if (pageMenuButton && pageNavigation) {
  const closePageMenu = () => {
    pageMenuButton.setAttribute("aria-expanded", "false");
    pageNavigation.classList.remove("open");
    document.body.classList.remove("menu-open");
  };
  pageMenuButton.addEventListener("click", () => {
    const open = pageMenuButton.getAttribute("aria-expanded") !== "true";
    pageMenuButton.setAttribute("aria-expanded", String(open));
    pageNavigation.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
  });
  pageNavigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closePageMenu));
}

const pageYear = document.querySelector("#year");
if (pageYear) pageYear.textContent = new Date().getFullYear();
