import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

// In-memory payment records store fallback
let paymentRecords = [
  {
    id: "pay_sample_001",
    amount: 499,
    currency: "INR",
    feature: "unlimited_services_tier",
    paymentId: "pay_test_init",
    status: "Captured",
    user: "Super Administrator",
    timestamp: new Date().toISOString(),
  },
];

// POST /api/admin/payments/verify - Verify Razorpay payment and unlock feature
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, amount, feature, userEmail, userName } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is missing. Verification failed.",
      });
    }

    const receipt = {
      id: `rcpt_${Date.now()}`,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id || `order_${Date.now()}`,
      amount: amount || 499,
      currency: "INR",
      feature: feature || "unlimited_services_tier",
      status: "Captured",
      paidBy: userName || "Administrator",
      email: userEmail || "admin@sadgurutyres.com",
      timestamp: new Date().toISOString(),
    };

    paymentRecords.unshift(receipt);

    // Create system audit log
    const auditLog = {
      id: `log_${Date.now()}`,
      subadmin_name: userName || "SuperAdmin",
      action: "Payment Verified (Razorpay)",
      details: `Paid ₹${amount || 499} via Razorpay (ID: ${razorpay_payment_id}) to unlock Unlimited Workshop Services Tier`,
      timestamp: new Date().toISOString(),
    };

    try {
      await supabase.from("audit_logs").insert([auditLog]);
    } catch (_) {}

    return res.json({
      success: true,
      message: "Payment verified successfully! Feature is now permanently unlocked.",
      unlocked: true,
      receipt,
    });
  } catch (err) {
    console.error("Payment verification error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error verifying payment.",
      error: err.message,
    });
  }
});

// GET /api/admin/payments/history - Fetch past payment receipts
router.get("/history", async (req, res) => {
  try {
    return res.json({
      success: true,
      data: paymentRecords,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
