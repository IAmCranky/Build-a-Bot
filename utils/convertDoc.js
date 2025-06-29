const libre = require('libreoffice-convert');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const { FORMATS, getCategory, isCompatible } = require(path.join(__dirname, 'conversionList.js'));

const convertAsync = promisify(libre.convert);

const SUPPORTED = {
    office: ['.docx', '.doc', '.odt', '.rtf', '.txt', '.xlsx', '.xls', '.ods', '.csv', '.pptx', '.ppt', '.odp', '.pdf'], // Added .pdf here
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'],
    outputs: {
        office: ['.pdf', '.html', '.txt', '.docx', '.odt', '.rtf', '.xlsx', '.ods', '.csv', '.pptx', '.odp'],
        images: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff']
    }
};

const isOffice = ext => SUPPORTED.office.includes(ext);
const isImage = ext => SUPPORTED.images.includes(ext);

async function convertOffice(inputPath, outputPath, format) {
    const data = await fs.readFile(inputPath);
    const converted = await convertAsync(data, format, undefined);
    await fs.writeFile(outputPath, converted);
}

async function convertImage(inputPath, outputPath, format) {
    const formatMap = {
        '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', 
        '.webp': 'webp', '.gif': 'gif', '.bmp': 'bmp', '.tiff': 'tiff'
    };
    
    await sharp(inputPath)[formatMap[format]]().toFile(outputPath);
}

async function convert(inputPath, outputPath) {
    const inputExt = path.extname(inputPath).toLowerCase();
    const outputExt = path.extname(outputPath).toLowerCase();
    
    // Check compatibility using the shared format system
    if (!isCompatible(inputExt, outputExt)) {
        console.warn(`${inputExt} → ${outputExt} may not be optimal`);
    }
    
if (isOffice(inputExt)) {
    if (inputExt === '.pdf') {
        throw new Error(`Cannot convert FROM PDF. PDF is output-only. Use a PDF extraction tool first.`);
    }
    if (!SUPPORTED.outputs.office.includes(outputExt)) {
        throw new Error(`${inputExt} cannot convert to ${outputExt}. Supported: ${SUPPORTED.outputs.office.join(', ')}`);
    }
    await convertOffice(inputPath, outputPath, outputExt);
}
    else if (isImage(inputExt)) {
        if (!SUPPORTED.outputs.images.includes(outputExt)) {
            throw new Error(`${inputExt} cannot convert to ${outputExt}. Supported: ${SUPPORTED.outputs.images.join(', ')}`);
        }
        await convertImage(inputPath, outputPath, outputExt);
    } 
    else {
        throw new Error(`Unsupported: ${inputExt}. Supported: ${[...SUPPORTED.office, ...SUPPORTED.images].join(', ')}`);
    }
    
    console.log(`${inputPath} → ${outputPath}`);
}

function showFormats() {
    console.log('OFFICE:', SUPPORTED.office.join(', '));
    console.log('IMAGES:', SUPPORTED.images.join(', '));
    console.log('\nOutput formats:');
    console.log('Office → ', SUPPORTED.outputs.office.join(', '));
    console.log('Images → ', SUPPORTED.outputs.images.join(', '));
}

// CLI
if (require.main === module) {
    const [,, input, output] = process.argv;
    
    if (!input || input === '--help') {
        console.log('Usage: node converter.js <input> <output>\n       node converter.js --formats');
        console.log('\nExamples:\n  node converter.js doc.docx doc.pdf\n  node converter.js img.png img.jpg');
        process.exit(0);
    }
    
    if (input === '--formats') {
        showFormats();
        process.exit(0);
    }
    
    if (!output) {
        console.error('Need input and output files');
        process.exit(1);
    }
    
    convert(input, output).catch(err => {
        console.error(`${err.message}`);
        process.exit(1);
    });
}

module.exports = { convert, showFormats };