// commands/utility/create-template.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-template')
        .setDescription('Create a custom poll template (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Template name (no spaces, use dashes)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('display-name')
                .setDescription('Display name for the template')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Template options separated by semicolons')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Template description')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Template emoji (optional)'))
        .addIntegerOption(option =>
            option.setName('default-duration')
                .setDescription('Default duration in minutes (optional)')
                .setMinValue(1)
                .setMaxValue(1440))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Template category')
                .addChoices(
                    { name: 'Basic', value: 'basic' },
                    { name: 'Rating', value: 'rating' },
                    { name: 'Survey', value: 'survey' },
                    { name: 'Fun', value: 'fun' },
                    { name: 'Planning', value: 'planning' },
                    { name: 'Feedback', value: 'feedback' }
                )),

    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase().replace(/\s+/g, '-');
        const displayName = interaction.options.getString('display-name');
        const optionsString = interaction.options.getString('options');
        const description = interaction.options.getString('description');
        const emoji = interaction.options.getString('emoji') || '📊';
        const defaultDuration = interaction.options.getInteger('default-duration') || 60;
        const category = interaction.options.getString('category') || 'basic';

        // Validate template name
        if (!/^[a-z0-9-]+$/.test(name)) {
            return interaction.reply({
                content: '❌ Template name can only contain lowercase letters, numbers, and dashes!',
                ephemeral: true
            });
        }

        // Parse and validate options
        const options = optionsString.split(';').map(opt => opt.trim()).filter(opt => opt.length > 0);
        
        if (options.length < 2) {
            return interaction.reply({
                content: '❌ Template must have at least 2 options!',
                ephemeral: true
            });
        }

        if (options.length > 10) {
            return interaction.reply({
                content: '❌ Template cannot have more than 10 options!',
                ephemeral: true
            });
        }

        // Create template object
        const newTemplate = {
            name: displayName,
            options: options,
            description: description,
            emoji: emoji,
            defaultDuration: defaultDuration,
            createdBy: interaction.user.id,
            createdAt: new Date().toISOString(),
            custom: true
        };

        try {
            // Load existing templates
            const templatesPath = path.join(__dirname, '../../config/pollTemplates.js');
            const templatesContent = fs.readFileSync(templatesPath, 'utf8');
            
            // Parse the module.exports object (basic parsing)
            const templates = require('../../config/pollTemplates');
            
            // Check if template already exists
            if (templates.templates[name]) {
                return interaction.reply({
                    content: '❌ A template with this name already exists!',
                    ephemeral: true
                });
            }

            // Add new template
            templates.templates[name] = newTemplate;
            
            // Add to category if specified
            if (templates.categories[category]) {
                templates.categories[category].push(name);
            }

            // Save custom templates to separate file for easier management
            await saveCustomTemplate(name, newTemplate, category);

            // Create preview embed
            const embed = new EmbedBuilder()
                .setTitle(`✅ Template Created: ${emoji} ${displayName}`)
                .setDescription(`**Description:** ${description}\n\n**Options:**\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`)
                .addFields(
                    { name: 'Default Duration', value: `${defaultDuration} minutes`, inline: true },
                    { name: 'Category', value: category, inline: true },
                    { name: 'Template ID', value: `\`${name}\``, inline: true }
                )
                .setColor(0x00ff00)
                .setFooter({ text: `Created by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error creating template:', error);
            await interaction.reply({
                content: '❌ Failed to create template. Please try again.',
                ephemeral: true
            });
        }
    }
};

async function saveCustomTemplate(name, template, category) {
    const customTemplatesPath = path.join(__dirname, '../../config/customTemplates.json');
    
    let customTemplates = {};
    if (fs.existsSync(customTemplatesPath)) {
        const content = fs.readFileSync(customTemplatesPath, 'utf8');
        customTemplates = JSON.parse(content);
    }

    if (!customTemplates.templates) customTemplates.templates = {};
    if (!customTemplates.categories) customTemplates.categories = {};

    customTemplates.templates[name] = template;
    
    if (!customTemplates.categories[category]) {
        customTemplates.categories[category] = [];
    }
    if (!customTemplates.categories[category].includes(name)) {
        customTemplates.categories[category].push(name);
    }

    fs.writeFileSync(customTemplatesPath, JSON.stringify(customTemplates, null, 2));
}