const PDFDocument = require("pdfkit");

/**
 * Generates a PDF report for a single student's test attempt.
 * @param {Object} data - Contains student details, test title, and questions array.
 * @param {string} fileName - Suggestion for the downloaded filename.
 * @param {Response} res - Express response object.
 */
module.exports = function generateResultPdf(data, fileName, res) {
    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}.pdf"`
    );

    doc.pipe(res);

    // ================= HEADER =================
    doc.fontSize(22).font('Helvetica-Bold').text("Test Performance Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').text(data.test_title, { align: "center" });
    doc.moveDown(1.5);

    // ================= STUDENT INFO =================
    doc.fontSize(12).font('Helvetica-Bold').text("Student Details:", { underline: true });
    doc.moveDown(0.3);

    doc.fontSize(11).font('Helvetica').text(`Name: ${data.student_name}`);
    doc.text(`Army ID: ${data.army_id}`);
    doc.text(`Regiment: ${data.regiment}`);
    doc.text(`Batch: ${data.batch_no}`);
    doc.moveDown(0.5);

    // ================= SUMMARY CARDS =================
    const percentage = Math.round((data.score / data.total_questions) * 100);
    const cardWidth = 125;
    const cardHeight = 45;
    const startX = 40;
    const gap = 10;
    const currentYHeader = doc.y;

    const drawSummaryCard = (label, value, x) => {
        doc.rect(x, currentYHeader, cardWidth, cardHeight).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('gray').fontSize(8).font('Helvetica').text(label, x + 10, currentYHeader + 10);
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(value, x + 10, currentYHeader + 22);
    };

    drawSummaryCard("PERCENTAGE", `${percentage}%`, startX);
    drawSummaryCard("TIME TAKEN", `${data.duration} mins`, startX + cardWidth + gap);
    drawSummaryCard("PASS MARK", `${data.pass_threshold} Score`, startX + (cardWidth + gap) * 2);
    drawSummaryCard("EXAM CODE", `#${data.test_id}`, startX + (cardWidth + gap) * 3);

    doc.moveDown(4);

    // Status with proper color
    const finalStatusColor = data.status === 'PASS' ? '#16a34a' : '#dc2626';
    doc.fontSize(12).font('Helvetica-Bold').fillColor(finalStatusColor).text(`FINAL STATUS: ${data.status}`, 40, doc.y, { align: 'right', width: 510 });
    doc.moveDown(1);

    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#000').stroke();
    doc.moveDown(1);

    // ================= QUESTIONS =================
    doc.fontSize(14).font('Helvetica-Bold').fillColor('black').text("Question Analysis:", 40, doc.y, { underline: true });
    doc.moveDown(0.8);

    data.questions.forEach((q, index) => {
        const isCorrect = q.selected_answer === q.correct_answer;

        // Auto page break if needed
        if (doc.y > 650) {
            doc.addPage();
        }

        // Question Container
        const startY = doc.y;

        // Question Text
        doc.fontSize(11).font('Helvetica-Bold').fillColor('black').text(`${index + 1}. ${q.question_text}`, 40, doc.y, { width: 510 });
        doc.moveDown(0.5);

        // Options
        if (q.options && q.options.length > 0) {
            q.options.forEach((opt) => {
                const isSelected = q.selected_answer === opt.key;
                const isOptionCorrect = q.correct_answer === opt.key;

                let textColor = '#374151';
                let indicator = '';

                if (isOptionCorrect) {
                    textColor = '#166534'; // Dark green text
                    indicator = '  [Correct]';
                } else if (isSelected && !isCorrect) {
                    textColor = '#991b1b'; // Dark red text
                    indicator = '  [Selected]';
                }

                // Draw option text with explicit X and width
                doc.fillColor(textColor)
                    .fontSize(10)
                    .font(isSelected || isOptionCorrect ? 'Helvetica-Bold' : 'Helvetica')
                    .text(`${opt.key}. ${opt.value}${indicator}`, 60, doc.y, { width: 490 });
                doc.moveDown(0.2);
            });

            doc.moveDown(0.3);
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#2563eb')
                .text(`Result: ${isCorrect ? 'Correct' : 'Incorrect'}  |  Correct: ${q.correct_answer}  |  Selected: ${q.selected_answer || 'None'}`, 40, doc.y, { width: 510 });
        } else {
            // Textual fallback
            doc.fontSize(10).font('Helvetica').fillColor(isCorrect ? 'green' : 'red').text(isCorrect ? '✓ Correct' : '✗ Incorrect', 40, doc.y);
            doc.fillColor('black').text(`Selected: ${q.selected_answer || 'None'}`, 40, doc.y);
            doc.fillColor('green').text(`Correct: ${q.correct_answer}`, 40, doc.y);
        }

        doc.moveDown(1.5);
        doc.fillColor('black').font('Helvetica');

        // Horizontal line between questions
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#e5e7eb').stroke();
        doc.moveDown(1);
    });

    // ================= FOOTER =================
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(9).fillColor('gray').text(
            `Generated on: ${new Date().toLocaleString()} | Page ${i + 1} of ${pages.count}`,
            40,
            doc.page.height - 50,
            { align: "center", width: doc.page.width - 80 }
        );
    }

    doc.end();
};
