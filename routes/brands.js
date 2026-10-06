import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

// GET /api/brands - Fetch all partner brands directly from Supabase database
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("partner_brands")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase fetch brands error:", error.message);
      return res.status(500).json({ success: false, message: error.message, data: [] });
    }

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("Fetch brands exception:", err.message);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
});

// POST /api/brands - Insert brand into Supabase database
router.post("/", async (req, res) => {
  const newBrand = {
    id: req.body.id || `brand-${Date.now()}`,
    name: req.body.name,
    logo: req.body.logo,
    tagline: req.body.tagline || "",
    status: req.body.status || "Active",
  };

  try {
    const { data, error } = await supabase.from("partner_brands").insert([newBrand]).select();
    if (error) {
      console.error("Supabase brand insert error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
    res.status(201).json({ success: true, message: "Brand added to database", data: data[0] || newBrand });
  } catch (err) {
    console.error("Supabase brand insert exception:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/brands/:id - Update brand in database
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updatePayload = {
    name: req.body.name,
    logo: req.body.logo,
    tagline: req.body.tagline,
    status: req.body.status,
  };

  Object.keys(updatePayload).forEach((key) => updatePayload[key] === undefined && delete updatePayload[key]);

  try {
    const { data, error } = await supabase.from("partner_brands").update(updatePayload).eq("id", id).select();
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ success: true, message: "Brand updated in database", data: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/brands/:id - Delete brand from database
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("partner_brands").delete().eq("id", id);
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ success: true, message: "Brand deleted from database", id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
