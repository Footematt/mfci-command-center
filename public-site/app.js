const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const serviceSelect = document.querySelector('select[name="service"]');
const form = document.querySelector("#estimate-form");

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  navigation.classList.remove("open");
  document.body.classList.remove("menu-open");
}

menuButton.addEventListener("click", () => {
  const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(willOpen));
  navigation.classList.toggle("open", willOpen);
  document.body.classList.toggle("menu-open", willOpen);
});

navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

window.addEventListener(
  "scroll",
  () => header.classList.toggle("scrolled", window.scrollY > 20),
  { passive: true },
);

document.querySelectorAll("[data-service-link]").forEach((link) => {
  link.addEventListener("click", () => {
    serviceSelect.value = link.dataset.serviceLink;
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const values = new FormData(form);
  const subject = `Estimate request: ${values.get("service")}`;
  const body = [
    "Hello M. Foote's Contracting Inc.,",
    "",
    "I would like to request an estimate.",
    "",
    `Name: ${values.get("name")}`,
    `Phone: ${values.get("phone")}`,
    `Email: ${values.get("email")}`,
    `Project location: ${values.get("location") || "Not provided"}`,
    `Service: ${values.get("service")}`,
    "",
    "Project details:",
    values.get("details"),
    "",
    "Please contact me to discuss the next steps.",
  ].join("\n");

  window.location.href = `mailto:mfootescontractinginc@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

const galleryItems = Array.from(document.querySelectorAll(".project-gallery-item"));
const galleryFilters = Array.from(document.querySelectorAll("[data-gallery-filter]"));
const galleryToggle = document.querySelector("#galleryToggle");
const galleryStatus = document.querySelector("#galleryStatus");
const galleryLimit = 12;
let activeGalleryFilter = "all";
let galleryExpanded = false;

function renderGallery() {
  const matches = galleryItems.filter(
    (item) => activeGalleryFilter === "all" || item.dataset.category === activeGalleryFilter,
  );

  let visibleIndex = 0;
  galleryItems.forEach((item) => {
    const matchesFilter = activeGalleryFilter === "all" || item.dataset.category === activeGalleryFilter;
    const shouldShow = matchesFilter && (galleryExpanded || visibleIndex < galleryLimit);
    item.hidden = !shouldShow;
    if (matchesFilter) visibleIndex += 1;
  });

  const visibleCount = galleryExpanded ? matches.length : Math.min(matches.length, galleryLimit);
  galleryStatus.textContent = `Showing ${visibleCount} of ${matches.length} project photos`;
  galleryToggle.hidden = matches.length <= galleryLimit;
  galleryToggle.setAttribute("aria-expanded", String(galleryExpanded));
  galleryToggle.textContent = galleryExpanded ? "Show fewer photos" : `Show all ${matches.length} photos`;
}

galleryFilters.forEach((button) => {
  button.addEventListener("click", () => {
    activeGalleryFilter = button.dataset.galleryFilter;
    galleryExpanded = false;
    galleryFilters.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    renderGallery();
  });
});

galleryToggle.addEventListener("click", () => {
  galleryExpanded = !galleryExpanded;
  renderGallery();
});

renderGallery();

document.querySelector("#year").textContent = new Date().getFullYear();
