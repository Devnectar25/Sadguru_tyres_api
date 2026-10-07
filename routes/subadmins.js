import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

// In-memory fallback / cache for subadmins (preserves passwords and ensures offline fallback)
let localSubadminsCache = [
  {
    id: "sub_1",
    name: "Ramesh Kulkarni",
    email: "ramesh.k@sadgurutyres.com",
    password: "password123",
    role: "Inventory Manager",
    phone: "+91 98220 12345",
    status: "Active",
    permissions: ["inventory_read", "inventory_write"],
    avatar_color: "#2563eb",
    last_active: new Date().toISOString(),
  },
  {
    id: "sub_2",
    name: "Pooja Deshmukh",
    email: "pooja.d@sadgurutyres.com",
    password: "password123",
    role: "Service Operations Lead",
    phone: "+91 98901 88776",
    status: "Active",
    permissions: ["bookings_manage", "quotes_manage"],
    avatar_color: "#10b981",
    last_active: new Date().toISOString(),
  },
];

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
  hasPassword: Boolean(s.password),
});

const formatAuditLog = (l) => ({
  id: l.id,
  subadminName: l.subadmin_name || l.subadminName || "SuperAdmin",
  subadmin_name: l.subadmin_name || l.subadminName || "SuperAdmin",
  action: l.action,
  details: l.details,
  timestamp: l.timestamp || new Date().toISOString(),
});

// POST /api/admin/subadmins/login - Authenticate subadmin or superadmin
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Username/Email and Password are required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // 1. Check SuperAdmin credentials
  if (
    (cleanEmail === "admin@sadgurutyres.com" || cleanEmail === "admin") &&
    cleanPassword === "admin123"
  ) {
    return res.json({
      success: true,
      message: "Authenticated as Super Administrator",
      user: {
        id: "superadmin",
        name: "SuperAdmin",
        email: "admin@sadgurutyres.com",
        role: "Super Administrator",
        isSuperAdmin: true,
        permissions: ["all"],
        avatarColor: "#ef4444",
      },
    });
  }

  // 2. Check Sub-Admin accounts in Database
  try {
    let subMatch = null;

    // Check in database first
    const { data: dbSubs, error } = await supabase
      .from("subadmins")
      .select("*")
      .ilike("email", cleanEmail);

    if (dbSubs && dbSubs.length > 0) {
      subMatch = dbSubs[0];
    }

    // Fallback to localSubadminsCache
    if (!subMatch) {
      subMatch = localSubadminsCache.find(
        (s) => s.email.toLowerCase() === cleanEmail
      );
    }

    if (!subMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Please check your credentials.",
      });
    }

    // Check account status
    if (subMatch.status === "Inactive") {
      return res.status(403).json({
        success: false,
        message: "Your sub-admin account is currently deactivated. Please contact the administrator.",
      });
    }

    // Verify password if set
    if (subMatch.password && subMatch.password !== cleanPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password for this sub-admin account.",
      });
    }

    // Update last_active
    const nowIso = new Date().toISOString();
    try {
      await supabase.from("subadmins").update({ last_active: nowIso }).eq("id", subMatch.id);
    } catch (_) {}

    // Add audit log
    try {
      await supabase.from("audit_logs").insert([{
        id: `log_${Date.now()}`,
        subadmin_name: subMatch.name,
        action: "Subadmin Login",
        details: `${subMatch.name} logged into the admin dashboard`,
        timestamp: nowIso,
      }]);
    } catch (_) {}

    return res.json({
      success: true,
      message: `Welcome back, ${subMatch.name}`,
      user: {
        id: subMatch.id,
        name: subMatch.name,
        email: subMatch.email,
        role: subMatch.role || "Support Executive",
        permissions: subMatch.permissions || [],
        avatarColor: subMatch.avatar_color || "#2563eb",
        isSuperAdmin: false,
        isSubadmin: true,
      },
    });
  } catch (err) {
    console.error("Subadmin login error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
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

    let subadmins = (subadminsData && subadminsData.length > 0)
      ? subadminsData.map(formatSubadmin)
      : localSubadminsCache.map(formatSubadmin);

    const auditLogs = (auditData || []).map(formatAuditLog);

    res.json({
      success: true,
      data: subadmins,
      auditLogs,
    });
  } catch (err) {
    console.error("Fetch subadmins exception:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
      data: localSubadminsCache.map(formatSubadmin),
      auditLogs: [],
    });
  }
});

