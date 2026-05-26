import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    ticker: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['buy', 'sell'],
    },
    assetType: {
      type: String,
      required: true,
      enum: ['stock', 'crypto'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.000001, 'Quantity must be positive'],
    },
    price: {
      type: Number,
      required: true,
      min: [0.000001, 'Price must be positive'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for speedy lookups
transactionSchema.index({ ticker: 1 });
transactionSchema.index({ date: -1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
