import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "../data/brands.json");

const getBrands = () => {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const saveBrands = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
};

// GET /api/brands
router.get("/", (req, res) => {
  const brands = getBrands();
  res.json({ success: true, count: brands.length, data: brands });
});

// POST /api/brands
router.post("/", (req, res) => {
  const brands = getBrands();
  const newBrand = {
    id: req.body.id || `brand-${Date.now()}`,
    status: "Active",
    ...req.body,
  };
  brands.push(newBrand);
  saveBrands(brands);
  res.status(201).json({ success: true, message: "Brand added successfully", data: newBrand });
});

// PUT /api/brands/:id
router.put("/:id", (req, res) => {
  let brands = getBrands();
  const index = brands.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Brand not found" });
  }
  brands[index] = { ...brands[index], ...req.body };
  saveBrands(brands);
  res.json({ success: true, message: "Brand updated successfully", data: brands[index] });
});

// DELETE /api/brands/:id
router.delete("/:id", (req, res) => {
  let brands = getBrands();
  const initialLen = brands.length;
  brands = brands.filter((b) => b.id !== req.params.id);
  if (brands.length === initialLen) {
    return res.status(404).json({ success: false, message: "Brand not found" });
  }
  saveBrands(brands);
  res.json({ success: true, message: "Brand deleted successfully" });
});

export default router;