// POST /api/admin/subadmins - Create new subadmin directly in database
router.post("/", async (req, res) => {
  const { name, email, password, role, phone, permissions } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: "Name and Email are required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = (password || "password123").trim();

  const colors = ["#ef4444", "#0f172a", "#2563eb", "#10b981", "#8b5cf6", "#f59e0b"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newSubadminPayload = {
    id: `sub_${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password: cleanPassword,
    role: role || "Support Executive",
    phone: phone || "+91 98000 00000",
    status: "Active",
    permissions: permissions && permissions.length > 0 ? permissions : ["inventory_read"],
    avatar_color: randomColor,
    last_active: new Date().toISOString(),
  };

  // Add to local cache
  localSubadminsCache = [newSubadminPayload, ...localSubadminsCache.filter(s => s.id !== newSubadminPayload.id)];

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
      console.warn("Supabase subadmin insert warning (falling back to cache):", subError.message);
    }

    try {
      await supabase.from("audit_logs").insert([newAuditLogPayload]);
    } catch (_) {}

    const { data: auditData } = await supabase
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    res.status(201).json({
      success: true,
      message: "Subadmin created successfully",
      data: formatSubadmin(subData && subData[0] ? subData[0] : newSubadminPayload),
      auditLogs: (auditData || []).map(formatAuditLog),
    });
  } catch (err) {
    console.error("Subadmin create exception:", err.message);
    res.status(201).json({
      success: true,
      message: "Subadmin created successfully",
      data: formatSubadmin(newSubadminPayload),
      auditLogs: [],
    });
  }
});

// PUT /api/admin/subadmins/:id - Update subadmin details or permissions in database
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updatePayload = {
    name: req.body.name ? req.body.name.trim() : undefined,
    email: req.body.email ? req.body.email.trim().toLowerCase() : undefined,
    role: req.body.role,
    phone: req.body.phone,
    status: req.body.status,
    permissions: req.body.permissions,
    avatar_color: req.body.avatarColor || req.body.avatar_color,
    last_active: new Date().toISOString(),
  };

  if (req.body.password && req.body.password.trim()) {
    updatePayload.password = req.body.password.trim();
  }

  Object.keys(updatePayload).forEach((key) => updatePayload[key] === undefined && delete updatePayload[key]);

  // Update local cache
  localSubadminsCache = localSubadminsCache.map((s) =>
    s.id === id ? { ...s, ...updatePayload } : s
  );

  try {
    const { data: subData, error: subError } = await supabase
      .from("subadmins")
      .update(updatePayload)
      .eq("id", id)
      .select();

    const updatedSub = (subData && subData[0]) ? subData[0] : localSubadminsCache.find(s => s.id === id) || { id, ...updatePayload };
    const newAuditLogPayload = {
      id: `log_${Date.now()}`,
      subadmin_name: "SuperAdmin",
      action: "Updated Subadmin",
      details: `Updated permissions/role for ${updatedSub.name || id}`,
      timestamp: new Date().toISOString(),
    };

    try {
      await supabase.from("audit_logs").insert([newAuditLogPayload]);
    } catch (_) {}

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

  localSubadminsCache = localSubadminsCache.filter(s => s.id !== id);

  try {
    const { data: targetData } = await supabase.from("subadmins").select("name").eq("id", id).single();

    const { error: delError } = await supabase.from("subadmins").delete().eq("id", id);
    if (delError) {
      console.warn("Supabase delete subadmin warning:", delError.message);
    }

    try {
      await supabase.from("audit_logs").insert([{
        id: `log_${Date.now()}`,
        subadmin_name: "SuperAdmin",
        action: "Deleted Subadmin",
        details: `Removed subadmin account for ${targetData ? targetData.name : id}`,
        timestamp: new Date().toISOString(),
      }]);
    } catch (_) {}

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
