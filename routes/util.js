const express = require('express');
const Log = require('../models/Log');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, inputString } = req.body;

    if (!inputString || typeof inputString !== 'string') {
      return res.status(400).json({ message: 'inputString is required' });
    }

    const cleanInput = inputString.trim();
    const stringLength = cleanInput.length;

    const parts = cleanInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const skillCount = parts.length;
    const result = `Length: ${stringLength}, Skills Count: ${skillCount}`;

    await Log.create({
      userId: userId || null,
      inputString: cleanInput,
      result,
    });

    console.log(`[UTIL] Processed input for userId: ${userId || 'N/A'} | ${result}`);

    return res.json({
      message: 'Input processed successfully',
      result,
      length: stringLength,
      count: skillCount,
    });
  } catch (error) {
    console.error('Util route error:', error.message);
    return res.status(500).json({ message: 'Server error while processing input' });
  }
});

module.exports = router;
