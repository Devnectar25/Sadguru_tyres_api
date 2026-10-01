import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "../data/bookings.json");

const getBookings = () => {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const saveBookings = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
};

// GET /api/bookings
router.get("/", (req, res) => {
  const bookings = getBookings();
  res.json({ success: true, count: bookings.length, data: bookings });
});

// POST /api/bookings
router.post("/", (req, res) => {
  const bookings = getBookings();
  const newBooking = {
    id: `b-${Date.now()}`,
    status: "Pending",
    totalINR: 1850,
    ...req.body,
  };
  bookings.unshift(newBooking);
  saveBookings(bookings);
  res.status(201).json({ success: true, message: "Booking created successfully", data: newBooking });
});

// PATCH /api/bookings/:id
router.patch("/:id", (req, res) => {
  let bookings = getBookings();
  const index = bookings.findIndex((b, i) => b.id === req.params.id || i === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }
  bookings[index] = { ...bookings[index], ...req.body };
  saveBookings(bookings);
  res.json({ success: true, message: "Booking status updated", data: bookings[index] });
});

export default router;
