const mongoose = require("mongoose");

const categoryLimitSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  limit:    { type: Number, min: 0 },
}, { _id: false });

const budgetSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true, maxlength: 100 },
    isShared:      { type: Boolean, default: false },
    owner:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    period:        { type: String, enum: ["weekly", "monthly", "custom"], default: "monthly" },
    startDate:     { type: Date, required: true },
    endDate:       { type: Date },
    globalLimit:   { type: Number, min: 0 },
    categoryLimits: [categoryLimitSchema],
    alertThreshold: { type: Number, default: 80, min: 1, max: 100 },  // % déclenchant l'alerte
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// Virtuel : total dépensé (calculé côté route via aggregation)
budgetSchema.virtual("transactions", {
  ref: "Transaction", localField: "_id", foreignField: "budget",
});

module.exports = mongoose.model("Budget", budgetSchema);
