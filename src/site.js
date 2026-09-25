const toggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.dataset.open = String(open);
  });

  nav.addEventListener("click", event => {
    if (event.target.closest("a")) {
      toggle.setAttribute("aria-expanded", "false");
      nav.dataset.open = "false";
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      toggle.setAttribute("aria-expanded", "false");
      nav.dataset.open = "false";
      toggle.focus();
    }
  });
}

const copyButton = document.querySelector("[data-copy-email]");
const copyStatus = document.querySelector("[data-copy-status]");

if (copyButton && copyStatus) {
  copyButton.addEventListener("click", async () => {
    const address = copyButton.dataset.copyEmail;
    try {
      await navigator.clipboard.writeText(address);
      copyStatus.textContent = "Email address copied.";
    } catch {
      copyStatus.textContent = address;
    }
  });
}