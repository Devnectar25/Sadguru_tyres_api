import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "../data/quotes.json");

const getQuotes = () => {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const saveQuotes = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
};

// GET /api/quotes
router.get("/", (req, res) => {
  const quotes = getQuotes();
  res.json({ success: true, count: quotes.length, data: quotes });
});

// POST /api/quotes
router.post("/", (req, res) => {
  const quotes = getQuotes();
  const newQuote = {
    id: `q-${Date.now()}`,
    ...req.body,
  };
  quotes.unshift(newQuote);
  saveQuotes(quotes);
  res.status(201).json({ success: true, message: "Quote submitted successfully", data: newQuote });
});

export default router;
