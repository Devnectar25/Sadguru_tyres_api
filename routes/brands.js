import { Router } from "express";
import { supabase } from "../config/supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "../data/brands.json");

const getLocalBrands = () => {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

// GET /api/brands
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("partner_brands").select("*").order("created_at", { ascending: true });
    if (error || !data || data.length === 0) {
      const fallback = getLocalBrands();
      return res.json({ success: true, count: fallback.length, source: "local", data: fallback });
    }
    res.json({ success: true, count: data.length, source: "supabase", data });
  } catch (err) {
    const fallback = getLocalBrands();
    res.json({ success: true, count: fallback.length, source: "local", data: fallback });
  }
});

// POST /api/brands
router.post("/", async (req, res) => {
  const newBrand = {
    id: req.body.id || `brand-${Date.now()}`,
    name: req.body.name,
    logo: req.body.logo,
    tagline: req.body.tagline || "",
    status: req.body.status || "Active",
  };

  try {
    await supabase.from("partner_brands").insert([newBrand]);
  } catch (err) {
    console.error("Supabase brand insert exception:", err);
  }

  res.status(201).json({ success: true, message: "Brand added successfully", data: newBrand });
});

export default router;
