// Vercel serverless function entry point.
// Every request under /api/* is forwarded to the Express app defined in ../server.ts,
// so the simulation API works without a long-lived Node server.
import { app } from "../server";

export default app;
