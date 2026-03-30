import { toast } from "../ui/toast.js";
import {
  handleCreateClient,
  handleUpdateClient,
  handleEditClient,
  handleCancelEditClient,
  handleDeleteClient,
} from "./clients.js";
import {
  handleCreateSubscription,
  handleUpdateSubscription,
  handleEditSubscription,
  handleCancelEditSubscription,
} from "./subscriptions.js";
import {
  handleCreateAppointment,
  handleUpdateAppointment,
  handleEditAppointment,
  handleCancelEditAppointment,
  handleFilterAppointments,
  handleCompleteAppointment,
  handleCancelAppointment,
} from "./appointments.js";
import { handleCreatePayment } from "./payments.js";
import {
  handleCreateService,
  handleUpdateService,
  handleEditService,
  handleCancelEditService,
  handleToggleService,
} from "./services.js";

document.addEventListener("submit", async (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  const kind = form.dataset.form;
  if (!kind) return;
  e.preventDefault();
  const btn = form.querySelector('[type="submit"]');
  const originalText = btn ? btn.textContent : null;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Salvando...";
  }
  try {
    if (kind === "create-client")             await handleCreateClient(e);
    else if (kind === "update-client")        await handleUpdateClient(e);
    else if (kind === "create-appointment")   await handleCreateAppointment(e);
    else if (kind === "update-appointment")   await handleUpdateAppointment(e);
    else if (kind === "create-subscription")  await handleCreateSubscription(e);
    else if (kind === "update-subscription")  await handleUpdateSubscription(e);
    else if (kind === "create-payment")       await handleCreatePayment(e);
    else if (kind === "create-service")       await handleCreateService(e);
    else if (kind === "update-service")       await handleUpdateService(e);
  } catch (err) {
    toast.error(err.message || String(err));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  try {
    if (action === "edit-client")                   await handleEditClient(btn);
    else if (action === "cancel-edit-client")            handleCancelEditClient();
    else if (action === "edit-subscription")         await handleEditSubscription(btn);
    else if (action === "cancel-edit-subscription")      handleCancelEditSubscription();
    else if (action === "delete-client")             await handleDeleteClient(btn);
    else if (action === "edit-appointment")          await handleEditAppointment(btn);
    else if (action === "cancel-edit-appointment")       handleCancelEditAppointment();
    else if (action === "filter-appointments")           handleFilterAppointments(btn);
    else if (action === "complete-appointment")      await handleCompleteAppointment(btn);
    else if (action === "cancel-appointment")        await handleCancelAppointment(btn);
    else if (action === "edit-service")              await handleEditService(btn);
    else if (action === "cancel-edit-service")           handleCancelEditService();
    else if (action === "toggle-service")            await handleToggleService(btn);
  } catch (err) {
    toast.error(err.message || String(err));
  }
});
