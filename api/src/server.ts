import { createApp } from "./app.js";
import { isAiConfigured, readAiConfig } from "./quizService.js";

const port = Number(process.env.PORT ?? 3001);
const app = createApp();

app.listen(port, () => {
  const aiOn = isAiConfigured(readAiConfig());
  // eslint-disable-next-line no-console
  console.log(
    `Learning app API listening on http://localhost:${port} ` +
      `(AI ${aiOn ? "enabled" : "disabled — using offline generator"})`
  );
});
