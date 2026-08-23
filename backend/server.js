import express from "express"
const app = express();
import dotenv from "dotenv"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import sessionsRouter from "./src/routes/sessions.js"
import pollsRouter from "./src/routes/polls.js"
import responsesRouter from "./src/routes/responses.js"

dotenv.config()
const PORT = process.env.SERVER_PORT;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use("/api/sessions", sessionsRouter)
app.use("/api/polls", pollsRouter)
app.use("/api/responses", responsesRouter)




app.listen(PORT, () => {
  console.log(`Server Backend aktif di http://localhost:${PORT}`);
});
