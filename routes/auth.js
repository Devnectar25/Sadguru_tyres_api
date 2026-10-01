import { Router } from "express";

const router = Router();

// POST /api/admin/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "admin@sadgurutyres.com" && password === "admin123") {
    return res.json({
      success: true,
      token: "jwt_token_sadguru_admin_secret_998877",
      user: {
        name: "Admin Manager",
        email: "admin@sadgurutyres.com",
        role: "SuperAdmin",
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid Administrator credentials. Please verify email and password.",
  });
});

export default router;
