import { Router } from "express";
import { supabase } from "../config/supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "../data/bookings.json");

const getLocalBookings = () => {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const saveLocalBookings = (bookings) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(bookings, null, 2));
  } catch (err) {
    console.error("Error writing to local bookings file:", err);
  }
};

const formatBooking = (b) => ({
  id: b.id,
  customerName: b.customer_name || b.customerName,
  customer_name: b.customer_name || b.customerName,
  carModel: b.car_model || b.carModel,
  car_model: b.car_model || b.carModel,
  serviceName: b.service_name || b.serviceName,
  service_name: b.service_name || b.serviceName,
  date: b.date,
  timeSlot: b.time_slot || b.timeSlot,
  time_slot: b.time_slot || b.timeSlot,
  phone: b.phone,
  status: b.status || "Pending",
  totalINR: b.total_inr || b.totalINR || 1850,
  total_inr: b.total_inr || b.totalINR || 1850,
  created_at: b.created_at || new Date().toISOString(),
});

// GET /api/bookings
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("service_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) console.error("Supabase fetch bookings error:", error);
      const fallback = getLocalBookings().map(formatBooking);
      return res.json({ success: true, count: fallback.length, source: "local", data: fallback });
    }

    const formatted = data.map(formatBooking);
    res.json({ success: true, count: formatted.length, source: "supabase", data: formatted });
  } catch (err) {
    console.error("Fetch bookings exception:", err);
    const fallback = getLocalBookings().map(formatBooking);
    res.json({ success: true, count: fallback.length, source: "local", data: fallback });
  }
});

// POST /api/bookings
router.post("/", async (req, res) => {
  const newBookingPayload = {
    customer_name: req.body.customerName || req.body.customer_name || "Customer",
    car_model: req.body.carModel || req.body.car_model || "Standard Vehicle",
    service_name: req.body.serviceName || req.body.service_name || "Wheel Alignment & Service",
    date: req.body.date || new Date().toISOString().split("T")[0],
    time_slot: req.body.timeSlot || req.body.time_slot || "11:00 AM",
    phone: req.body.phone || "+91 98765 43210",
    status: req.body.status || "Pending",
    total_inr: Number(req.body.totalINR || req.body.total_inr || 1850),
  };

  let createdBooking = null;

  try {
    const { data, error } = await supabase
      .from("service_bookings")
      .insert([newBookingPayload])
      .select();

    if (error) {
      console.error("Supabase booking insert error:", error);
    } else if (data && data.length > 0) {
      createdBooking = data[0];
    }
  } catch (err) {
    console.error("Supabase booking insert exception:", err);
  }

  // Backup to local file
  const localRecord = formatBooking(createdBooking || {
    id: `sb_${Date.now()}`,
    ...newBookingPayload
  });

  const currentList = getLocalBookings();
  currentList.unshift(localRecord);
  saveLocalBookings(currentList);

  res.status(201).json({
    success: true,
    message: "Booking created successfully",
    data: localRecord,
  });
});

// PATCH /api/bookings/:id
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await supabase.from("service_bookings").update({ status }).eq("id", id);
  } catch (err) {
    console.error("Supabase update booking status exception:", err);
  }

  // Update local file backup
  const currentList = getLocalBookings();
  const updatedList = currentList.map((b) => (b.id === id || b.id === Number(id) ? { ...b, status } : b));
  saveLocalBookings(updatedList);

  res.json({ success: true, message: "Booking status updated", data: { id, status } });
});

export default router;

