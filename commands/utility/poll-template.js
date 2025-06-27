// commands/utility/poll-template.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const templateLoader = require('../../utils/templateLoader');
const pollManager = require('../../data/pollManager');
const { createPollEmbed } = require('../../utils/pollEmbed');
const { createPollButtons } = require('../../utils/pollButtons');
const { generatePollId, createPollData } = require('../../utils/pollHelpers');
const { endPollById } = require('../../events/pollInteractionHandler');

// Build choices for the slash command
function buildTemplateChoices() {
    const choices = [];
    
    try {
        // Add regular templates
        const templates = templateLoader.getAllTemplates();
        Object.keys(templates).forEach(key => {
            const template = templates[key];
            choices.push({
                name: `${template.emoji} ${template.name}`,
                value: `template:${key}`
            });
        });
        
        // Add quick polls
        const quickPolls = templateLoader.getAllQuickPolls();
        Object.keys(quickPolls).forEach(key => {
            const quickPoll = quickPolls[key];
            choices.push({
                name: `🚀 ${quickPoll.name} (Quick)`,
                value: `quick:${key}`
            });
        });
        
        console.log(`✅ Built ${choices.length} template choices`);
        return choices.slice(0, 25); // Discord limit
        
    } catch (error) {
        console.error('Error building template choices:', error);
        return [
            { name: '✅ Yes/No Poll', value: 'template:yes-no' },
            { name: '⭐ 5-Star Rating', value: 'template:rating-5' }
        ];
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll-template')
        .setDescription('Create a poll using predefined templates')
        .addStringOption(option => {
            const choices = buildTemplateChoices();
            return option.setName('template')
                .setDescription('Choose a poll template')
                .setRequired(true)
                .addChoices(...choices);
        })
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Your poll question')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Poll duration in minutes (overrides template default)')
                .setMinValue(1)
                .setMaxValue(1440))
        .addBooleanOption(option =>
            option.setName('anonymous')
                .setDescription('Hide who voted (default: false)'))
        .addStringOption(option =>
            option.setName('custom-options')
                .setDescription('Add custom options (semicolon separated) - will be added to template options')),

    async execute(interaction) {
        console.log(`🔧 Poll template command executed by ${interaction.user.tag}`);
        
        try {
            const templateChoice = interaction.options.getString('template');
            const question = interaction.options.getString('question');
            const customDuration = interaction.options.getInteger('duration');
            const anonymous = interaction.options.getBoolean('anonymous') || false;
            const customOptions = interaction.options.getString('custom-options');

            console.log(`🔧 Template choice: ${templateChoice}`);
            console.log(`🔧 Question: ${question}`);

            // Parse template choice
            const [type, key] = templateChoice.split(':');
            let templateData;
            
            if (type === 'template') {
                templateData = templateLoader.getTemplate(key);
            } else if (type === 'quick') {
                templateData = templateLoader.getQuickPoll(key);
            }

            if (!templateData) {
                console.log(`❌ Template not found: ${type}:${key}`);
                return interaction.reply({
                    content: '❌ Invalid template selected! Please try again.',
                    flags: MessageFlags.Ephemeral
                });
            }

            console.log(`✅ Template found: ${templateData.name}`);

            // Build options array
            let options = [...templateData.options];
            
            // Add custom options if provided
            if (customOptions) {
                const additionalOptions = customOptions.split(';')
                    .map(opt => opt.trim())
                    .filter(opt => opt.length > 0);
                options = [...options, ...additionalOptions];
                console.log(`🔧 Added ${additionalOptions.length} custom options`);
            }

            // Validate total options
            if (options.length > 10) {
                return interaction.reply({
                    content: '❌ Too many options! Maximum 10 options allowed (including custom ones).',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Determine duration
            const duration = customDuration || templateData.defaultDuration || 60;
            console.log(`🔧 Poll duration: ${duration} minutes`);

            // Create poll ID
            const pollId = generatePollId(interaction.user.id);
            console.log(`🔧 Creating poll with ID: ${pollId}`);

            // Create poll data
            const pollData = createPollData(question, options, duration, anonymous, interaction.user.id);
            
            // Store poll data
            pollManager.createPoll(pollId, pollData);
            console.log(`✅ Poll stored in manager`);

            // Create embed and buttons
            console.log(`🔧 Creating embed and buttons`);
            const embed = createPollEmbed(pollData);
            
            // Add template info to embed
            embed.setAuthor({ 
                name: `${templateData.emoji || '📊'} ${templateData.name || 'Template Poll'}`,
                iconURL: interaction.user.displayAvatarURL()
            });
            
            if (templateData.description) {
                embed.setFooter({ 
                    text: `${templateData.description} • Total votes: 0 • Ends in ${duration} minutes` 
                });
            }

            const buttons = createPollButtons(options, pollId);
            console.log(`🔧 Created ${buttons.length} button rows`);

            // Send the poll
            console.log(`🔧 Sending poll response`);
            await interaction.reply({
                embeds: [embed],
                components: buttons
            });

            console.log(`✅ Poll sent successfully`);

            // Set timeout to end poll
            setTimeout(() => {
                console.log(`⏰ Auto-ending poll: ${pollId}`);
                endPollById(pollId, interaction);
            }, duration * 60 * 1000);

        } catch (error) {
            console.error('❌ Error in poll-template execute:', error);
            
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: '❌ Failed to create poll. Please try again.',
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Failed to create poll. Please try again.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                console.error('❌ Error sending error reply:', replyError);
            }
        }
    }
};