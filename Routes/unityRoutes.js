const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const unityBuildController = require("../Controller/unityBuildController");
const unityBuildModel = require("../Model/unityBuildModel");

const router = express.Router();

// Helper function to launch Unity build
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

// Launch practice build for a class
router.get("/practice/:classId", async (req, res) => {
  try {
    const { classId } = req.params;

    // Get practice build from database
    const build = await unityBuildModel.getBuildByClassAndType(classId, 'practice');

    if (!build) {
      return res.status(404).json({
        success: false,
        message: "No practice build configured for this class. Please ask your instructor to upload a practice build."
      });
    }

    const buildFolder = build.build_path;

    launchUnityBuild(res, buildFolder);
  } catch (error) {
    console.error("Error launching practice build:", error);
    res.status(500).json({
      success: false,
      message: "Failed to launch practice build",
      error: error.message
    });
  }
});

// Launch exercise build for a class
router.get("/exercise/:classId", async (req, res) => {
  try {
    const { classId } = req.params;

    // Get exercise build from database
    const build = await unityBuildModel.getBuildByClassAndType(classId, 'exercise');

    if (!build) {
      return res.status(404).json({
        success: false,
        message: "No exercise build configured for this class. Please ask your instructor to upload an exercise build."
      });
    }

    const buildFolder = build.build_path;

    launchUnityBuild(res, buildFolder);
  } catch (error) {
    console.error("Error launching exercise build:", error);
    res.status(500).json({
      success: false,
      message: "Failed to launch exercise build",
      error: error.message
    });
  }
});

// Build management routes
router.post("/builds", unityBuildController.upsertBuild);
router.get("/builds/:class_id", unityBuildController.getBuildsByClass);
router.get("/builds/:class_id/:build_type", unityBuildController.getBuildByClassAndType);
router.delete("/builds/:class_id/:build_type", unityBuildController.deleteBuild);

module.exports = router;
