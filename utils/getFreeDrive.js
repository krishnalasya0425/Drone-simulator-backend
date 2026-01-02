const checkDiskSpace = require("check-disk-space").default;
const fs = require("fs");
const path = require("path");

const drives = ["C:", "D:", "E:", "F:"]; // Windows

async function getFreeDrive() {
  let maxFree = 0;
  let selected = null;

  for (const drive of drives) {
    try {
      const { free } = await checkDiskSpace(drive);
      if (free > maxFree) {
        maxFree = free;
        selected = drive;
      }
    } catch {}
  }

  return selected;
}

module.exports = async function createVRFolder() {
  const drive = await getFreeDrive();
  if (!drive) throw new Error("No free drive found");

  const basePath = path.join(drive, "VR_MODULES");
  if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);

  return basePath;
};