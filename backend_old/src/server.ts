import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { TradingAgent } from "./agent";
import { getConfig } from "./config/config";
import winston from "winston";
import { SocialSignalsCron } from "./cron/socialSignals";
import { AgentPersona } from "./types/agent";

// Setup logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

// Initialize agent
const config = getConfig();
const agent = new TradingAgent(config);

// Initialize social signals cron job
const socialSignalsCron = new SocialSignalsCron();
socialSignalsCron.start();

// Cleanup on server shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  socialSignalsCron.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  socialSignalsCron.stop();
  process.exit(0);
});

// Routes


// Get agent's holdings
app.get("/api/agent/:agentId/holdings", async (req, res) => {
  try {
    const holdings = await agent.wallet.getHoldings();
    logger.info(`Agent holdings: ${JSON.stringify(holdings)}`);
    res.json(holdings);
  } catch (error) {
    logger.error("Failed to get holdings:", error);
    res.status(500).json({ success: false, error: "Failed to get holdings" });
  }
});

// Get agent's portfolio
app.get("/api/agent/:agentId/portfolio", async (req, res) => {
  try {
    const portfolio = await agent.wallet.getBalance();
    res.json({
      id: req.params.agentId,
      agent_id: req.params.agentId,
      start_time: new Date().toISOString(),
      start_usd: portfolio.total,
      start_native: portfolio.total,
      curr_realised_usd: portfolio.available,
      curr_realised_native: portfolio.available,
      curr_unrealised_usd: portfolio.total - portfolio.available,
      curr_unrealised_native: portfolio.total - portfolio.available,
      dry_run: false,
    });
  } catch (error) {
    logger.error("Failed to get portfolio:", error);
    res.status(500).json({ success: false, error: "Failed to get portfolio" });
  }
});

// Get agent's trades
app.get("/api/agent/:agentId/trades", async (req, res) => {
  try {
    const trades = await agent.wallet.getTrades();
    res.json(trades);
  } catch (error) {
    logger.error("Failed to get trades:", error);
    res.status(500).json({ success: false, error: "Failed to get trades" });
  }
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Unhandled error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
