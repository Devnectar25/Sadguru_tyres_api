import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

const formatSubadmin = (s) => ({
  id: s.id,
  name: s.name,
  email: s.email,
  role: s.role || "Support Executive",
  phone: s.phone || "+91 98000 00000",
  status: s.status || "Active",
  permissions: s.permissions || ["bookings_manage"],
  lastActive: s.last_active || s.lastActive || new Date().toISOString(),
  last_active: s.last_active || s.lastActive || new Date().toISOString(),
  avatarColor: s.avatar_color || s.avatarColor || "#2563eb",
  avatar_color: s.avatar_color || s.avatarColor || "#2563eb",
});

const formatAuditLog = (l) => ({
  id: l.id,
  subadminName: l.subadmin_name || l.subadminName || "SuperAdmin",
  subadmin_name: l.subadmin_name || l.subadminName || "SuperAdmin",
  action: l.action,
  details: l.details,
  timestamp: l.timestamp || new Date().toISOString(),
});

// GET /api/admin/subadmins - List subadmins and audit logs directly from database
router.get("/", async (req, res) => {
  try {
    const { data: subadminsData, error: subError } = await supabase
      .from("subadmins")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: auditData, error: auditError } = await supabase
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (subError) {
      console.error("Supabase fetch subadmins error:", subError.message);
    }
    if (auditError) {
      console.error("Supabase fetch audit logs error:", auditError.message);
    }

    const subadmins = (subadminsData || []).map(formatSubadmin);
    const auditLogs = (auditData || []).map(formatAuditLog);

    res.json({
      success: true,
      data: subadmins,
      auditLogs,
    });
  } catch (err) {
    console.error("Fetch subadmins exception:", err.message);
    res.status(500).json({ success: false, message: err.message, data: [], auditLogs: [] });
  }
});

// POST /api/admin/subadmins - Create new subadmin directly in database
router.post("/", async (req, res) => {
  const { name, email, role, phone, permissions } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: "Name and Email are required" });
  }

  const colors = ["#ef4444", "#0f172a", "#2563eb", "#10b981", "#8b5cf6", "#f59e0b"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newSubadminPayload = {
    id: `sub_${Date.now()}`,
    name,
    email,
    role: role || "Support Executive",
    phone: phone || "+91 98000 00000",
    status: "Active",
    permissions: permissions || ["bookings_manage"],
    avatar_color: randomColor,
    last_active: new Date().toISOString(),
  };

  const newAuditLogPayload = {
    id: `log_${Date.now()}`,
    subadmin_name: "SuperAdmin",
    action: "Created Subadmin",
    details: `Added new subadmin account for ${name} (${role || "Support Executive"})`,
    timestamp: new Date().toISOString(),
  };

  try {
    const { data: subData, error: subError } = await supabase
      .from("subadmins")
      .insert([newSubadminPayload])
      .select();

    if (subError) {
      console.error("Supabase subadmin insert error:", subError.message);
      return res.status(500).json({ success: false, message: subError.message });
    }

    await supabase.from("audit_logs").insert([newAuditLogPayload]);

    const { data: auditData } = await supabase
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    res.status(201).json({
      success: true,
      message: "Subadmin created successfully in database",
      data: formatSubadmin(subData[0]),
      auditLogs: (auditData || []).map(formatAuditLog),
    });
  } catch (err) {
    console.error("Subadmin create exception:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/subadmins/:id - Update subadmin details or permissions in database
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updatePayload = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    phone: req.body.phone,
    status: req.body.status,
    permissions: req.body.permissions,
    avatar_color: req.body.avatarColor || req.body.avatar_color,
    last_active: new Date().toISOString(),
  };

  Object.keys(updatePayload).forEach((key) => updatePayload[key] === undefined && delete updatePayload[key]);

  try {
    const { data: subData, error: subError } = await supabase
      .from("subadmins")
      .update(updatePayload)
      .eq("id", id)
      .select();

    if (subError || !subData || subData.length === 0) {
      return res.status(404).json({ success: false, message: subError ? subError.message : "Subadmin not found" });
    }

    const updatedSub = subData[0];
    const newAuditLogPayload = {
      id: `log_${Date.now()}`,
      subadmin_name: "SuperAdmin",
      action: "Updated Subadmin",
      details: `Updated permissions/role for ${updatedSub.name}`,
      timestamp: new Date().toISOString(),
    };

    await supabase.from("audit_logs").insert([newAuditLogPayload]);

    const { data: auditData } = await supabase
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    res.json({
      success: true,
      message: "Subadmin updated successfully in database",
      data: formatSubadmin(updatedSub),
      auditLogs: (auditData || []).map(formatAuditLog),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/subadmins/:id - Delete subadmin from database
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data: targetData } = await supabase.from("subadmins").select("name").eq("id", id).single();

    const { error: delError } = await supabase.from("subadmins").delete().eq("id", id);
    if (delError) {
      return res.status(500).json({ success: false, message: delError.message });
    }

    if (targetData) {
      await supabase.from("audit_logs").insert([{
        id: `log_${Date.now()}`,
        subadmin_name: "SuperAdmin",
        action: "Deleted Subadmin",
        details: `Removed subadmin account for ${targetData.name}`,
        timestamp: new Date().toISOString(),
      }]);
    }

    const { data: auditData } = await supabase
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    res.json({
      success: true,
      message: "Subadmin deleted successfully from database",
      id,
      auditLogs: (auditData || []).map(formatAuditLog),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
