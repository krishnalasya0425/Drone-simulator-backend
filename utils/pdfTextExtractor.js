const pdf = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');

/**
 * Extract text from PDF using pdf-parse with lenient error handling
 */
async function extractWithPdfParse(dataBuffer, options = {}) {
    const render_page = async (pageData) => {
        const render_options = {
            normalizeWhitespace: false,
            disableCombineTextItems: false
        };

        const textContent = await pageData.getTextContent(render_options);

        // Sort items by Y (descending) then X (ascending)
        const items = textContent.items.map(item => {
            let x = 0;
            let y = 0;

            // Handle transform array safely
            if (Array.isArray(item.transform) && item.transform.length >= 6) {
                x = item.transform[4];
                y = item.transform[5];
            }

            return {
                str: item.str,
                x: x,
                y: y,
                hasEOL: item.hasEOL,
                height: item.height || 0
            };
        });

        // Sort with tolerance for Y
        items.sort((a, b) => {
            const yDiff = Math.abs(a.y - b.y);
            if (yDiff < (a.height || 5)) { // Same line if Y is close
                return a.x - b.x;
            }
            return b.y - a.y; // Higher Y first (Top to Bottom)
        });

        // Reconstruct text with basic spacing
        let pageText = '';
        let lastY = null;
        let lastX = 0;

        for (const item of items) {
            // Check if we dropped to a new line
            if (lastY !== null && (lastY - item.y) > 10) {
                pageText += '\n';
            }
            // Check if there is a gap between words on same line
            else if (lastX > 0 && (item.x - lastX) > 5) {
                pageText += ' ';
            }

            pageText += item.str;

            lastY = item.y;
            // Approximate width logic
            lastX = item.x + (item.str.length * 5);
        }

        return pageText + "\n";
    };

    const parseOptions = {
        pagerender: render_page,
        max: 0, // Parse all pages
        version: 'v1.10.100',
        ...options
    };

    const data = await pdf(dataBuffer, parseOptions);
    return data.text;
}

/**
 * Extract text from PDF using pdf-lib (validates structure and attempts basic extraction)
 */
async function extractWithPdfLib(dataBuffer) {
    try {
        // Try to load with lenient settings
        const pdfDoc = await PDFDocument.load(dataBuffer, {
            ignoreEncryption: true,
            updateMetadata: false,
            throwOnInvalidObject: false
        });

        const pages = pdfDoc.getPages();
        console.log(`✓ PDF structure validated: ${pages.length} pages found`);

        // pdf-lib doesn't extract text directly, but if we got here, the PDF is structurally valid
        // We can try to get the raw content
        const form = pdfDoc.getForm();
        const fields = form.getFields();

        if (fields.length > 0) {
            let text = '';
            fields.forEach(field => {
                const name = field.getName();
                text += `${name}\n`;
            });
            if (text.trim().length > 0) {
                return text;
            }
        }

        throw new Error('PDF structure is valid but text extraction requires pdf-parse');
    } catch (error) {
        throw new Error(`pdf-lib validation failed: ${error.message}`);
    }
}

/**
 * Main extraction function with fallback methods
 */
async function extractTextFromPdfBuffer(dataBuffer) {
    let lastError = null;
    let attemptedMethods = [];

    // Method 1: Try pdf-parse with standard settings
    try {
        console.log('📄 Attempting PDF extraction with pdf-parse (standard)...');
        attemptedMethods.push('pdf-parse-standard');
        const text = await extractWithPdfParse(dataBuffer);

        if (text && text.trim().length > 0) {
            console.log('✅ Successfully extracted text with pdf-parse');
            return { text };
        }

        throw new Error('No text content extracted');
    } catch (error) {
        console.log('⚠️ pdf-parse (standard) failed:', error.message);
        lastError = error;
    }

    // Method 2: Try pdf-lib to validate structure
    try {
        console.log('📄 Validating PDF structure with pdf-lib...');
        attemptedMethods.push('pdf-lib');
        const text = await extractWithPdfLib(dataBuffer);

        if (text && text.trim().length > 0) {
            console.log('✅ Successfully extracted text with pdf-lib');
            return { text };
        }
    } catch (error) {
        console.log('⚠️ pdf-lib validation:', error.message);
        lastError = error;
    }

    // Method 3: Try pdf-parse with a repaired buffer
    try {
        console.log('📄 Attempting PDF repair and re-extraction...');
        attemptedMethods.push('pdf-parse-repair');

        // Load with pdf-lib to repair structure
        const pdfDoc = await PDFDocument.load(dataBuffer, {
            ignoreEncryption: true,
            updateMetadata: false,
            throwOnInvalidObject: false
        });

        // Save to get a repaired version
        const repairedBuffer = await pdfDoc.save({
            useObjectStreams: false,
            addDefaultPage: false,
            objectsPerTick: 50
        });

        // Try parsing the repaired version
        const text = await extractWithPdfParse(Buffer.from(repairedBuffer));

        if (text && text.trim().length > 0) {
            console.log('✅ Successfully extracted text after PDF repair');
            return { text };
        }

        throw new Error('No text content extracted from repaired PDF');
    } catch (error) {
        console.log('⚠️ PDF repair attempt failed:', error.message);
        lastError = error;
    }

    // All methods failed
    console.error('❌ All PDF extraction methods failed');
    console.error('Attempted methods:', attemptedMethods.join(', '));

    throw new Error(
        `Failed to extract text from PDF after trying ${attemptedMethods.length} methods. ` +
        `The file may be corrupted, image-based, password-protected, or in an unsupported format. ` +
        `Last error: ${lastError.message}`
    );
}

module.exports = { extractTextFromPdfBuffer };
