const unzipper = require("unzipper");
const fs = require("fs");
const path = require("path");
const UnityModel = require("../Model/unityModel");

const UnityController = {
  async uploadBuild(req, res) {
    try {
      const { build_name, batch_no } = req.body;

      if (!req.file) return res.status(400).json({ message: "ZIP file required" });

      const zipPath = req.file.path;
      const extractPath = path.join(path.dirname(zipPath), path.basename(zipPath, ".zip"));

      // Extract ZIP
      await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .promise();

      // Remove original ZIP after extraction
      fs.unlinkSync(zipPath);

      // Save folder path in DB
      const buildId = await UnityModel.createBuild({
        build_name,
        batch_no,
        zip_path: extractPath,
        drive_letter: req.unityDrive
      });

      // Lock folder (read-only)
      fs.chmodSync(extractPath, 0o444);

      res.status(201).json({
        message: "Unity build uploaded & extracted successfully",
        buildId,
        folder: extractPath
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  },

  async getAll(req, res) {
    const builds = await UnityModel.getAll();
    res.json(builds);
  },

  async getByBatch(req, res) {
    const builds = await UnityModel.getByBatch(req.params.batch_no);
    res.json(builds);
  },

  async download(req, res) {
    const build = await UnityModel.getById(req.params.id);
    if (!build) return res.status(404).json({ message: "Build not found" });

    res.download(build.zip_path); // will download the extracted folder if zipped again or a zip link
  },

  async delete(req, res) {
    try {
      await UnityModel.deleteBuild(req.params.id);
      res.json({ message: "Unity build deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = UnityController;
