import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const playerInventorySchema = new Schema({
  // L'ID de l'utilisateur Clerk
  clerkId: { type: String, required: true, unique: true },
  
  // Inventaire des programmes one-shot
  oneShotPrograms: [{
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    quantity: { type: Number, default: 1 },
    purchasedAt: { type: Date, default: Date.now }
  }],
  
  // Implants installés sur les runners
  installedImplants: [{
    runnerId: { type: Schema.Types.ObjectId, ref: 'Netrunner' },
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    installedAt: { type: Date, default: Date.now }
  }],
  
  // Informations achetées (datashards)
  purchasedInformation: [{
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    contractGenerated: { type: Schema.Types.ObjectId, ref: 'Contract', default: null },
    purchasedAt: { type: Date, default: Date.now }
  }],
  
  // Historique des achats
  purchaseHistory: [{
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    price: { type: Number, required: true },
    purchasedAt: { type: Date, default: Date.now }
  }],
  
  // Statistiques
  totalSpent: { type: Number, default: 0 },
  signatureItemsPurchased: { type: Number, default: 0 },
  
}, { timestamps: true });

// Méthode pour ajouter un programme one-shot
playerInventorySchema.methods.addOneShotProgram = function(programId) {
  const existing = this.oneShotPrograms.find(item => item.programId.equals(programId));
  if (existing) {
    existing.quantity += 1;
  } else {
    this.oneShotPrograms.push({ programId, quantity: 1 });
  }
};

// Méthode pour utiliser un programme one-shot
playerInventorySchema.methods.useOneShotProgram = function(programId) {
  const item = this.oneShotPrograms.find(item => item.programId.equals(programId));
  if (item && item.quantity > 0) {
    item.quantity -= 1;
    if (item.quantity === 0) {
      this.oneShotPrograms = this.oneShotPrograms.filter(i => !i.programId.equals(programId));
    }
    return true;
  }
  return false;
};

// Méthode pour installer un implant
playerInventorySchema.methods.installImplant = function(runnerId, programId) {
  // Vérifier si le runner a déjà un implant de ce type
  const existingImplant = this.installedImplants.find(
    implant => implant.runnerId.equals(runnerId) && implant.programId.equals(programId)
  );
  
  if (!existingImplant) {
    this.installedImplants.push({ runnerId, programId });
    return true;
  }
  return false;
};

// Méthode pour ajouter un achat à l'historique
playerInventorySchema.methods.addPurchase = function(programId, price) {
  this.purchaseHistory.push({ programId, price });
  this.totalSpent += price;
};

const PlayerInventory = mongoose.models.PlayerInventory || mongoose.model('PlayerInventory', playerInventorySchema);

export default PlayerInventory; 