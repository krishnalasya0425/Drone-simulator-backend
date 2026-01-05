const PDFDocument = require("pdfkit");

/**
 * Generates a PDF report for all test sets under a specific test (results + question keys).
 * @param {Object} data - Contains test info, sets, student results, and questions.
 * @param {string} fileName - Filename for the download.
 * @param {Response} res - Express response object.
 */
module.exports = function generateAllSetsReportPdf(data, fileName, res) {
    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}.pdf"`
    );

    doc.pipe(res);

    // ================= MAIN HEADER =================
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#074F06').text("Comprehensive Test Report", { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(14).font('Helvetica').fillColor('black').text(data.test_title, { align: "center" });
    doc.moveDown(1);

    data.sets.forEach((set, setIndex) => {
        if (doc.y > 600) {
            doc.addPage();
        } else if (setIndex > 0) {
            doc.moveDown(2);
            doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
            doc.moveDown(2);
        }

        // ================= SET HEADER =================
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#074F06').text(`REPORT: ${set.set_name}`, { align: "left" });
        doc.moveDown(0.5);

        // ================= SUMMARY CARDS =================
        const results = set.results || [];
        const total = results.length;
        const passed = results.filter(r => r.status === 'PASS').length;
        const failed = results.filter(r => r.status === 'FAIL').length;
        const pending = results.filter(r => r.status === 'PENDING').length;

        const cardWidth = 120;
        const cardHeight = 35;
        const startX = 40;
        const gap = 15;

        const currentY = doc.y;
        const drawCard = (label, value, color, x) => {
            doc.rect(x, currentY, cardWidth, cardHeight).fill('#f9fafb').stroke('#e5e7eb');
            doc.fillColor(color).fontSize(12).font('Helvetica-Bold').text(value.toString(), x + 10, currentY + 8);
            doc.fillColor('gray').fontSize(7).font('Helvetica').text(label, x + 10, currentY + 23);
        };

        drawCard("TOTAL", total, '#1e40af', startX);
        drawCard("PASSED", passed, '#047857', startX + cardWidth + gap);
        drawCard("FAILED", failed, '#b91c1c', startX + (cardWidth + gap) * 2);
        drawCard("PENDING", pending, '#b45309', startX + (cardWidth + gap) * 3);

        doc.y = currentY + cardHeight + 10;
        doc.fillColor('black').fontSize(8).font('Helvetica-Bold').text(`Pass Mark: ${set.pass_threshold} Correct`, 40, doc.y, { align: 'right', width: 510 });
        doc.moveDown(0.8);

        // ================= STUDENT TABLE =================
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#074F06').text("Student Performance", 40, doc.y);
        doc.moveDown(0.3);

        let tableTop = doc.y;
        const colX = { sNo: 40, name: 70, batch: 230, score: 380, status: 480 };

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#074F06');
        doc.text("#", colX.sNo, tableTop);
        doc.text("STUDENT INFORMATION", colX.name, tableTop);
        doc.text("BATCH / REGIMENT", colX.batch, tableTop);
        doc.text("PERFORMANCE", colX.score, tableTop);
        doc.text("STATUS", colX.status, tableTop);

        doc.moveDown(0.2);
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#074F06').stroke();
        doc.moveDown(0.2);

        let rowY = doc.y;
        doc.fillColor('black').font('Helvetica');

        results.forEach((r, index) => {
            if (rowY > 750) {
                doc.addPage();
                rowY = 50;
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#074F06');
                doc.text("#", colX.sNo, rowY);
                doc.text("STUDENT INFO", colX.name, rowY);
                doc.text("BATCH", colX.batch, rowY);
                doc.text("SCORE", colX.score, rowY);
                doc.text("STATUS", colX.status, rowY);
                rowY += 15;
                doc.moveTo(40, rowY).lineTo(550, rowY).strokeColor('#074F06').stroke();
                rowY += 10;
            }

            doc.fontSize(8);
            doc.fillColor('black').text(index + 1, colX.sNo, rowY);
            doc.font('Helvetica-Bold').text(r.name, colX.name, rowY);
            doc.font('Helvetica').fontSize(7).fillColor('gray').text(r.army_id, colX.name, rowY + 9);
            doc.fillColor('black').fontSize(8).text(r.batch_no || "---", colX.batch, rowY);
            doc.fontSize(7).fillColor('gray').text(r.regiment || "---", colX.batch, rowY + 9);
            doc.fillColor('black').fontSize(8).text(r.score !== null ? `${r.score} / ${r.total_questions}` : "---", colX.score, rowY);

            const statusColor = r.status === 'PASS' ? '#047857' : (r.status === 'FAIL' ? '#b91c1c' : '#b45309');
            doc.fillColor(statusColor).font('Helvetica-Bold').text(r.status, colX.status, rowY);
            doc.fillColor('black');

            rowY += 25;
            doc.moveTo(40, rowY - 5).lineTo(550, rowY - 5).strokeColor('#f3f4f6').lineWidth(0.5).stroke();
        });

        doc.y = rowY + 10;

        // ================= QUESTIONS SECTION =================
        if (doc.y > 650) doc.addPage();

        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#074F06').text(`Question Bank & Answer Key for ${set.set_name}`, 40, doc.y);
        doc.moveDown(0.5);

        const qList = set.questions || [];
        qList.forEach((q, qIndex) => {
            // Check if question + options will fit
            if (doc.y > 700) {
                doc.addPage();
            }

            const startQY = doc.y;
            doc.fontSize(9).font('Helvetica-Bold').fillColor('black').text(`${qIndex + 1}. ${q.question_text}`, 40, doc.y, { width: 510 });
            doc.moveDown(0.2);

            // Options
            if (q.options && q.options.length > 0) {
                q.options.forEach(opt => {
                    const isCorrect = opt.key === q.answer;
                    if (isCorrect) {
                        doc.fontSize(8).font('Helvetica-Bold').fillColor('#047857').text(`   [${opt.key}] ${opt.value} (Correct)`, 50, doc.y);
                    } else {
                        doc.fontSize(8).font('Helvetica').fillColor('#4b5563').text(`   [${opt.key}] ${opt.value}`, 50, doc.y);
                    }
                    doc.moveDown(0.1);
                });
            } else {
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#047857').text(`   Correct Answer: ${q.answer}`, 50, doc.y);
            }

            doc.fillColor('black');
            doc.moveDown(0.5);
        });

        doc.y += 20;
    });

    // ================= FOOTER =================
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor('gray').text(
            `Generated on: ${new Date().toLocaleString()} | Page ${i + 1} of ${pages.count}`,
            40,
            doc.page.height - 30,
            { align: "center" }
        );
    }

    doc.end();
};
