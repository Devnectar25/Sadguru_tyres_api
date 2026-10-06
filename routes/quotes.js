import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

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

// GET /api/quotes - Fetch directly from Supabase database
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("quote_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch quotes error:", error.message);
      return res.status(500).json({ success: false, message: error.message, data: [] });
    }

    const formatted = data.map(formatQuote);
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error("Fetch quotes exception:", err.message);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
});

// POST /api/quotes - Store DIRECTLY in Supabase Database
router.post("/", async (req, res) => {
  const newQuotePayload = {
    tyre_name: req.body.tyreName || req.body.tyre_name || "Tyre Product",
    quantity: Number(req.body.quantity || 1),
    email: req.body.email || "customer@example.com",
    total_formatted: req.body.totalFormatted || req.body.total_formatted || "₹0",
  };

  try {
    const { data, error } = await supabase
      .from("quote_inquiries")
      .insert([newQuotePayload])
      .select();

    if (error) {
      console.error("❌ Supabase quote insert error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    const createdQuote = formatQuote(data[0]);
    console.log("✅ Quote stored DIRECTLY in Supabase Database:", createdQuote.id);

    return res.status(201).json({
      success: true,
      message: "Quote stored directly in database",
      data: createdQuote,
    });
  } catch (err) {
    console.error("❌ Supabase quote insert exception:", err.message);
    return res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// DELETE /api/quotes/:id - Delete quote inquiry from database
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("quote_inquiries").delete().eq("id", id);
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ success: true, message: "Quote deleted from database", id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
