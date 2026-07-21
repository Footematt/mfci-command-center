const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const serviceSelect = document.querySelector('select[name="service"]');
const form = document.querySelector("#estimate-form");
const formNote = document.querySelector("#form-note");
const formButton = form.querySelector('button[type="submit"]');
let formStartedAt = Date.now();

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

function resizeProjectPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("One of the selected photos could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("One of the selected files is not a supported photo."));
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL("image/jpeg", 0.76);
        if (data.length > 590000) return reject(new Error("A selected photo is still too large. Please choose a smaller image."));
        resolve({ name: file.name, type: "image/jpeg", data });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const selectedPhotos = Array.from(values.getAll("photos")).filter((file) => file && file.size);
  if (selectedPhotos.length > 3) {
    formNote.textContent = "Please select no more than three photos.";
    formNote.className = "form-note error";
    return;
  }
  if (selectedPhotos.some((file) => file.size > 12 * 1024 * 1024)) {
    formNote.textContent = "Each original photo must be smaller than 12 MB.";
    formNote.className = "form-note error";
    return;
  }

  formButton.disabled = true;
  formButton.textContent = "Sending…";
  formNote.textContent = selectedPhotos.length ? "Preparing your photos and sending your request…" : "Sending your request…";
  formNote.className = "form-note";
  try {
    const images = await Promise.all(selectedPhotos.map(resizeProjectPhoto));
    const response = await fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.get("name"),
        phone: values.get("phone"),
        email: values.get("email"),
        location: values.get("location"),
        service: values.get("service"),
        details: values.get("details"),
        website: values.get("website"),
        consent: values.get("consent") === "on",
        startedAt: formStartedAt,
        images,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your request could not be sent right now.");
    form.reset();
    formStartedAt = Date.now();
    formNote.textContent = "Thank you — your estimate request was received. Our team will contact you to discuss the next step.";
    formNote.className = "form-note success";
  } catch (error) {
    formNote.textContent = `${error.message} You can also call or text 647-213-4236.`;
    formNote.className = "form-note error";
  } finally {
    formButton.disabled = false;
    formButton.textContent = "Send estimate request";
  }
});

const requestedService = new URLSearchParams(window.location.search).get("service");
if (requestedService && Array.from(serviceSelect.options).some((option) => option.value === requestedService)) {
  serviceSelect.value = requestedService;
}

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
