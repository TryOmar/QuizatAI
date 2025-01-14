/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('success' or 'error')
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = "success", duration = 3000) {
  const existingToast = document.querySelector(".toast");
  if (existingToast) existingToast.remove();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas fa-${
      type === "success" ? "check-circle" : "exclamation-circle"
    }"></i>
    ${message}
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
