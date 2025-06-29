const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const { parseString: parseXML, Builder: XMLBuilder } = require('xml2js');
const csvParser = require('csv-parser');
const { convert: htmlToText } = require('html-to-text');
const TurndownService = require('turndown');
const { getCategory, isCompatible } = require(path.join(__dirname, 'conversionList.js'));
const FORMATS = ['.json', '.xml', '.md', '.markdown', '.html', '.txt', '.csv', '.yaml', '.yml'];
const parsers = {
    '.json': JSON.parse,
    '.xml': content => new Promise((resolve, reject) => parseXML(content, (err, result) => err ? reject(err) : resolve(result))),
    '.md': content => ({ markdown: content, html: marked.parse(content), text: content.replace(/[#*`_\[\]()]/g, '') }),
    '.markdown': content => parsers['.md'](content),
    '.html': content => ({ html: content, text: htmlToText(content, { wordwrap: 130 })}),
    '.csv': content => new Promise((resolve, reject) => {
        const results = [], { Readable } = require('stream');
        const stream = new Readable(); stream.push(content); stream.push(null);
        stream.pipe(csvParser()).on('data', d => results.push(d)).on('end', () => resolve(results)).on('error', reject);
    }),
    '.yaml': content => require('js-yaml').load(content),
    '.yml': content => parsers['.yaml'](content),
    '.txt': content => ({ text: content })
};
const formatters = {
    '.json': (data, inputFormat) => {
        // Fix: Handle HTML-to-JSON conversion by extracting the actual HTML content
        if (inputFormat === '.html' && data.html) {
            try {
                // Try to extract JSON from HTML content
                const htmlContent = data.html;
                const preMatch = htmlContent.match(/<pre[^>]*>(.*?)<\/pre>/s);
                if (preMatch) {
                    const unescaped = preMatch[1]
                        .replace(/&quot;/g, '"')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&#39;/g, "'")
                        .replace(/&amp;/g, '&');
                    // Parse and re-stringify to ensure proper formatting
                    const parsed = JSON.parse(unescaped);
                    return JSON.stringify(parsed, null, 2);
                }
                // If no <pre> tag, return the HTML as a simple JSON object
                return JSON.stringify({ content: htmlContent, type: "html" }, null, 2);
            } catch (e) {
                // If parsing fails, return the HTML content as a JSON string
                return JSON.stringify({ content: data.html, type: "html" }, null, 2);
            }
        }
        return JSON.stringify(data, null, 2);
    },
    '.xml': (data, inputFormat) => new XMLBuilder().buildObject(inputFormat === '.json' ? { root: data } : data),
    '.md': (data, inputFormat) => data.markdown || (data.html ? new TurndownService().turndown(data.html) : (Array.isArray(data) ? toTable(data, 'md') : `# Data\n\n\`\`\`\n${JSON.stringify(data, null, 2)}\n\`\`\``)),
    '.markdown': (data, inputFormat) => formatters['.md'](data, inputFormat),
    '.html': (data, inputFormat) => {
        if (data.html) return data.html;
        if (data.markdown) return `<!DOCTYPE html><html><body>${marked.parse(data.markdown)}</body></html>`;
        if (Array.isArray(data)) return toTable(data, 'html');
        // Fix: Return plain JSON for JSON-to-HTML conversion
        if (inputFormat === '.json') return JSON.stringify(data, null, 2);
        return `<!DOCTYPE html><html><body><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></body></html>`;
    },
    '.txt': (data, inputFormat) => data.text || (data.markdown ? data.markdown.replace(/[#*`_\[\]()]/g, '') : JSON.stringify(data, null, 2)),
    '.csv': data => { if (!Array.isArray(data)) throw new Error('CSV requires array'); return toCsv(data); },
    '.yaml': data => require('js-yaml').dump(data),
    '.yml': data => formatters['.yaml'](data)
};
const toTable = (data, format) => {
    if (!data.length) return format === 'html' ? '<p>No data</p>' : '';
    const headers = Object.keys(data[0]);
    return format === 'html' 
        ? `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${data.map(row => `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        : `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${data.map(row => `| ${headers.map(h => String(row[h] || '')).join(' | ')} |`).join('\n')}`;
};
const toCsv = data => {
    const headers = Object.keys(data[0]);
    return [headers.join(','), ...data.map(row => headers.map(h => `"${String(row[h] || '')}"`).join(','))].join('\n');
};
const escapeHtml = text => text.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
async function convert(inputPath, outputPath) {
    const inputExt = path.extname(inputPath).toLowerCase();
    const outputExt = path.extname(outputPath).toLowerCase();
    
    if (!FORMATS.includes(inputExt) || !FORMATS.includes(outputExt)) {
        throw new Error(`Unsupported format. Supported: ${FORMATS.join(', ')}`);
    }
    
    if (!isCompatible(inputExt, outputExt)) {
        console.warn(`${inputExt} → ${outputExt} may not be optimal`);
    }
    
    const content = await fs.readFile(inputPath, 'utf8');
    const parsed = await parsers[inputExt](content);
    const output = formatters[outputExt](parsed, inputExt);
    await fs.writeFile(outputPath, output);
    
    console.log(`${inputPath} → ${outputPath}`);
}
function showFormats() {
    console.log(`Supported: ${FORMATS.join(', ')}`);
    console.log('Common: JSON ↔ XML ↔ YAML, Markdown ↔ HTML, CSV ↔ JSON');
}
// CLI
if (require.main === module) {
    const [,, input, output] = process.argv;
    
    if (!input || input === '--help') {
        console.log('Usage: node converter.js <input> <output>\n       node converter.js --formats');
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