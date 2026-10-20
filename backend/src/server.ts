import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

// Base middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
