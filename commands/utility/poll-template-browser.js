// commands/utility/poll-templates.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const templateLoader = require('../../utils/templateLoader');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll-templates')
        .setDescription('Browse available poll templates')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Filter by category')
                .addChoices(
                    { name: '📊 Basic Polls', value: 'basic' },
                    { name: '⭐ Rating & Feedback', value: 'rating' },
                    { name: '📋 Survey Templates', value: 'survey' },
                    { name: '🎉 Fun & Social', value: 'fun' },
                    { name: '📅 Planning & Events', value: 'planning' },
                    { name: '💭 Feedback & Opinion', value: 'feedback' }
                ))
        .addBooleanOption(option =>
            option.setName('reload')
                .setDescription('Reload templates from files (Admin only)')),

    async execute(interaction) {
        const category = interaction.options.getString('category');
        const reload = interaction.options.getBoolean('reload');
        
        // Handle reload (admin only)
        if (reload) {
            if (!interaction.member.permissions.has('ManageGuild')) {
                return interaction.reply({
                    content: '❌ Only administrators can reload templates!',
                    ephemeral: true
                });
            }
            templateLoader.reloadTemplates();
            return interaction.reply({
                content: '✅ Templates reloaded successfully!',
                ephemeral: true
            });
        }
        
        if (category) {
            await showCategoryTemplates(interaction, category);
        } else {
            await showAllCategories(interaction);
        }
    }
};

async function showAllCategories(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('📊 Available Poll Templates')
        .setDescription('Choose from various poll templates to quickly create polls!')
        .setColor(0x3498db);

    // Add category overview
    const categories = templateLoader.getCategories();
    Object.keys(categories).forEach(categoryKey => {
        const categoryTemplates = categories[categoryKey];
        const categoryName = getCategoryName(categoryKey);
        const templateCount = categoryTemplates.length;
        
        embed.addFields({
            name: categoryName,
            value: `${templateCount} templates available\nUse \`/poll-templates category:${categoryKey}\` to view`,
            inline: true
        });
    });

    const quickPolls = templateLoader.getAllQuickPolls();
    embed.addFields({
        name: '🚀 Quick Polls',
        value: `${Object.keys(quickPolls).length} ready-to-use polls\nPerfect for common scenarios!`,
        inline: true
    });

    embed.setFooter({ text: 'Use /poll-template to create a poll with any template!' });

    await interaction.reply({ embeds: [embed] });
}

async function showCategoryTemplates(interaction, category) {
    const categories = templateLoader.getCategories();
    const categoryTemplates = categories[category];
    
    if (!categoryTemplates) {
        return interaction.reply({
            content: '❌ Invalid category selected!',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(`${getCategoryName(category)} Templates`)
        .setColor(0x3498db);

    let description = '';
    const allTemplates = templateLoader.getAllTemplates();
    
    categoryTemplates.forEach(templateKey => {
        const template = allTemplates[templateKey];
        if (template) {
            description += `**${template.emoji} ${template.name}**\n`;
            description += `${template.description}\n`;
            description += `Options: ${template.options.length} • Default: ${template.defaultDuration || 60}min\n`;
            description += `Usage: \`/poll-template template:${template.emoji} ${template.name}\`\n\n`;
        }
    });

    embed.setDescription(description);
    embed.setFooter({ text: 'Copy the command and add your question to use a template!' });

    await interaction.reply({ embeds: [embed] });
}

function getCategoryName(categoryKey) {
    const categoryNames = {
        'basic': '📊 Basic Polls',
        'rating': '⭐ Rating & Feedback',
        'survey': '📋 Survey Templates',
        'fun': '🎉 Fun & Social',
        'planning': '📅 Planning & Events',
        'feedback': '💭 Feedback & Opinion'
    };
    return categoryNames[categoryKey] || categoryKey;
}