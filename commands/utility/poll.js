const { SlashCommandBuilder } = require('discord.js');
const pollManager = require('../../data/pollManager.js');
const { createPollEmbed } = require('../../utils/pollEmbed.js');
const { createPollButtons } = require('../../utils/pollButtons.js');
const { validatePollOptions, generatePollId, createPollData } = require('../../utils/pollHelpers.js');
const { endPollById } = require('../../events/pollInteractionHandler.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll with up to 10 options')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Poll options separated by semicolons (;)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Poll duration in minutes (default: 60)')
                .setMinValue(1)
                .setMaxValue(1440))
        .addBooleanOption(option =>
            option.setName('anonymous')
                .setDescription('Hide who voted (default: false)')),

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const optionsString = interaction.options.getString('options');
        const duration = interaction.options.getInteger('duration') || 60;
        const anonymous = interaction.options.getBoolean('anonymous') || false;

        // Validate options
        const validation = validatePollOptions(optionsString);
        if (!validation.isValid) {
            await interaction.reply({ 
                content: `❌ ${validation.errors.join('\n')}`, 
                ephemeral: true 
            });
            return;
        }

        // Create poll
        const pollId = generatePollId(interaction.user.id);
        const pollData = createPollData(question, validation.options, duration, anonymous, interaction.user.id);
        
        pollManager.createPoll(pollId, pollData);

        // Create and send poll
        const embed = createPollEmbed(pollData);
        const buttons = createPollButtons(validation.options, pollId);

        await interaction.reply({
            embeds: [embed],
            components: buttons
        });

        // Set timeout to end poll
        setTimeout(() => {
            endPollById(pollId, interaction);
        }, duration * 60 * 1000);
    }
};