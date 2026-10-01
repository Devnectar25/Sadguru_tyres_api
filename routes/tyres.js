import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "../data/tyres.json");

const getTyres = () => {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const saveTyres = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
};

// GET /api/tyres
router.get("/", (req, res) => {
  const tyres = getTyres();
  res.json({ success: true, count: tyres.length, data: tyres });
});

// GET /api/tyres/:id
router.get("/:id", (req, res) => {
  const tyres = getTyres();
  const tyre = tyres.find((t) => t.id === req.params.id);
  if (!tyre) {
    return res.status(404).json({ success: false, message: "Tyre not found" });
  }
  res.json({ success: true, data: tyre });
});

// POST /api/tyres
router.post("/", (req, res) => {
  const tyres = getTyres();
  const newTyre = {
    id: req.body.id || `tyre-${Date.now()}`,
    dateAdded: new Date().toISOString().split("T")[0],
    stock: 45,
    rating: 4.8,
    reviewsCount: 1,
    ...req.body,
  };
  tyres.unshift(newTyre);
  saveTyres(tyres);
  res.status(201).json({ success: true, message: "Tyre created successfully", data: newTyre });
});

// PUT /api/tyres/:id
router.put("/:id", (req, res) => {
  let tyres = getTyres();
  const index = tyres.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Tyre not found" });
  }
  tyres[index] = { ...tyres[index], ...req.body };
  saveTyres(tyres);
  res.json({ success: true, message: "Tyre updated successfully", data: tyres[index] });
});

// DELETE /api/tyres/:id
router.delete("/:id", (req, res) => {
  let tyres = getTyres();
  const initialLen = tyres.length;
  tyres = tyres.filter((t) => t.id !== req.params.id);
  if (tyres.length === initialLen) {
    return res.status(404).json({ success: false, message: "Tyre not found" });
  }
  saveTyres(tyres);
  res.json({ success: true, message: "Tyre deleted successfully" });
});

export default router;
