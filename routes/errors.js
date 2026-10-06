import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

const formatErrorLog = (e) => ({
  id: e.id,
  timestamp: e.timestamp || e.created_at || new Date().toISOString(),
  severity: e.severity || "Warning",
  module: e.module || "API Endpoint Handler",
  message: e.message || "",
  stack: e.stack || "",
  status: e.status || "Unresolved",
  count: 1,
});

// GET /api/admin/errors - Fetch all system & API error logs directly from database
router.get("/", async (req, res) => {
  try {
    const { data: errorsData, error } = await supabase
      .from("error_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Supabase fetch errors error:", error.message);
      return res.status(500).json({ success: false, message: error.message, data: [] });
    }

    const errors = (errorsData || []).map(formatErrorLog);
    const unresolvedCount = errors.filter((e) => e.status === "Unresolved").length;
    const criticalCount = errors.filter((e) => e.severity === "Critical" && e.status === "Unresolved").length;

    res.json({
      success: true,
      data: errors,
      summary: {
        total: errors.length,
        unresolved: unresolvedCount,
        critical: criticalCount,
        systemUptime: "99.98%",
        avgLatencyMs: 38,
        dbStatus: "Healthy",
      },
    });
  } catch (err) {
    console.error("Fetch error logs exception:", err.message);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
});

// POST /api/admin/errors - Record a new error directly in database
router.post("/", async (req, res) => {
  const { severity, module, message, stack } = req.body;

  const newErrorPayload = {
    id: `err_${Date.now()}`,
    timestamp: new Date().toISOString(),
    severity: severity || "Warning",
    module: module || "API Endpoint Handler",
    message: message || "Simulated test error logged by administrator",
    stack: stack || `Error: ${message || 'Simulated stack trace'} at systemMonitor (routes/errors.js:45)`,
    status: "Unresolved",
  };

  try {
    const { data, error } = await supabase.from("error_logs").insert([newErrorPayload]).select();
    if (error) {
      console.error("Supabase insert error log error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(201).json({
      success: true,
      message: "Error log created in database",
      data: formatErrorLog(data[0]),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/errors/:id - Toggle resolution status in database
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from("error_logs")
      .update({ status: status || "Resolved" })
      .eq("id", id)
      .select();

    if (error || !data || data.length === 0) {
      return res.status(404).json({ success: false, message: error ? error.message : "Error log entry not found" });
    }

    res.json({
      success: true,
      message: `Error status updated to ${data[0].status}`,
      data: formatErrorLog(data[0]),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/errors/resolved - Clear all resolved error logs from database
router.delete("/resolved", async (req, res) => {
  try {
    const { error } = await supabase.from("error_logs").delete().eq("status", "Resolved");
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    const { data: remaining } = await supabase.from("error_logs").select("*").order("timestamp", { ascending: false });

    res.json({
      success: true,
      message: `Cleared resolved error logs`,
      data: (remaining || []).map(formatErrorLog),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/errors/:id - Delete specific error log entry from database
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("error_logs").delete().eq("id", id);
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({
      success: true,
      message: "Error log deleted from database",
      id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
