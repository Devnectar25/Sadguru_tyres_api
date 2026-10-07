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

    const mappedData = data.map(t => {
      const isShow = t.show_on_home !== undefined
        ? Boolean(t.show_on_home)
        : (t.visual_specs?.show_on_home !== undefined ? Boolean(t.visual_specs.show_on_home) : false);
      return {
        ...t,
        image2: t.visual_specs?.image2 || "",
        image3: t.visual_specs?.image3 || "",
        showOnHome: isShow,
        show_on_home: isShow
      };
    });

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

    const isShow = data.show_on_home !== undefined
      ? Boolean(data.show_on_home)
      : (data.visual_specs?.show_on_home !== undefined ? Boolean(data.visual_specs.show_on_home) : false);

    const mappedData = {
      ...data,
      image2: data.visual_specs?.image2 || "",
      image3: data.visual_specs?.image3 || "",
      showOnHome: isShow,
      show_on_home: isShow
    };

    res.json({ success: true, data: mappedData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper to upload base64 images directly into Supabase Storage bucket
async function uploadBase64ToSupabase(imgStr, bucketName = "tyres_products") {
  if (!imgStr || typeof imgStr !== "string") return imgStr;
  if (!imgStr.startsWith("data:image/")) return imgStr;

  try {
    const match = imgStr.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!match) return imgStr;

    const rawExt = match[1].toLowerCase();
    const mimeExt = rawExt === "jpeg" ? "jpg" : rawExt;
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `tyre_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${mimeExt}`;

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

// POST /api/tyres - Store new tyre directly in database
router.post("/", async (req, res) => {
  const processedImage = await uploadBase64ToSupabase(req.body.image, "tyres_products");
  const processedImage2 = await uploadBase64ToSupabase(req.body.image2, "tyres_products");
  const processedImage3 = await uploadBase64ToSupabase(req.body.image3, "tyres_products");

  const showOnHome = req.body.showOnHome !== undefined ? req.body.showOnHome : (req.body.show_on_home !== undefined ? req.body.show_on_home : true);

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
    image: processedImage || "/images/tyre_sport.jpg",
    tagline: req.body.tagline || "",
    description: req.body.description || null,
    specs: req.body.specs || {},
    available_sizes: req.body.availableSizes || req.body.available_sizes || [],
    highlights: req.body.highlights || [],
    rating: Number(req.body.rating || 4.8),
    reviews_count: Number(req.body.reviewsCount || req.body.reviews_count || 1),
    date_added: req.body.dateAdded || req.body.date_added || new Date().toISOString().split("T")[0],
    visual_specs: {
      ...(req.body.visual_specs || {}),
      image2: processedImage2 || "",
      image3: processedImage3 || "",
      show_on_home: showOnHome
    },
  };

  try {
    const { data, error } = await supabase.from("tyre_products").insert([newTyre]).select();
    if (error) {
      console.error("Supabase insert tyre error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
    const isShow = data[0].show_on_home !== undefined
      ? Boolean(data[0].show_on_home)
      : (data[0].visual_specs?.show_on_home !== undefined ? Boolean(data[0].visual_specs.show_on_home) : false);
    const created = {
      ...data[0],
      image2: data[0].visual_specs?.image2 || "",
      image3: data[0].visual_specs?.image3 || "",
      showOnHome: isShow,
      show_on_home: isShow
    };
    res.status(201).json({ success: true, message: "Tyre stored in database", data: created });
  } catch (err) {
    console.error("Supabase insert tyre exception:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/tyres/:id - Update tyre product in database
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  let processedImage = undefined;
  if (req.body.image !== undefined) {
    processedImage = await uploadBase64ToSupabase(req.body.image, "tyres_products");
  }

  let processedImage2 = undefined;
  if (req.body.image2 !== undefined) {
    processedImage2 = await uploadBase64ToSupabase(req.body.image2, "tyres_products");
  }

  let processedImage3 = undefined;
  if (req.body.image3 !== undefined) {
    processedImage3 = await uploadBase64ToSupabase(req.body.image3, "tyres_products");
  }

  // Fetch current row to preserve other visual_specs
  let existingVisualSpecs = {};
  try {
    const { data: currentTyre } = await supabase.from("tyre_products").select("visual_specs").eq("id", id).single();
    if (currentTyre && currentTyre.visual_specs) {
      existingVisualSpecs = currentTyre.visual_specs;
    }
  } catch (e) {
    // ignore
  }

  const mergedVisualSpecs = {
    ...existingVisualSpecs,
    ...(req.body.visual_specs || {})
  };

  if (processedImage2 !== undefined) mergedVisualSpecs.image2 = processedImage2;
  if (processedImage3 !== undefined) mergedVisualSpecs.image3 = processedImage3;
  if (req.body.showOnHome !== undefined) mergedVisualSpecs.show_on_home = Boolean(req.body.showOnHome);
  if (req.body.show_on_home !== undefined) mergedVisualSpecs.show_on_home = Boolean(req.body.show_on_home);

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
    image: processedImage,
    tagline: req.body.tagline,
    description: req.body.description,
    specs: req.body.specs,
    available_sizes: req.body.availableSizes || req.body.available_sizes,
    highlights: req.body.highlights,
    rating: req.body.rating != null ? Number(req.body.rating) : undefined,
    reviews_count: req.body.reviewsCount != null ? Number(req.body.reviewsCount) : (req.body.reviews_count != null ? Number(req.body.reviews_count) : undefined),
    date_added: req.body.dateAdded || req.body.date_added,
    visual_specs: mergedVisualSpecs,
  };

  if (processedImage2 !== undefined) updatePayload.visual_specs.image2 = processedImage2;
  if (processedImage3 !== undefined) updatePayload.visual_specs.image3 = processedImage3;

  // Remove undefined properties
  Object.keys(updatePayload).forEach((key) => updatePayload[key] === undefined && delete updatePayload[key]);

  try {
    const { data, error } = await supabase.from("tyre_products").update(updatePayload).eq("id", id).select();
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    const isShow = data[0].show_on_home !== undefined
      ? Boolean(data[0].show_on_home)
      : (data[0].visual_specs?.show_on_home !== undefined ? Boolean(data[0].visual_specs.show_on_home) : false);
    const mappedData = {
      ...data[0],
      image2: data[0].visual_specs?.image2 || "",
      image3: data[0].visual_specs?.image3 || "",
      showOnHome: isShow,
      show_on_home: isShow
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
