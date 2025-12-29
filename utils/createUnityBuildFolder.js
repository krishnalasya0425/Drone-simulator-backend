const fs = require("fs");
const path = require("path");

function createUnityBuildFolder(drive) {
  const folderPath = path.join(drive, "unity_builds");

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });

    // Windows: make folder hidden + read-only
    fs.chmodSync(folderPath, 0o444); // read-only
  }

  return folderPath;
}

module.exports = createUnityBuildFolder;
