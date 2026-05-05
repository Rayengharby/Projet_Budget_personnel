const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true, maxlength: 50 },
    icon:       { type: String, default: "📦" },
    color:      { type: String, default: "#6b7280" },
    isDefault:  { type: Boolean, default: false },  // catégories système (non supprimables)
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null si catégorie par défaut
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
