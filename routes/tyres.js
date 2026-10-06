import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

// GET /api/tyres - Fetch all tyre products directly from Supabase database
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tyre_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch tyres error:", error.message);
      return res.status(500).json({ success: false, message: error.message, data: [] });
    }

    const mappedData = data.map(t => ({
      ...t,
      image2: t.visual_specs?.image2 || "",
      image3: t.visual_specs?.image3 || ""
    }));

    res.json({ success: true, count: data.length, data: mappedData });
  } catch (err) {
    console.error("Fetch tyres exception:", err.message);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
});

// GET /api/tyres/:id - Fetch single tyre by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("tyre_products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: "Tyre not found" });
    }

    const mappedData = {
      ...data,
      image2: data.visual_specs?.image2 || "",
      image3: data.visual_specs?.image3 || ""
    };

    res.json({ success: true, data: mappedData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tyres - Store new tyre directly in database
router.post("/", async (req, res) => {
  const newTyre = {
    id: req.body.id || `tyre-${Date.now()}`,
    name: req.body.name,
    brand: req.body.brand || "Sadguru Apex",
    vehicle_type: req.body.vehicleType || req.body.vehicle_type || "Cars",
    tyre_type: req.body.tyreType || req.body.tyre_type || "All-Season",
    performance_level: req.body.performanceLevel || req.body.performance_level || "High Performance",
    width: String(req.body.width || "225"),
    profile: String(req.body.profile || "45"),
    rim_size: String(req.body.rimSize || req.body.rim_size || "17"),
    category: req.body.category || "Passenger Tyre",
    badge: req.body.badge || "Featured",
    price_inr: Number(req.body.priceINR || req.body.price_inr || 12500),
    price_usd: Number(req.body.priceUSD || req.body.price_usd || 195),
    stock: Number(req.body.stock || 30),
    image: req.body.image || "/images/tyre_sport.jpg",
    tagline: req.body.tagline || "",
    visual_specs: {
      ...(req.body.visual_specs || {}),
      image2: req.body.image2 || "",
      image3: req.body.image3 || ""
    },
  };

  try {
    const { data, error } = await supabase.from("tyre_products").insert([newTyre]).select();
    if (error) {
      console.error("Supabase insert tyre error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
    res.status(201).json({ success: true, message: "Tyre stored in database", data: data[0] || newTyre });
  } catch (err) {
    console.error("Supabase insert tyre exception:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/tyres/:id - Update tyre product in database
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updatePayload = {
    name: req.body.name,
    brand: req.body.brand,
    vehicle_type: req.body.vehicleType || req.body.vehicle_type,
    tyre_type: req.body.tyreType || req.body.tyre_type,
    performance_level: req.body.performanceLevel || req.body.performance_level,
    width: req.body.width != null ? String(req.body.width) : undefined,
    profile: req.body.profile != null ? String(req.body.profile) : undefined,
    rim_size: req.body.rimSize != null ? String(req.body.rimSize) : (req.body.rim_size != null ? String(req.body.rim_size) : undefined),
    category: req.body.category,
    badge: req.body.badge,
    price_inr: req.body.priceINR != null ? Number(req.body.priceINR) : (req.body.price_inr != null ? Number(req.body.price_inr) : undefined),
    price_usd: req.body.priceUSD != null ? Number(req.body.priceUSD) : (req.body.price_usd != null ? Number(req.body.price_usd) : undefined),
    stock: req.body.stock != null ? Number(req.body.stock) : undefined,
    image: req.body.image,
    tagline: req.body.tagline,
    visual_specs: req.body.visual_specs || {},
  };

  if (req.body.image2 !== undefined) updatePayload.visual_specs.image2 = req.body.image2;
  if (req.body.image3 !== undefined) updatePayload.visual_specs.image3 = req.body.image3;

  // Remove undefined properties
  Object.keys(updatePayload).forEach((key) => updatePayload[key] === undefined && delete updatePayload[key]);

  try {
    const { data, error } = await supabase.from("tyre_products").update(updatePayload).eq("id", id).select();
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    const mappedData = {
      ...data[0],
      image2: data[0].visual_specs?.image2 || "",
      image3: data[0].visual_specs?.image3 || ""
    };
    res.json({ success: true, message: "Tyre updated in database", data: mappedData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/tyres/:id - Delete tyre product from database
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("tyre_products").delete().eq("id", id);
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ success: true, message: "Tyre deleted from database", id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
