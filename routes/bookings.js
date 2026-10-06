import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

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

// GET /api/bookings - Fetch directly from Supabase database
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("service_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch bookings error:", error.message);
      return res.status(500).json({ success: false, message: error.message, data: [] });
    }

    const formatted = data.map(formatBooking);
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error("Fetch bookings exception:", err.message);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
});

// POST /api/bookings - Store DIRECTLY in Supabase Database
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

  try {
    const { data, error } = await supabase
      .from("service_bookings")
      .insert([newBookingPayload])
      .select();

    if (error) {
      console.error("❌ Supabase booking insert error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    const createdBooking = formatBooking(data[0]);
    console.log("✅ Booking stored DIRECTLY in Supabase Database:", createdBooking.id);

    return res.status(201).json({
      success: true,
      message: "Booking stored directly in database",
      data: createdBooking,
    });
  } catch (err) {
    console.error("❌ Supabase booking insert exception:", err.message);
    return res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// PATCH /api/bookings/:id - Update status DIRECTLY in Supabase Database
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from("service_bookings")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase update booking status error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: "Booking status updated in database", data: data[0] ? formatBooking(data[0]) : { id, status } });
  } catch (err) {
    console.error("Supabase update booking status exception:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/bookings/:id - Delete booking from database
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("service_bookings").delete().eq("id", id);
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    res.json({ success: true, message: "Booking deleted from database", id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
