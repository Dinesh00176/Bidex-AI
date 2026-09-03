const fs = require('fs');
const pdfParse = require('pdf-parse');
const logger = require('../utils/logger');

const MINIMUM_TEXT_LENGTH = 50;

/**
 * Validates whether buffer contains the standard PDF magic header (%PDF-)
 */
const validatePdfMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 5) return false;
  const headerSlice = buffer.slice(0, Math.min(buffer.length, 1024)).toString('latin1');
  return headerSlice.includes('%PDF-');
};

/**
 * Parses a PDF buffer or file path and extracts text split page-by-page.
 * Handles:
 * - Normal text PDFs (extracts pages + fullText)
 * - Scanned/image-only PDFs (throws SCANNED_IMAGE_PDF error without calling Gemini)
 * - Invalid/corrupted PDFs (throws INVALID_PDF_FORMAT / CORRUPTED_PDF)
 * 
 * Returns { pageCount, extractedPages: [{ pageNumber, text, wordCount }], fullText }
 */
const extractPdfPages = async (filePathOrBuffer) => {
  let dataBuffer;
  try {
    if (typeof filePathOrBuffer === 'string') {
      dataBuffer = fs.readFileSync(filePathOrBuffer);
    } else {
      dataBuffer = filePathOrBuffer;
    }
  } catch (readErr) {
    logger.error('Failed to read PDF file buffer', readErr);
    const err = new Error(`Unable to read PDF file: ${readErr.message}`);
    err.code = 'FILE_READ_ERROR';
    throw err;
  }

  // 1. Validate PDF Signature (Magic Bytes)
  if (!validatePdfMagicBytes(dataBuffer)) {
    logger.warn('Uploaded file rejected: Missing %PDF- magic signature bytes');
    const err = new Error('Invalid file format. The file is not a valid standard PDF document.');
    err.code = 'INVALID_PDF_FORMAT';
    throw err;
  }

  let pages = [];
  let currentPage = 1;
  let parsed = null;

  // 2. Primary Attempt: Custom pagerender with defensive checks
  try {
    const options = {
      pagerender: (pageData) => {
        return pageData.getTextContent().then((textContent) => {
          let lastY;
          let text = '';

          if (textContent && Array.isArray(textContent.items)) {
            for (let item of textContent.items) {
              if (!item) continue;
              const str = typeof item.str === 'string' ? item.str : '';
              const yCoord = (item.transform && Array.isArray(item.transform) && item.transform.length >= 6)
                ? item.transform[5]
                : null;

              if (yCoord === null || lastY === undefined || lastY === yCoord) {
                text += str + ' ';
              } else {
                text += '\n' + str + ' ';
              }

              if (yCoord !== null) {
                lastY = yCoord;
              }
            }
          }

          const cleanedText = text.replace(/\s+/g, ' ').trim();
          const wordCount = cleanedText ? cleanedText.split(/\s+/).length : 0;

          pages.push({
            pageNumber: currentPage++,
            text: cleanedText,
            wordCount
          });

          return text;
        }).catch((err) => {
          logger.warn(`Page render promise error on page ${currentPage}`, err.message);
          return '';
        });
      }
    };

    parsed = await pdfParse(new Uint8Array(dataBuffer), options);
  } catch (pagerErr) {
    logger.warn('Custom pagerender failed, falling back to standard pdf-parse extraction', pagerErr.message);
    pages = [];
  }

  // 3. Secondary Attempt: Standard pdf-parse fallback
  if (!parsed || pages.length === 0 || pages.every(p => p.text.length === 0)) {
    try {
      parsed = await pdfParse(new Uint8Array(dataBuffer));
    } catch (stdErr) {
      logger.error('Standard pdfParse failed on document', stdErr.message);
      const err = new Error(`Invalid or corrupted PDF document. Please ensure it is a valid, readable PDF file.`);
      err.code = 'CORRUPTED_PDF';
      throw err;
    }

    const fullText = (parsed && parsed.text) ? parsed.text.trim() : '';

    if (fullText.length > 0) {
      const rawPages = fullText.split(/\f|\n\s*---+\s*Page\s+\d+\s*---+/i);
      pages = rawPages.map((pageText, idx) => {
        const cleaned = pageText.replace(/\s+/g, ' ').trim();
        return {
          pageNumber: idx + 1,
          text: cleaned,
          wordCount: cleaned ? cleaned.split(/\s+/).length : 0
        };
      }).filter(p => p.text.length > 0);

      if (pages.length === 0) {
        pages = [{
          pageNumber: 1,
          text: fullText,
          wordCount: fullText.split(/\s+/).length
        }];
      }
    }
  }

  const totalPages = (parsed && parsed.numpages) ? parsed.numpages : (pages.length || 1);
  const fullText = (parsed && parsed.text && parsed.text.trim().length > 0)
    ? parsed.text.trim()
    : pages.map(p => p.text).join('\n\n').trim();

  // 4. Distinguish Scanned / Image-only PDFs (< MINIMUM_TEXT_LENGTH)
  if (!fullText || fullText.length < MINIMUM_TEXT_LENGTH || pages.every(p => p.wordCount < 5)) {
    logger.warn(`PDF has ${totalPages} pages but contains insufficient text (${fullText.length} chars). Scanned PDF detected.`);
    const err = new Error('This PDF appears to contain scanned or image-only pages and does not contain sufficient machine-readable text for analysis.');
    err.code = 'SCANNED_IMAGE_PDF';
    throw err;
  }

  logger.info(`Successfully parsed PDF: ${totalPages} pages extracted, total ${fullText.length} characters`);

  return {
    pageCount: totalPages,
    extractedPages: pages,
    fullText
  };
};

module.exports = { extractPdfPages, validatePdfMagicBytes, MINIMUM_TEXT_LENGTH };


