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
    rank: 160,
    army: 210,
    unit: 290,
    course: 380,
    score: 460,
  };

  doc.fontSize(11).text("S.No", colX.sNo, tableTop);
  doc.text("Name", colX.name, tableTop);
  doc.text("Rank", colX.rank, tableTop);
  doc.text("Army No", colX.army, tableTop);
  doc.text("Unit", colX.unit, tableTop);
  doc.text("Course No", colX.course, tableTop);
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
    doc.text(s.rank || '-', colX.rank, y);
    doc.text(s.army_no, colX.army, y);
    doc.text(s.unit, colX.unit, y);
    doc.text(s.course_no, colX.course, y);
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
