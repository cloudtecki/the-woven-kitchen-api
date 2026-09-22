'use strict';

const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Variant label is required'],
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    price: {
      type: Number,
      required: [true, 'Variant price is required'],
      min: [0, 'Price must be a non-negative number'],
    },
    offerPrice: {
      type: Number,
      min: [0, 'Offer price must be a non-negative number'],
    },
  },
  { _id: false }
);

const nutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    foodType: {
      type: String,
      enum: { values: ['Veg', 'Non-Veg'], message: 'Invalid food type' },
      default: 'Non-Veg',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    servingSize: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    ingredients: {
      type: [String],
      default: [],
    },
    variants: {
      type: [variantSchema],
      required: [true, 'At least one variant is required'],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one variant with a price is required',
      },
    },
    status: {
      type: String,
      enum: { values: ['Active', 'Inactive'], message: 'Invalid status' },
      default: 'Active',
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    foodImageUrl: {
      type: String,
      trim: true,
    },
    nutrition: {
      type: nutritionSchema,
      default: null,
    },
    nutritionStatus: {
      type: String,
      enum: { values: ['Approved', 'Pending'], message: 'Invalid nutrition status' },
      default: 'Pending',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

module.exports = { MenuItem, menuItemSchema };
