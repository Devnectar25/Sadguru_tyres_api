import { Router } from "express";
import { supabase } from "../config/supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../node_modules/.cache");
const METADATA_FILE = path.join(CACHE_DIR, "sadguru_services_metadata.json");

let memoryMetadata = {
  "srv-3": { "show_on_home": true },
  "srv-4": { "show_on_home": true },
  "srv-5": { "show_on_home": true },
  "srv-1": { "show_on_home": false },
  "srv-2": { "show_on_home": false },
  "srv-1791364393822": { "show_on_home": false }
};

// Helper to ensure data directory and file exist
function getServicesMetadata() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    if (fs.existsSync(METADATA_FILE)) {
      const content = fs.readFileSync(METADATA_FILE, "utf8");
      memoryMetadata = { ...memoryMetadata, ...JSON.parse(content || "{}") };
    }
  } catch (err) {
    console.warn("Could not read services metadata file:", err.message);
  }
  return memoryMetadata;
}

function saveServicesMetadata(meta) {
  memoryMetadata = { ...meta };
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(METADATA_FILE, JSON.stringify(meta, null, 2), "utf8");
  } catch (err) {
    console.error("Could not save services metadata file:", err.message);
  }
}

const parsePriceNumber = (val) => {
  if (val == null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const str = String(val).replace(/[^0-9.]/g, "");
  return parseFloat(str) || 0;
};

const formatService = (s, metadata = {}, index = 0) => {
  const priceVal = parsePriceNumber(s.price_inr ?? s.priceINR ?? s.price);
  const nameVal = s.name || s.title || "Workshop Service";
  const descVal = s.description || s.shortDesc || "";
  
  // Check metadata first, then row properties, then index fallback (top 3)
  let showOnHome = false;
  if (metadata[s.id]?.show_on_home !== undefined) {
    showOnHome = Boolean(metadata[s.id].show_on_home);
  } else if (metadata[s.id]?.showOnHome !== undefined) {
    showOnHome = Boolean(metadata[s.id].showOnHome);
  } else if (s.show_on_home !== undefined && s.show_on_home !== null) {
    showOnHome = Boolean(s.show_on_home);
  } else if (s.showOnHome !== undefined && s.showOnHome !== null) {
    showOnHome = Boolean(s.showOnHome);
  } else {
    showOnHome = index < 3;
  }

  return {
    id: s.id,
    name: nameVal,
    title: nameVal,
    description: descVal,
    shortDesc: descVal,
    priceINR: priceVal,
    price_inr: priceVal,
    price: `₹ ${priceVal.toLocaleString("en-IN")}`,
    duration: s.duration || "30 Mins",
    category: s.category || "General Maintenance",
    image: s.image || "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
    status: s.status || "Active",
    showOnHome: showOnHome,
    show_on_home: showOnHome,
    badge: s.badge || "Verified Expert",
    equipment: s.equipment || "Professional Workshop Tools",
    benefits: Array.isArray(s.benefits) ? s.benefits : [],
    created_at: s.created_at || new Date().toISOString(),
  };
};

// GET /api/services - Fetch all services directly from Supabase database + metadata
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

    const metadata = getServicesMetadata();
    const formatted = (data || []).map((s, idx) => formatService(s, metadata, idx));
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

    const metadata = getServicesMetadata();
    res.json({ success: true, data: formatService(data, metadata) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/services - Store new service directly in database
router.post("/", async (req, res) => {
  const nameVal = req.body.name || req.body.title;
  if (!nameVal) {
    return res.status(400).json({ success: false, message: "Service title/name is required" });
  }

  try {
    // 12 Services maximum limit validation
    const { count, error: countErr } = await supabase
      .from("services")
      .select("*", { count: "exact", head: true });

    if (!countErr && count >= 12) {
      return res.status(400).json({
        success: false,
        message: "Maximum limit of 12 services reached. You cannot add more services.",
      });
    }

    const priceVal = parsePriceNumber(req.body.priceINR ?? req.body.price_inr ?? req.body.price);

    let showOnHome = false;
    if (req.body.showOnHome !== undefined) showOnHome = Boolean(req.body.showOnHome);
    else if (req.body.show_on_home !== undefined) showOnHome = Boolean(req.body.show_on_home);

    const metadata = getServicesMetadata();

    // Check max 3 home validation
    if (showOnHome) {
      const activeHomeCount = Object.values(metadata).filter((m) => m.show_on_home === true).length;
      if (activeHomeCount >= 3) {
        showOnHome = false;
      }
    }

    const serviceId = req.body.id || `srv-${Date.now()}`;

    // Payload sent to Supabase - ONLY valid Supabase columns
    const dbPayload = {
      id: serviceId,
      name: nameVal,
      description: req.body.description || req.body.shortDesc || "",
      price_inr: priceVal,
      duration: req.body.duration || "30 Mins",
      category: req.body.category || "General Maintenance",
      image: req.body.image || "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
      status: req.body.status || "Active",
    };

    const { data, error } = await supabase
      .from("services")
      .insert([dbPayload])
      .select();

    if (error) {
      console.error("Supabase insert service error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    // Save show_on_home in metadata
    metadata[serviceId] = { show_on_home: showOnHome };
    saveServicesMetadata(metadata);

    res.status(201).json({
      success: true,
      message: "Service created successfully in database",
      data: formatService(data[0] || dbPayload, metadata),
    });
  } catch (err) {
    console.error("Supabase insert service exception:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/services/:id - Update existing service in database
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  let priceVal = undefined;
  if (req.body.priceINR !== undefined || req.body.price_inr !== undefined || req.body.price !== undefined) {
    priceVal = parsePriceNumber(req.body.priceINR ?? req.body.price_inr ?? req.body.price);
  }

  const nameVal = req.body.name || req.body.title;
  const descVal = req.body.description !== undefined ? req.body.description : req.body.shortDesc;

  // Supabase update payload - ONLY valid DB table columns
  const updatePayload = {
    name: nameVal,
    description: descVal,
    price_inr: priceVal,
    duration: req.body.duration,
    category: req.body.category,
    image: req.body.image,
    status: req.body.status,
  };

  Object.keys(updatePayload).forEach((key) => updatePayload[key] === undefined && delete updatePayload[key]);

  const metadata = getServicesMetadata();

  // Handle show_on_home
  let requestedShowOnHome = undefined;
  if (req.body.showOnHome !== undefined) requestedShowOnHome = Boolean(req.body.showOnHome);
  if (req.body.show_on_home !== undefined) requestedShowOnHome = Boolean(req.body.show_on_home);

  if (requestedShowOnHome === true) {
    const activeHomeCount = Object.keys(metadata).filter(
      (key) => key !== id && metadata[key]?.show_on_home === true
    ).length;
    if (activeHomeCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum 3 services can be featured on the Home screen.",
      });
    }
  }

  if (requestedShowOnHome !== undefined) {
    metadata[id] = { ...(metadata[id] || {}), show_on_home: requestedShowOnHome };
    saveServicesMetadata(metadata);
  }

  try {
    let updatedRow = null;

    if (Object.keys(updatePayload).length > 0) {
      const { data, error } = await supabase
        .from("services")
        .update(updatePayload)
        .eq("id", id)
        .select();

      if (!error && data && data.length > 0) {
        updatedRow = data[0];
      }
    }

    if (!updatedRow) {
      const { data: existingData } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single();
      updatedRow = existingData || { id, ...updatePayload };
    }

    res.json({
      success: true,
      message: "Service updated in database",
      data: formatService(updatedRow, metadata),
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

    const metadata = getServicesMetadata();
    delete metadata[id];
    saveServicesMetadata(metadata);

    res.json({ success: true, message: "Service deleted from database", id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
