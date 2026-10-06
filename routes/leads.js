import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

const formatLead = (l) => ({
  id: String(l.id),
  name: l.name || "Anonymous Lead",
  phone: l.phone || "",
  email: l.email || "",
  subject: l.subject || "General Inquiry",
  message: l.message || "",
  status: l.status || "New",
  date: l.date || (l.created_at ? l.created_at.split("T")[0] : new Date().toISOString().split("T")[0]),
  created_at: l.created_at || new Date().toISOString(),
});

// GET /api/leads - Fetch leads from Supabase database
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch leads error:", error.message);
      return res.status(500).json({ success: false, message: "Failed to fetch leads from database" });
    }

    if (Array.isArray(data)) {
      const formatted = data.map(formatLead);
      return res.json({ success: true, count: formatted.length, data: formatted });
    }
    
    return res.json({ success: true, count: 0, data: [] });
  } catch (err) {
    console.error("Supabase fetch leads exception:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error while fetching leads" });
  }
});

// POST /api/leads - Create new lead with phone and email validation
router.post("/", async (req, res) => {
  const { name, phone, email, subject, message } = req.body;

  // Validation: Name
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "Full Name is required." });
  }

  // Validation: Phone (Strict 10-digit mobile number)
  const digitsOnly = (phone || "").replace(/\D/g, "");
  if (!digitsOnly || digitsOnly.length !== 10) {
    return res.status(400).json({
      success: false,
      message: "Invalid mobile number. Please enter a valid 10-digit mobile number.",
    });
  }

  // Validation: Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "Invalid email address. Please enter a valid email format.",
    });
  }

  const newLeadObj = {
    name: name.trim(),
    phone: digitsOnly,
    email: email.trim(),
    subject: (subject || "General Inquiry").trim(),
    message: (message || "").trim(),
    status: "New",
  };

  try {
    const { data, error } = await supabase
      .from("leads")
      .insert([newLeadObj])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ success: false, message: "Failed to save lead to database. Please ensure the 'leads' table is created." });
    }

    if (data && data.length > 0) {
      console.log("✅ New Lead saved to Supabase:", data[0].id);
      return res.status(201).json({ success: true, message: "Lead recorded successfully", data: formatLead(data[0]) });
    }
    
    return res.status(500).json({ success: false, message: "Failed to verify lead insertion." });
  } catch (err) {
    console.error("Supabase insert exception:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error while saving lead" });
  }
});

// PATCH /api/leads/:id - Update lead status ("New", "Contacted", "Closed")
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) {
      console.error("Supabase update status error:", error.message);
      return res.status(500).json({ success: false, message: "Failed to update lead status in database" });
    }
    res.json({ success: true, message: "Lead status updated", id, status });
  } catch (e) {
    console.error("Supabase update status exception:", e.message);
    res.status(500).json({ success: false, message: "Internal server error while updating status" });
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete error:", error.message);
      return res.status(500).json({ success: false, message: "Failed to delete lead from database" });
    }
    res.json({ success: true, message: "Lead deleted successfully", id });
  } catch (e) {
    console.error("Supabase delete exception:", e.message);
    res.status(500).json({ success: false, message: "Internal server error while deleting lead" });
  }
});

export default router;
