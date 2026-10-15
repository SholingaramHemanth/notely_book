const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    content: { type: String, default: '', maxlength: 12000 },
    tags: { type: [String], default: [] },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isTrashed: { type: Boolean, default: false },
    coverTheme: { type: String, default: 'violet' },
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, updatedAt: -1 });
noteSchema.index({ user: 1, tags: 1 });
noteSchema.index({ user: 1, isPinned: 1, isTrashed: 1 });

module.exports = mongoose.model('Note', noteSchema);
