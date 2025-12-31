const PDFDocument = require("pdfkit");

module.exports = function generateTestScorePdf(data, fileName, res) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}.pdf"`
  );

  doc.pipe(res);

  /* ================= HEADER ================= */
  doc
    .fontSize(20)
    .text(data.test_title, { align: "center" })
    .moveDown(0.3);

  doc
    .fontSize(13)
    .text(`Class: ${data.class_name}`, { align: "center" })
    .moveDown(1.5);

  /* ================= TABLE HEADER ================= */
  const tableTop = doc.y;
  const colX = {
    sNo: 40,
    name: 70,
    army: 170,
    regiment: 260,
    batch: 350,
    score: 420,
  };

  doc.fontSize(11).text("S.No", colX.sNo, tableTop);
  doc.text("Name", colX.name, tableTop);
  doc.text("Army ID", colX.army, tableTop);
  doc.text("Regiment", colX.regiment, tableTop);
  doc.text("Batch", colX.batch, tableTop);
  doc.text("Score", colX.score, tableTop);

  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();

  /* ================= TABLE ROWS ================= */
  let y = doc.y + 5;

  data.students.forEach((s, index) => {
    const scoreText =
      s.score !== null ? `${s.score}/${s.total_questions}` : "Not Attempted";

    doc.fontSize(10);
    doc.text(index + 1, colX.sNo, y);
    doc.text(s.name, colX.name, y);
    doc.text(s.army_id, colX.army, y);
    doc.text(s.regiment, colX.regiment, y);
    doc.text(s.batch_no, colX.batch, y);
    doc.text(scoreText, colX.score, y);

    y += 22;

    // Auto page break
    if (y > 760) {
      doc.addPage();
      y = 50;
    }
  });

  /* ================= FOOTER ================= */
  doc
    .moveDown(2)
    .fontSize(9)
    .fillColor("gray")
    .text(
      `Generated on: ${new Date().toLocaleString()}`,
      { align: "right" }
    );

  doc.end();
};
