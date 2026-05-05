const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");

router.use(protect);

// GET /api/users/me
router.get("/me", (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/users/me
router.put("/me", async (req, res) => {
  try {
    const allowed = ["name", "avatar"];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { 
      new: true, 
      runValidators: true 
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/users/me/password
router.put("/me/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ 
        success: false, 
        message: "Mot de passe actuel incorrect." 
      });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Mot de passe mis à jour." });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;