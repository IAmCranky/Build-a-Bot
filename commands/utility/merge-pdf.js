const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { PDFDocument } = require('pdf-lib');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('merge-pdf')
        .setDescription('Merge PDF files (attach up to 10 PDFs)')
        .addAttachmentOption(option => 
            option.setName('pdf1')
                .setDescription('First PDF file')
                .setRequired(true))
        .addAttachmentOption(option => 
            option.setName('pdf2')
                .setDescription('Second PDF file')
                .setRequired(true))
        .addAttachmentOption(option => 
            option.setName('pdf3')
                .setDescription('Third PDF file')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf4')
                .setDescription('Fourth PDF file')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf5')
                .setDescription('Fifth PDF file')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf6')
                .setDescription('Sixth PDF file')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf7')
                .setDescription('Seventh PDF file')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf8')
                .setDescription('Eighth PDF file')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf9')
                .setDescription('Ninth PDF file')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('pdf10')
                .setDescription('Tenth PDF file')
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
            
            for (const pdf of pdfs) {
                console.log(`Processing: ${pdf.name}`);
                
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
                name: `merged_${Date.now()}.pdf` 
            });

            await interaction.editReply({
                content: `✅ Successfully merged ${pdfs.length} PDF files!`,
                files: [attachment]
            });

        } catch (error) {
            console.error('Error merging PDFs:', error);
            await interaction.editReply('❌ Failed to merge PDFs. Please ensure all files are valid PDFs and try again.');
        }
    }
};