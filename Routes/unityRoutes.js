const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const router = express.Router();

// Load the JSON mapping file
const buildPaths = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../unityBuildPaths.json"))
);

router.get("/practice/:classId/:instructorId", async (req, res) => {
  try {
    const { classId, instructorId } = req.params;

    // 1️⃣ Find the build path from JSON
    const key = `${classId}_${instructorId}`;
    const buildFolder = buildPaths[key];

    if (!buildFolder) {
      return res.status(404).json({ message: "Build path not found" });
    }

    // 2️⃣ Find the .exe file in that folder
    const files = fs.readdirSync(buildFolder);
    const exeFile = files.find((f) => f.endsWith(".exe"));

    if (!exeFile) {
      return res.status(404).json({ message: ".exe file not found" });
    }

    const exePath = path.join(buildFolder, exeFile);

    // 3️⃣ Execute the Unity build
    exec(`start "" "${exePath}"`, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to launch Unity build" });
      }
      res.json({ message: "Unity build launched successfully!" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;