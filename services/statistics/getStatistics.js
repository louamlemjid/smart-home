// routes/statistics.js
const express = require('express');
const router = express.Router();
const {User}= require('../../db'); // Adjust the path as necessary

router.get('/', async (req, res) => {
  try {
    // Get the number of devices for each user
    const deviceCounts = await User.aggregate([
      {
        $group: {
          _id: null,  // Grouping everything into a single group
          totalDevices: { $sum: { $size: "$devices" } }, // Sum the number of devices
          totalUsers: { $sum: 1 },  // Count the number of users
        }
      }
    ]);
    console.log("deviceCounts:", deviceCounts[0]);
    // Send the response
    res.status(200).json(deviceCounts[0]);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(400).json({ message: "Error fetching statistics" });
  }
});

module.exports = router;
