const PDFDocument = require("pdfkit");

/**
 * Generates a PDF report for a student's full profile (details, classes, tests).
 * @param {Object} data - Contains student details, classes array, and tests array.
 * @param {string} fileName - Suggestion for the downloaded filename.
 * @param {Response} res - Express response object.
 */
module.exports = function generateStudentProfilePdf(data, fileName, res) {
    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}.pdf"`
    );

    doc.pipe(res);

    // ================= HEADER =================
    doc.fillColor('#074F06').fontSize(22).font('Helvetica-Bold').text("Student Profile Report", { align: "center" });
    doc.moveDown(0.3);
    doc.fillColor('gray').fontSize(10).font('Helvetica').text("Map Reading Training Platform - Management Console", { align: "center" });
    doc.moveDown(1.5);

    // ================= PROFILE BOX =================
    const startY = doc.y;
    doc.rect(40, startY, 510, 100).fill('#f8fafc').stroke('#e5e7eb');

    doc.fillColor('#074F06').fontSize(18).font('Helvetica-Bold').text(data.name, 60, startY + 20);
    doc.fillColor('#374151').fontSize(11).font('Helvetica').text(`Rank: ${data.rank || 'N/A'}`, 60, startY + 45);
    doc.text(`Army No: ${data.army_no || data.armyId || 'N/A'}`, 60, startY + 58);
    doc.text(`Unit: ${data.unit || 'N/A'}`, 60, startY + 71);
    doc.text(`Course No: ${data.course_no || 'N/A'}`, 60, startY + 84);

    doc.y = startY + 120;

    // ================= ENROLLED CLASSES =================
    doc.fillColor('#074F06').fontSize(14).font('Helvetica-Bold').text("Enrolled Classes", 40, doc.y, { underline: true });
    doc.moveDown(0.8);

    if (data.classes && data.classes.length > 0) {
        data.classes.forEach((cls, index) => {
            doc.fillColor('#374151').fontSize(11).font('Helvetica-Bold').text(`${index + 1}. ${cls.class_name}`, 55, doc.y);
            doc.fontSize(9).font('Helvetica').fillColor('gray').text(`Class ID: ${cls.id}`, 70, doc.y);
            doc.moveDown(0.3);

            if (doc.y > 750) doc.addPage();
        });
    } else {
        doc.fillColor('gray').fontSize(10).font('Helvetica-Oblique').text("No classes assigned yet.", 55, doc.y);
    }
    doc.moveDown(1.5);

    // ================= ATTEMPTED TESTS =================
    doc.fillColor('#074F06').fontSize(14).font('Helvetica-Bold').text("Attempted Tests History", 40, doc.y, { underline: true });
    doc.moveDown(0.8);

    // Table Header
    const tableTop = doc.y;
    const colX = { name: 40, type: 180, status: 300, score: 400 };

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#074F06');
    doc.text("TEST TITLE", colX.name, tableTop);
    doc.text("EXAM TYPE", colX.type, tableTop);
    doc.text("STATUS", colX.status, tableTop);
    doc.text("SCORE", colX.score, tableTop);

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.5);

    let y = doc.y;
    if (data.tests && data.tests.length > 0) {
        data.tests.forEach((t) => {
            if (y > 720) {
                doc.addPage();
                y = 50;
            }
            const attempted = t.score !== null;

            doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold').text(t.test_title || t.title, colX.name, y, { width: 130 });
            doc.fillColor('gray').fontSize(8).font('Helvetica').text(t.exam_type || 'STANDARD', colX.type, y);

            const statusColor = attempted ? '#047857' : '#9ca3af';
            doc.fillColor(statusColor).font('Helvetica-Bold').text(attempted ? 'COMPLETED' : 'PENDING', colX.status, y);

            const scoreText = attempted ? `${t.score} / ${t.total_questions}` : "--";
            doc.fillColor('#074F06').font('Helvetica-Bold').text(scoreText, colX.score, y);

            y += 35;
            doc.moveTo(40, y - 5).lineTo(550, y - 5).strokeColor('#f3f4f6').stroke();
        });
    } else {
        doc.fillColor('gray').fontSize(10).font('Helvetica-Oblique').text("No test attempts recorded.", 40, y + 10);
    }

    // ================= FOOTER =================
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(9).fillColor('gray').text(
            `Generated on: ${new Date().toLocaleString()} | Page ${i + 1} of ${pages.count}`,
            40,
            doc.page.height - 40,
            { align: "center", width: doc.page.width - 80 }
        );
    }

    doc.end();
};
