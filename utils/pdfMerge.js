const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function multiMerge() {
    // Get PDF filenames from command line arguments (skip first 2 which are node and script name)
    const pdfFiles = process.argv.slice(2);
    
    if (pdfFiles.length === 0) {
        console.log('Please provide PDF files as arguments');
        return;
    }
    
    // Create the merged PDF document
    const mergedPdf = await PDFDocument.create();
    
    // Process each PDF file
    for (const filename of pdfFiles) {
        try {
            const pdfBuffer = fs.readFileSync(filename);
            const doc = await PDFDocument.load(pdfBuffer);
            const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
            console.log(`Added ${filename}`);
        } catch (error) {
            console.error(`Error processing ${filename}:`, error.message);
        }
    }
    
    // Save the merged PDF
    const mergedBytes = await mergedPdf.save();
    fs.writeFileSync('merged.pdf', mergedBytes);
    console.log('Merged PDF saved as merged.pdf');
}

multiMerge().catch(console.error);
