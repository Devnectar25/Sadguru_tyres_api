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

// Helper to upload base64 images directly into Supabase Storage bucket
async function uploadBase64ToSupabase(imgStr, bucketName = "brands") {
  if (!imgStr || typeof imgStr !== "string") return imgStr;
  if (!imgStr.startsWith("data:image/")) return imgStr;

  try {
    const match = imgStr.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!match) return imgStr;

    const rawExt = match[1].toLowerCase();
    const mimeExt = rawExt === "jpeg" ? "jpg" : rawExt;
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `brand_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${mimeExt}`;

    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, buffer, {
      contentType: `image/${rawExt}`,
      upsert: true,
    });

    if (error) {
      console.error(`Supabase storage upload error for bucket ${bucketName}:`, error.message);
      return imgStr;
    }

    const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return publicData?.publicUrl || imgStr;
  } catch (err) {
    console.error("Storage upload exception:", err.message);
    return imgStr;
  }
}

// POST /api/brands - Insert brand into Supabase database
router.post("/", async (req, res) => {
  const processedLogo = await uploadBase64ToSupabase(req.body.logo, "brands");

  const newBrand = {
    id: req.body.id || `brand-${Date.now()}`,
    name: req.body.name,
    logo: processedLogo,
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

  let processedLogo = undefined;
  if (req.body.logo !== undefined) {
    processedLogo = await uploadBase64ToSupabase(req.body.logo, "brands");
  }

  const updatePayload = {
    name: req.body.name,
    logo: processedLogo,
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
