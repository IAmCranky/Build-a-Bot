const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { PDFDocument } = require('pdf-lib');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('merge-pdf')
        .setDescription('Merge 2-10 PDF files')
        .addAttachmentOption(option => 
            option.setName('pdf1')
                .setDescription('PDF file 1')
                .setRequired(true))
        .addAttachmentOption(option => 
            option.setName('pdf2')
                .setDescription('PDF file 2')
                .setRequired(true))
        .addAttachmentOption(option => 
            option.setName('pdf3')
                .setDescription('PDF file 3')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf4')
                .setDescription('PDF file 4')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf5')
                .setDescription('PDF file 5')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf6')
                .setDescription('PDF file 6')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf7')
                .setDescription('PDF file 7')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf8')
                .setDescription('PDF file 8')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf9')
                .setDescription('PDF file 9')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf10')
                .setDescription('PDF file 10')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();
        
        // Collect all PDF attachments
        const pdfs = [];
        for (let i = 1; i <= 10; i++) {
            const pdf = interaction.options.getAttachment(`pdf${i}`);
            if (pdf) {
                if (!pdf.name.toLowerCase().endsWith('.pdf')) {
                    return await interaction.editReply(`❌ ${pdf.name} is not a PDF file!`);
                }
                pdfs.push(pdf);
            }
        }

        if (pdfs.length < 2) {
            return await interaction.editReply('❌ Please attach at least 2 PDF files!');
        }

        try {
            const mergedPdf = await PDFDocument.create();
            
            for (let i = 0; i < pdfs.length; i++) {
                const pdf = pdfs[i];
                console.log(`Processing ${i + 1}/${pdfs.length}: ${pdf.name}`);
                
                const response = await axios.get(pdf.url, { 
                    responseType: 'arraybuffer',
                    timeout: 30000 
                });
                
                const pdfDoc = await PDFDocument.load(response.data);
                const pageIndices = pdfDoc.getPageIndices();
                const pages = await mergedPdf.copyPages(pdfDoc, pageIndices);
                
                pages.forEach(page => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            const attachment = new AttachmentBuilder(Buffer.from(pdfBytes), { 
                name: `merged_files_${Date.now()}.pdf` 
            });

            await interaction.editReply({
                content: `✅ Successfully merged ${pdfs.length} PDF files into one document!`,
                files: [attachment]
            });

        } catch (error) {
            console.error('Error merging PDFs:', error);
            await interaction.editReply('❌ Failed to merge PDFs. Please ensure all files are valid PDFs and try again.');
        }
    }
};