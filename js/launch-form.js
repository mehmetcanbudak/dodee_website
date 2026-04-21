/**
 * Placeholder: client-side validation only. Wire to Formspree / Resend / etc. later.
 *
 * @param {HTMLElement} root
 */
export function initLaunchForm(root) {
  const form = root.querySelector("form");
  const email = root.querySelector("[data-launch-email]");
  const status = root.querySelector("[data-launch-status]");
  const submitBtn = root.querySelector("[data-launch-submit]");

  if (!form || !(email instanceof HTMLInputElement)) return;

  email.addEventListener("input", () => {
    email.removeAttribute("aria-invalid");
    if (submitBtn) submitBtn.disabled = false;
    if (status && !status.hidden) {
      status.hidden = true;
      status.textContent = "";
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = email.value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    if (!ok) {
      if (status) {
        status.textContent = "Please enter a valid email address.";
        status.hidden = false;
        status.dataset.error = "true";
      }
      email.setAttribute("aria-invalid", "true");
      return;
    }

    email.removeAttribute("aria-invalid");
    if (submitBtn) submitBtn.disabled = true;
    if (status) {
      status.textContent =
        "You’re on the list! (Demo mode — connect an email provider to send real messages.)";
      status.hidden = false;
      status.dataset.error = "false";
    }
  });
}
