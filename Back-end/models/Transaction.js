const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type:        { type: String, enum: ["income", "expense"], required: true },
    amount:      { type: Number, required: true, min: [0.01, "Le montant doit être positif"] },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    date:        { type: Date, required: true, default: Date.now },
    category:    { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    budget:      { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },  // budget partagé associé
    comment:     { type: String, trim: true, maxlength: 500 },             // commentaire collaboratif
  },
  { timestamps: true }
);

// Index pour optimiser les requêtes fréquentes
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ budget: 1, date: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
