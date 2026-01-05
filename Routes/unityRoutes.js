const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const router = express.Router();

// Load the JSON mapping file
const buildPaths = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../unityBuildPaths.json"))
);


function launchUnityBuild(res, buildFolder) {
  if (!fs.existsSync(buildFolder)) {
    return res.status(404).json({ message: "Build folder not found" });
  }

  const files = fs.readdirSync(buildFolder);
  const exeFile = files.find((f) => f.endsWith(".exe"));

  if (!exeFile) {
    return res.status(404).json({ message: ".exe file not found" });
  }

  const exePath = path.join(buildFolder, exeFile);

  exec(`start "" "${exePath}"`, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to launch Unity build" });
    }
    res.json({ message: "Unity build launched successfully!" });
  });
}

router.get("/practice/:classId/:instructorId", (req, res) => {
  const { classId, instructorId } = req.params;
  const key = `${classId}_${instructorId}`;

  const classBuild = buildPaths[key];

  if (!classBuild || !classBuild.practice) {
    return res.status(404).json({ message: "Practice build not found" });
  }

  const buildFolder = classBuild.practice; // ✅ STRING PATH

  launchUnityBuild(res, buildFolder);
});

router.get("/exercise/:classId/:instructorId", (req, res) => {
  const { classId, instructorId } = req.params;
  const key = `${classId}_${instructorId}`;

  const classBuild = buildPaths[key];

  if (!classBuild || !classBuild.exercise) {
    return res.status(404).json({ message: "Exercise build not found" });
  }

  const buildFolder = classBuild.exercise; // ✅ STRING PATH

  launchUnityBuild(res, buildFolder);
});

module.exports = router;