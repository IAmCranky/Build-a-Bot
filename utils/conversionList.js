const FORMATS = {
    textData: ['.txt', '.json', '.xml', '.yaml', '.yml', '.csv', '.md', '.markdown', '.html', '.htm'],
    office: ['.docx', '.doc', '.odt', '.rtf', '.pages'],
    spreadsheets: ['.xlsx', '.xls', '.ods', '.csv', '.tsv', '.numbers'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
    video: ['.mp4', '.avi', '.mkv', '.mov', '.webm', '.wmv']
};

const getCategory = ext => Object.keys(FORMATS).find(cat => FORMATS[cat].includes(ext)) || 'unknown';
const isCompatible = (input, output) => getCategory(input) === getCategory(output);
const getCompatible = ext => FORMATS[getCategory(ext)] || [];

module.exports = { FORMATS, getCategory, isCompatible, getCompatible };