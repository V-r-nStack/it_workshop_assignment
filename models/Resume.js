const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true, trim: true },
  degree: { type: String, required: true, trim: true },
  fieldOfStudy: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date },
  grade: { type: String, trim: true },
  description: { type: String, trim: true },
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  currentlyWorking: { type: Boolean, default: false },
  description: { type: String, trim: true },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  technologies: [{ type: String, trim: true }],
  link: { type: String, trim: true },
}, { _id: false });

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

 
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Invalid phone number'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },

   
    education: [educationSchema],
    experience: [experienceSchema],
    projects: [projectSchema],

    skills: [{
      type: String,
      trim: true,
    }],

    languages: [{
      name: { type: String, trim: true },
      proficiency: {
        type: String,
        enum: ['Basic', 'Intermediate', 'Fluent', 'Native'],
        default: 'Basic',
      },
    }],

   
    photoPath: {
      type: String,
      default: '',
      trim: true,
    },

    summary: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

resumeSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);