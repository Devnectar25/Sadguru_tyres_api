import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

// GET /api/faqs - Retrieve all FAQs directly from database
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ success: true, count: data ? data.length : 0, source: "database", data: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/faqs - Create a new FAQ entry directly in database
router.post("/", async (req, res) => {
  const { id, question, answer, category, status } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ success: false, message: "Question and Answer are required" });
  }

  const newFaq = {
    id: id || `faq_${Date.now()}`,
    question,
    answer,
    category: category || "General",
    status: status || "Active",
  };

  try {
    const { data, error } = await supabase.from("faqs").insert([newFaq]).select();
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    res.status(201).json({ success: true, message: "FAQ created in database", data: (data && data[0]) || newFaq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/faqs/:id - Update FAQ entry directly in database
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  try {
    const { data, error } = await supabase.from("faqs").update(updates).eq("id", id).select();
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ success: true, message: "FAQ updated in database", data: (data && data[0]) || updates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/faqs/:id - Delete FAQ entry directly from database
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ success: true, message: "FAQ deleted from database", id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
