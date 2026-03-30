import app from "./app.js";

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`API em http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Porta ${PORT} já está em uso. Encerre o outro Node (ex.: outro terminal com a API) ou rode com outra porta:\n  $env:PORT=3002; npm run dev`
    );
    process.exit(1);
  }
  throw err;
});
