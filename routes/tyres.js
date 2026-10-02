import { Router } from "express";
import { supabase } from "../config/supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "../data/tyres.json");

const getLocalTyres = () => {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

// GET /api/tyres
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("tyre_products").select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) {
      const fallback = getLocalTyres();
      return res.json({ success: true, count: fallback.length, source: "local", data: fallback });
    }
    res.json({ success: true, count: data.length, source: "supabase", data });
  } catch (err) {
    const fallback = getLocalTyres();
    res.json({ success: true, count: fallback.length, source: "local", data: fallback });
  }
});

// POST /api/tyres
router.post("/", async (req, res) => {
  const newTyre = {
    id: req.body.id || `tyre-${Date.now()}`,
    name: req.body.name,
    brand: req.body.brand || "Sadguru Apex",
    vehicle_type: req.body.vehicleType || "Cars",
    tyre_type: req.body.tyreType || "All-Season",
    performance_level: req.body.performanceLevel || "High Performance",
    width: req.body.width || "225",
    profile: req.body.profile || "45",
    rim_size: req.body.rimSize || "17",
    category: req.body.category || "Passenger Tyre",
    badge: req.body.badge || "Featured",
    price_inr: req.body.priceINR || 12500,
    price_usd: req.body.priceUSD || 195,
    stock: req.body.stock || 30,
    image: req.body.image || "/images/tyre_sport.jpg",
    tagline: req.body.tagline || "",
  };

  try {
    const { data, error } = await supabase.from("tyre_products").insert([newTyre]).select();
    if (error) {
      console.error("Supabase insert error:", error.message);
    }
  } catch (err) {
    console.error("Supabase insert exception:", err);
  }

  res.status(201).json({ success: true, message: "Tyre created successfully", data: newTyre });
});

export default router;
