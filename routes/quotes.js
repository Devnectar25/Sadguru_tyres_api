import { Router } from "express";
import { supabase } from "../config/supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "../data/quotes.json");

const getLocalQuotes = () => {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const saveLocalQuotes = (quotes) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(quotes, null, 2));
  } catch (err) {
    console.error("Error writing to local quotes file:", err);
  }
};

const formatQuote = (q) => ({
  id: q.id,
  tyreName: q.tyre_name || q.tyreName,
  tyre_name: q.tyre_name || q.tyreName,
  quantity: Number(q.quantity || 1),
  email: q.email,
  totalFormatted: q.total_formatted || q.totalFormatted,
  total_formatted: q.total_formatted || q.totalFormatted,
  created_at: q.created_at || new Date().toISOString(),
});

// GET /api/quotes
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("quote_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) console.error("Supabase fetch quotes error:", error);
      const fallback = getLocalQuotes().map(formatQuote);
      return res.json({ success: true, count: fallback.length, source: "local", data: fallback });
    }

    const formatted = data.map(formatQuote);
    res.json({ success: true, count: formatted.length, source: "supabase", data: formatted });
  } catch (err) {
    console.error("Fetch quotes exception:", err);
    const fallback = getLocalQuotes().map(formatQuote);
    res.json({ success: true, count: fallback.length, source: "local", data: fallback });
  }
});

// POST /api/quotes
router.post("/", async (req, res) => {
  const newQuotePayload = {
    tyre_name: req.body.tyreName || req.body.tyre_name || "Tyre Product",
    quantity: Number(req.body.quantity || 1),
    email: req.body.email || "customer@example.com",
    total_formatted: req.body.totalFormatted || req.body.total_formatted || "₹0",
  };

  let createdQuote = null;

  try {
    const { data, error } = await supabase
      .from("quote_inquiries")
      .insert([newQuotePayload])
      .select();

    if (error) {
      console.error("Supabase quote insert error:", error);
    } else if (data && data.length > 0) {
      createdQuote = data[0];
    }
  } catch (err) {
    console.error("Supabase quote insert exception:", err);
  }

  const localRecord = formatQuote(createdQuote || {
    id: `q_${Date.now()}`,
    ...newQuotePayload
  });

  const currentList = getLocalQuotes();
  currentList.unshift(localRecord);
  saveLocalQuotes(currentList);

  res.status(201).json({
    success: true,
    message: "Quote submitted successfully",
    data: localRecord,
  });
});

export default router;

