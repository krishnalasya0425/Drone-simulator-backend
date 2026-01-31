const PDFDocument = require("pdfkit");

/**
 * Generates a PDF report for a specific test set results (summary + student list).
 * @param {Object} data - Contains test set info and student results.
 * @param {string} fileName - Filename for the download.
 * @param {Response} res - Express response object.
 */
module.exports = function generateTestSetResultsPdf(data, fileName, res) {
    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}.pdf"`
    );

    doc.pipe(res);

    // ================= HEADER =================
    doc.fontSize(22).font('Helvetica-Bold').text("Sub-Test Result Report", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(16).font('Helvetica').text(data.set_name, { align: "center" });
    doc.moveDown(1);

    // ================= SUMMARY CARDS =================
    const results = data.results || [];
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const pending = results.filter(r => r.status === 'PENDING').length;

    const cardWidth = 120;
    const cardHeight = 40;
    const startX = 40;
    const gap = 15;

    // Draw Summary Boxes
    const currentY = doc.y;
    const drawCard = (label, value, color, x) => {
        doc.rect(x, currentY, cardWidth, cardHeight).fill('#f9fafb').stroke('#e5e7eb');
        doc.fillColor(color).fontSize(14).font('Helvetica-Bold').text(value.toString(), x + 10, currentY + 10);
        doc.fillColor('gray').fontSize(8).font('Helvetica').text(label, x + 10, currentY + 30);
    };

    drawCard("TOTAL", total, '#1e40af', startX);
    drawCard("PASSED", passed, '#047857', startX + cardWidth + gap);
    drawCard("FAILED", failed, '#b91c1c', startX + (cardWidth + gap) * 2);
    drawCard("PENDING", pending, '#b45309', startX + (cardWidth + gap) * 3);

    doc.y = currentY + cardHeight + 20; // Move y down after the cards row
    doc.fillColor('black').fontSize(10).font('Helvetica-Bold').text(`Pass Mark: ${data.pass_threshold} Correct`, 40, doc.y, { align: 'right', width: 510 });
    doc.moveDown(1);

    // ================= STUDENT TABLE =================
    const tableTop = doc.y;
    const colX = {
        sNo: 40,
        name: 70,
        batch: 230,
        score: 380,
        status: 480
    };

    // Table Header
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#074F06');
    doc.text("#", colX.sNo, tableTop);
    doc.text("STUDENT INFORMATION", colX.name, tableTop);
    doc.text("UNIT / COURSE", colX.batch, tableTop);
    doc.text("PERFORMANCE", colX.score, tableTop);
    doc.text("STATUS", colX.status, tableTop);

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#074F06').stroke();
    doc.moveDown(0.5);

    // Table Rows
    let y = doc.y;
    doc.fillColor('black').font('Helvetica');

    results.forEach((r, index) => {
        if (y > 720) {
            doc.addPage();
            y = 50;
        }

        doc.fontSize(9);
        doc.text(index + 1, colX.sNo, y);

        // Name and Army No (with Rank)
        doc.font('Helvetica-Bold').text(r.name, colX.name, y);
        doc.font('Helvetica').fontSize(8).fillColor('gray').text(`${r.rank || ''} - ${r.army_no}`, colX.name, y + 10);
        doc.fillColor('black').fontSize(9);

        // Unit and Course
        doc.text(r.unit, colX.batch, y);
        doc.fontSize(8).fillColor('gray').text(r.course_no, colX.batch, y + 10);
        doc.fillColor('black').fontSize(9);

        // Score
        const scoreText = r.score !== null ? `${r.score} / ${r.total_questions}` : "---";
        doc.text(scoreText, colX.score, y);

        // Status Tag
        const statusColor = r.status === 'PASS' ? '#047857' : (r.status === 'FAIL' ? '#b91c1c' : '#b45309');
        doc.fillColor(statusColor).font('Helvetica-Bold').text(r.status, colX.status, y);
        doc.fillColor('black').font('Helvetica');

        y += 30;
        doc.moveTo(40, y - 5).lineTo(550, y - 5).strokeColor('#f3f4f6').stroke();
    });

    // ================= FOOTER =================
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('gray').text(
            `Generated on: ${new Date().toLocaleString()} | Page ${i + 1} of ${pages.count}`,
            40,
            doc.page.height - 40,
            { align: "center" }
        );
    }

    doc.end();
};
