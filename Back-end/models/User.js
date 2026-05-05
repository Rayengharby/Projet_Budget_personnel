const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: [true, "Le nom est requis"], trim: true, maxlength: 50 },
    email:    { type: String, required: [true, "L'email est requis"], unique: true, lowercase: true, trim: true,
                match: [/^\S+@\S+\.\S+$/, "Email invalide"] },
    password: { type: String, required: [true, "Le mot de passe est requis"], minlength: 6, select: false },
    role:     { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: false },          // activé par admin
    avatar:   { type: String, default: "" },
    budgets:  [{ type: mongoose.Schema.Types.ObjectId, ref: "Budget" }],
  },
  { timestamps: true }
);

// Hash le mot de passe avant la sauvegarde
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Méthode de comparaison du mot de passe
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Ne jamais renvoyer le mot de passe
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
