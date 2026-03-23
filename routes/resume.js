const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Resume = require('../models/Resume');
const Log = require('../models/Log');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    const fileName = `${Date.now()}-${safeName}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

function getRedirectUrlByLanguage(languagesInput) {
  const text = String(languagesInput || '').toLowerCase();

  if (text.includes('hindi')) {
    return '/resume.html?lang=hi';
  }

  if (text.includes('french')) {
    return '/resume.html?lang=fr';
  }

  if (text.includes('spanish')) {
    return '/resume.html?lang=es';
  }

  return '/dashboard.html?lang=en';
}

async function saveResumeHandler(req, res) {
  try {
    const {
      userId,
      name,
      email,
      phone,
      address,
      education,
      skills,
      languages,
    } = req.body;

    console.log(`[RESUME] Save attempt for userId: ${userId || 'N/A'}`);

    if (!userId || !name || !email || !phone) {
      console.log('[RESUME] Save failed: Missing required fields');
      return res.status(400).json({ message: 'userId, name, email and phone are required' });
    }

    const photoPath = req.file ? `/uploads/${req.file.filename}` : '';

    if (photoPath) {
      console.log(`[RESUME] Photo uploaded: ${photoPath}`);
    } else {
      console.log('[RESUME] No photo uploaded');
    }

    const educationData = education
      ? [{ institution: education, degree: 'Not Specified' }]
      : [];

    const skillsData = skills
      ? skills
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const languagesData = languages
      ? languages
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .map((lang) => ({ name: lang, proficiency: 'Basic' }))
      : [];

    const resume = new Resume({
      userId,
      name,
      email,
      phone,
      address,
      education: educationData,
      skills: skillsData,
      languages: languagesData,
      photoPath,
    });

    await resume.save();
    console.log(`[RESUME] Saved successfully with id: ${resume._id}`);

    const redirectUrl = getRedirectUrlByLanguage(languages);

    await Log.create({
      userId,
      inputString: 'CREATE_RESUME',
      result: `Resume created successfully: ${resume._id}`,
    });

    if (req.query.redirect === 'true') {
      return res.redirect(redirectUrl);
    }

    return res.status(201).json({
      message: 'Resume saved successfully',
      resume,
      redirectUrl,
    });
  } catch (error) {
    console.error('Resume save error:', error.message);
    console.log('[RESUME] Save failed due to server error');

    if (req.body && req.body.userId) {
      await Log.create({
        userId: req.body.userId,
        inputString: 'CREATE_RESUME',
        result: `Resume creation failed: ${error.message}`,
      }).catch(() => {});
    }

    return res.status(500).json({ message: 'Server error while saving resume' });
  }
}

router.post('/', upload.single('photo'), saveResumeHandler);
router.post('/save', upload.single('photo'), saveResumeHandler);

module.exports = router;
