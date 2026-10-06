import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

const formatService = (s) => ({
  id: s.id,
  name: s.name,
  description: s.description || "",
  priceINR: Number(s.price_inr || s.priceINR || 0),
  price_inr: Number(s.price_inr || s.priceINR || 0),
  duration: s.duration || "30 Mins",
  category: s.category || "General Maintenance",
  image: s.image || "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
  status: s.status || "Active",
  created_at: s.created_at || new Date().toISOString(),
});

// GET /api/services - Fetch all services directly from Supabase database
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase fetch services error:", error.message);
      return res.status(500).json({ success: false, message: error.message, data: [] });
    }

    const formatted = (data || []).map(formatService);
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error("Fetch services exception:", err.message);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
});

// GET /api/services/:id - Fetch single service by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    res.json({ success: true, data: formatService(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/services - Store new service directly in database
router.post("/", async (req, res) => {
  const newServicePayload = {
    id: req.body.id || `srv-${Date.now()}`,
    name: req.body.name,
    description: req.body.description || "",
    price_inr: Number(req.body.priceINR || req.body.price_inr || 0),
    duration: req.body.duration || "30 Mins",
    category: req.body.category || "General Maintenance",
    image: req.body.image || "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
    status: req.body.status || "Active",
  };

  if (!newServicePayload.name) {
    return res.status(400).json({ success: false, message: "Service name is required" });
  }

  try {
    const { data, error } = await supabase
      .from("services")
      .insert([newServicePayload])
      .select();

    if (error) {
      console.error("Supabase insert service error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(201).json({
      success: true,
      message: "Service created successfully in database",
      data: formatService(data[0] || newServicePayload),
    });
  } catch (err) {
    console.error("Supabase insert service exception:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/services/:id - Update existing service in database
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updatePayload = {
    name: req.body.name,
    description: req.body.description,
    price_inr: req.body.priceINR != null ? Number(req.body.priceINR) : (req.body.price_inr != null ? Number(req.body.price_inr) : undefined),
    duration: req.body.duration,
    category: req.body.category,
    image: req.body.image,
    status: req.body.status,
  };

  Object.keys(updatePayload).forEach((key) => updatePayload[key] === undefined && delete updatePayload[key]);

  try {
    const { data, error } = await supabase
      .from("services")
      .update(updatePayload)
      .eq("id", id)
      .select();

    if (error || !data || data.length === 0) {
      return res.status(404).json({ success: false, message: error ? error.message : "Service not found" });
    }

    res.json({
      success: true,
      message: "Service updated in database",
      data: formatService(data[0]),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/services/:id - Delete service from database
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ success: true, message: "Service deleted from database", id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
