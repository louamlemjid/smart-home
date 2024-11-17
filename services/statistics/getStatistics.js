// routes/statistics.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust the path as necessary

router.get('/statistics', async (req, res) => {
  try {
    // Get the number of devices for each user
    const deviceCounts = await User.aggregate([
      {
        $project: {
          name: 1,
          deviceCount: { $size: "$devices" }
        }
      }
    ]);

    // Send the response
    res.json(deviceCounts);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
});

module.exports = router;
