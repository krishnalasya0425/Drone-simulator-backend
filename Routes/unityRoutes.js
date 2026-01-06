

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
  const exeName = exeFile.replace('.exe', '');

  // Professional Launch Sequence:
  // 1. Minimize all windows to clear the view (including browser)
  // 2. Start the VR process
  // 3. Wait for it to initialize
  // 4. Force focus to the new window
  const command = `powershell -Command "$shell = New-Object -ComObject Shell.Application; $shell.MinimizeAll(); Start-Process '${exePath}'; Start-Sleep -s 5; $wshell = New-Object -ComObject WScript.Shell; $wshell.AppActivate('${exeName}')"`;

  exec(command, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to launch VR application" });
    }
    res.json({ message: "VR application launched and focused!" });
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