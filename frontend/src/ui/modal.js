// frontend/src/ui/modal.js
let overlay = null;
let sheet = null;
let resolvePromise = null;

function inject() {
  if (overlay) return;

  overlay = document.createElement("div");
  overlay.id = "modal-overlay";
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:50;display:none;";

  sheet = document.createElement("div");
  sheet.id = "modal-sheet";
  sheet.style.cssText = [
    "position:fixed;bottom:0;left:0;right:0;",
    "background:#1e293b;border-top:1px solid #334155;",
    "border-top-left-radius:16px;border-top-right-radius:16px;",
    "padding:20px;z-index:51;",
    "transform:translateY(100%);transition:transform 200ms ease-out;",
  ].join("");

  sheet.innerHTML = `
    <div style="width:40px;height:4px;background:#475569;border-radius:2px;margin:0 auto 16px;"></div>
    <p id="modal-msg" style="color:#f1f5f9;font-weight:600;margin:0 0 4px;font-size:0.95rem;"></p>
    <p style="color:#94a3b8;font-size:0.8rem;margin:0 0 16px;">Esta ação não pode ser desfeita.</p>
    <div style="display:flex;gap:8px;">
      <button id="modal-cancel" type="button" style="flex:1;background:#1e293b;border:1px solid #475569;color:#cbd5e1;padding:10px;border-radius:8px;font-size:0.85rem;cursor:pointer;">Cancelar</button>
      <button id="modal-confirm" type="button" style="flex:1;background:#dc2626;border:none;color:#fff;padding:10px;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;">Confirmar exclusão</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(sheet);

  overlay.addEventListener("click", () => close(false));
  document.getElementById("modal-cancel").addEventListener("click", () => close(false));
  document.getElementById("modal-confirm").addEventListener("click", () => close(true));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.style.display !== "none") close(false);
  });
}

function close(result) {
  sheet.style.transition = "transform 150ms ease-in";
  sheet.style.transform = "translateY(100%)";
  setTimeout(() => {
    overlay.style.display = "none";
    sheet.style.transition = "transform 200ms ease-out";
    if (resolvePromise) {
      resolvePromise(result);
      resolvePromise = null;
    }
  }, 150);
}

export const modal = {
  confirm(message) {
    inject();
    document.getElementById("modal-msg").textContent = message;
    overlay.style.display = "block";
    requestAnimationFrame(() => {
      sheet.style.transform = "translateY(0)";
    });
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  },
};
