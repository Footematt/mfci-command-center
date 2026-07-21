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

document.querySelector("#year").textContent = new Date().getFullYear();
