const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const templateLoader = require('../../utils/polls/templateLoader');
const pollManager = require('../../data/pollManager');
const { createPollEmbed } = require('../../utils/polls/pollEmbed');
const { createPollButtons } = require('../../utils/polls/pollButtons');
const { generatePollId, createPollData } = require('../../utils/polls/pollHelpers');
const { endPollById } = require('../../events/pollInteractionHandler');

function buildTemplateChoices() {
    const choices = [];
    
    try {
        // Add regular templates
        const templates = templateLoader.getAllTemplates();
        if (templates) {
            Object.entries(templates).forEach(([key, template]) => {
                const emoji = template.emoji || '📊';
                choices.push({
                    name: `${emoji} ${template.name}`,
                    value: `template:${key}`
                });
            });
        }
        
        // Add quick polls
        const quickPolls = templateLoader.getAllQuickPolls();
        if (quickPolls) {
            Object.entries(quickPolls).forEach(([key, options]) => {
                choices.push({
                    name: `🚀 ${key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} (Quick)`,
                    value: `quick:${key}`
                });
            });
        }
        
        return choices.slice(0, 25); // Discord limit
        
    } catch (error) {
        console.error('Error building template choices:', error);
        return [
            { name: '✅ Yes/No Poll', value: 'template:yes-no' },
            { name: '⭐ Rating Poll', value: 'template:rating' },
            { name: '📅 Next Session', value: 'template:session-plan' }
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
                .setDescription('Poll duration in minutes (default: 60)')
                .setMinValue(1)
                .setMaxValue(1440))
        .addBooleanOption(option =>
            option.setName('anonymous')
                .setDescription('Hide who voted (default: false)'))
        .addStringOption(option =>
            option.setName('custom-options')
                .setDescription('Add custom options (semicolon separated)')),

    async execute(interaction) {
        try {
            const templateChoice = interaction.options.getString('template');
            const question = interaction.options.getString('question');
            const customDuration = interaction.options.getInteger('duration');
            const anonymous = interaction.options.getBoolean('anonymous') || false;
            const customOptions = interaction.options.getString('custom-options');

            // Parse template choice
            const [type, key] = templateChoice.split(':');
            let templateData, options;
            
            if (type === 'template') {
                templateData = templateLoader.getTemplate(key);
                // Handle dynamic templates
                if (templateData?.isDynamic && templateData.generateOptions) {
                    options = templateData.generateOptions();
                } else {
                    options = templateData?.options || [];
                }
            // In the execute function where you handle quick polls
            } else if (type === 'quick') {
                const quickPoll = pollTemplates.quickPolls[key];
                if (!quickPoll) {
                    return interaction.reply({
                        content: '❌ Quick poll not found!',
                        flags: MessageFlags.Ephemeral
                    });
                }
    
    templateData = { 
        name: key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        emoji: '🚀',
        defaultDuration: quickPoll.defaultDuration || 60
    };
    options = quickPoll.options;
}

            if (!templateData || !options?.length) {
                return interaction.reply({
                    content: '❌ Invalid template selected! Please try again.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Add custom options if provided
            if (customOptions) {
                const additionalOptions = customOptions.split(';')
                    .map(opt => opt.trim())
                    .filter(opt => opt.length > 0);
                options = [...options, ...additionalOptions];
            }

            // Validate total options
            if (options.length > 10) {
                return interaction.reply({
                    content: '❌ Too many options! Maximum 10 options allowed.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Create and store poll
            const duration = customDuration || templateData.defaultDuration || 60;
            const pollId = generatePollId(interaction.user.id);
            const pollData = createPollData(question, options, duration, anonymous, interaction.user.id);
            
            pollManager.createPoll(pollId, pollData);

            // Create embed and buttons
            const embed = createPollEmbed(pollData);
            embed.setAuthor({ 
                name: `${templateData.emoji || '📊'} ${templateData.name}`,
                iconURL: interaction.user.displayAvatarURL()
            });
            
            if (templateData.description) {
                embed.setFooter({ 
                    text: `${templateData.description} • Total votes: 0 • Ends in ${duration} minutes` 
                });
            }

            const buttons = createPollButtons(options, pollId);

            await interaction.reply({
                embeds: [embed],
                components: buttons
            });

            // Auto-end poll after duration
            setTimeout(() => endPollById(pollId, interaction), duration * 60 * 1000);

        } catch (error) {
            console.error('Error in poll-template execute:', error);
            
            const errorMessage = {
                content: '❌ Failed to create poll. Please try again.',
                flags: MessageFlags.Ephemeral
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};