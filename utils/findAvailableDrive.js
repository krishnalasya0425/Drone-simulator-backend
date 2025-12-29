const checkDiskSpace = require("check-disk-space").default;

const DRIVES = ["C:", "D:", "E:", "F:"]; // adjust if needed
const MIN_FREE_SPACE = 5 * 1024 * 1024 * 1024; // 5 GB

async function findAvailableDrive() {
  for (const drive of DRIVES) {
    try {
      const { free } = await checkDiskSpace(drive);
      if (free >= MIN_FREE_SPACE) {
        return drive;
      }
    } catch (err) {
      // ignore inaccessible drives
    }
  }
  throw new Error("No drive has sufficient free space");
}

module.exports = findAvailableDrive;
