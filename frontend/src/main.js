import "./style.css";
import "./handlers/index.js";
import { mountRouter } from "./router.js";

mountRouter(document.getElementById("app"));
