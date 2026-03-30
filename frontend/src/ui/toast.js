const STYLES = `
@keyframes toast-in {
  from { opacity: 0; transform: translateY(0.5rem); }
  to   { opacity: 1; transform: translateY(0); }
}
#toast-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 9999;
  pointer-events: none;
}
.toast-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: #fff;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  animation: toast-in 0.2s ease forwards;
  pointer-events: auto;
  max-width: 320px;
}
.toast-close {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 0.25rem;
}
.toast-close:hover { opacity: 1; }
`;

const COLORS = {
  success: "#15803d",
  error:   "#b91c1c",
  warn:    "#b45309",
};

const ICONS = {
  success: "✅",
  error:   "❌",
  warn:    "⚠️",
};

function ensureContainer() {
  let el = document.getElementById("toast-container");
  if (el) return el;

  const style = document.createElement("style");
  style.textContent = STYLES;
  document.head.appendChild(style);

  el = document.createElement("div");
  el.id = "toast-container";
  document.body.appendChild(el);
  return el;
}

function show(type, message) {
  const container = ensureContainer();

  const item = document.createElement("div");
  item.className = "toast-item";
  item.style.background = COLORS[type];

  const icon = document.createElement("span");
  icon.textContent = ICONS[type];

  const text = document.createElement("span");
  text.textContent = String(message);

  const close = document.createElement("button");
  close.className = "toast-close";
  close.setAttribute("aria-label", "Fechar");
  close.textContent = "×";

  item.append(icon, text, close);

  const timer = setTimeout(() => item.remove(), 3000);
  close.addEventListener("click", () => {
    clearTimeout(timer);
    item.remove();
  });

  container.appendChild(item);
}

export const toast = {
  success: (msg) => show("success", msg),
  error:   (msg) => show("error",   msg),
  warn:    (msg) => show("warn",    msg),
};
