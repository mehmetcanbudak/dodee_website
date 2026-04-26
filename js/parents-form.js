/**
 * Client-side validation and success state. Wire to your email / CRM later.
 * @param {HTMLElement} root
 */
export function initParentsForm(root) {
  const form = root.querySelector("form");
  const status = root.querySelector("[data-parents-status]");
  const submitBtn = root.querySelector("[data-parents-submit]");

  if (!form) return;

  const email = form.querySelector("#fp-email");
  const name = form.querySelector("#fp-name");

  const clearStatus = () => {
    if (status) {
      status.hidden = true;
      status.textContent = "";
      status.removeAttribute("data-error");
    }
  };

  form.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", () => {
      el.removeAttribute("aria-invalid");
      if (submitBtn) submitBtn.disabled = false;
      clearStatus();
    });
    el.addEventListener("change", () => {
      el.removeAttribute("aria-invalid");
      clearStatus();
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameVal = name instanceof HTMLInputElement ? name.value.trim() : "";
    const emailVal = email instanceof HTMLInputElement ? email.value.trim() : "";
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    const age = form.querySelector("#fp-age");
    const lang = form.querySelector("#fp-lang");
    const ageVal = age instanceof HTMLSelectElement ? age.value : "";
    const langVal = lang instanceof HTMLSelectElement ? lang.value : "";

    let firstInvalid = null;

    if (!nameVal) {
      if (name) {
        name.setAttribute("aria-invalid", "true");
        firstInvalid = name;
      }
    }
    if (!emailOk) {
      if (email) {
        email.setAttribute("aria-invalid", "true");
        firstInvalid = firstInvalid || email;
      }
    }
    if (!ageVal) {
      if (age instanceof HTMLSelectElement) {
        age.setAttribute("aria-invalid", "true");
        firstInvalid = firstInvalid || age;
      }
    }
    if (!langVal) {
      if (lang instanceof HTMLSelectElement) {
        lang.setAttribute("aria-invalid", "true");
        firstInvalid = firstInvalid || lang;
      }
    }

    if (firstInvalid) {
      if (status) {
        status.textContent = "Please check the highlighted fields and try again.";
        status.hidden = false;
        status.dataset.error = "true";
      }
      firstInvalid.focus();
      return;
    }

    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    if (submitBtn) submitBtn.disabled = true;
    if (status) {
      status.textContent =
        "You’re in! We’ll be in touch soon. (Demo — connect an email service to send real messages.)";
      status.hidden = false;
      status.dataset.error = "false";
      status.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}
