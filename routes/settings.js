import { Router } from "express";
import { supabase } from "../config/supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../node_modules/.cache");
const SETTINGS_FILE = path.join(CACHE_DIR, "sadguru_shop_settings.json");

export const DEFAULT_SHOP_SETTINGS = {
  id: "default_settings",
  storeName: "Sadguru Tyres & Alignment Center",
  hubName: "Main Workshop Hub",
  address: "Sadguru Tyres & Alignment Center, Main Highway Junction, Pune, Maharashtra 411001",
  shortAddress: "Near Bus Stand, Main Road, Pune, Maharashtra 411001",
  googleMapsUrl: "https://maps.app.goo.gl/j9kVxiwCqT5APoYL8",
  tollFreePhone: "1800 15 11 00",
  directPhone: "+91 98220 12345 / 020 2543 8899",
  email: "care@sadgurutyres.com",
  weekdayHours: "Mon - Sat: 9:00 AM - 8:30 PM",
  sundayHours: "Sun: 10:00 AM - 4:00 PM (Open 7 Days)",
  closedNotice: "Open 7 Days",
  currency: "INR",
  expressTurnaround: "Express 30-minute fitment & alignment.",
};

// Helper to load settings from persistent storage on disk
function getPersistedSettings() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    if (fs.existsSync(SETTINGS_FILE)) {
      const fileData = fs.readFileSync(SETTINGS_FILE, "utf8");
      if (fileData) {
        const parsed = JSON.parse(fileData);
        if (parsed && typeof parsed === "object") {
          return { ...DEFAULT_SHOP_SETTINGS, ...parsed };
        }
      }
    }
  } catch (err) {
    console.warn("Could not read shop settings from disk cache:", err.message);
  }
  return { ...DEFAULT_SHOP_SETTINGS };
}

// Helper to write settings to persistent storage on disk
function savePersistedSettings(settings) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
  } catch (err) {
    console.error("Could not write shop settings to disk cache:", err.message);
  }
}

let cachedSettings = getPersistedSettings();

// GET /api/settings - Retrieve store & workshop settings
router.get("/", async (req, res) => {
  // Try Supabase first if available
  try {
    const { data, error } = await supabase
      .from("shop_settings")
      .select("*")
      .eq("id", "default_settings")
      .maybeSingle();

    if (!error && data) {
      cachedSettings = { ...DEFAULT_SHOP_SETTINGS, ...data };
      savePersistedSettings(cachedSettings);
      return res.json({ success: true, source: "database", data: cachedSettings });
    }
  } catch (err) {
    // Database table may not exist yet, fallback to persistent disk cache
  }

  // Load latest from persistent disk storage
  cachedSettings = getPersistedSettings();
  res.json({ success: true, source: "disk_cache", data: cachedSettings });
});

// PUT /api/settings - Update store & workshop settings
router.put("/", async (req, res) => {
  try {
    const current = getPersistedSettings();
    const updates = {
      id: "default_settings",
      storeName: req.body.storeName ?? current.storeName,
      hubName: req.body.hubName ?? current.hubName,
      address: req.body.address ?? current.address,
      shortAddress: req.body.shortAddress ?? current.shortAddress,
      googleMapsUrl: req.body.googleMapsUrl ?? current.googleMapsUrl,
      tollFreePhone: req.body.tollFreePhone ?? current.tollFreePhone,
      directPhone: req.body.directPhone ?? current.directPhone,
      email: req.body.email ?? current.email,
      weekdayHours: req.body.weekdayHours ?? current.weekdayHours,
      sundayHours: req.body.sundayHours ?? current.sundayHours,
      closedNotice: req.body.closedNotice ?? current.closedNotice,
      currency: req.body.currency ?? current.currency,
      expressTurnaround: req.body.expressTurnaround ?? current.expressTurnaround,
      updated_at: new Date().toISOString(),
    };

    cachedSettings = { ...current, ...updates };
    savePersistedSettings(cachedSettings);

    // Also attempt to upsert into Supabase if table exists
    try {
      const { data, error } = await supabase
        .from("shop_settings")
        .upsert(updates)
        .select()
        .maybeSingle();

      if (!error && data) {
        cachedSettings = { ...DEFAULT_SHOP_SETTINGS, ...data };
        savePersistedSettings(cachedSettings);
      }
    } catch (_) {}

    res.json({
      success: true,
      message: "Shop settings updated successfully and persisted to disk",
      data: cachedSettings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/settings/reset - Reset to factory default settings
router.post("/reset", async (req, res) => {
  try {
    cachedSettings = { ...DEFAULT_SHOP_SETTINGS, updated_at: new Date().toISOString() };
    savePersistedSettings(cachedSettings);

    try {
      await supabase
        .from("shop_settings")
        .upsert(cachedSettings);
    } catch (_) {}

    res.json({
      success: true,
      message: "Shop settings reset to defaults",
      data: cachedSettings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
