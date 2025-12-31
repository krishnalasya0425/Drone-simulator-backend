const PDFDocument = require("pdfkit");

module.exports = function generateTestPdf(questions, testTitle, res) {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${testTitle}.pdf"`
  );

  doc.pipe(res);

  // ================= TITLE =================
  doc
    .fontSize(20)
    .text(testTitle, { align: "center" })
    .moveDown(1);

  // ================= QUESTIONS =================
  questions.forEach((q, index) => {
    doc
      .fontSize(13)
      .fillColor("black")
      .text(`${index + 1}. ${q.question_text}`);

    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Type: ${q.question_type}`)
      .moveDown(0.5);

    // OPTIONS (MCQ)
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt) => {
        doc
          .fontSize(11)
          .fillColor("black")
          .text(`   ${opt.key}) ${opt.value}`);
      });
    }

    // ANSWER
    doc
      .moveDown(0.3)
      .fontSize(11)
      .fillColor("green")
      .text(`Answer: ${q.answer}`);

    doc.moveDown(1);
  });

  doc.end();
};
