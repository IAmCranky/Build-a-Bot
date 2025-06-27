const { Events } = require('discord.js');
const { handlePollInteraction } = require('./pollInteractionHandler.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle poll button interactions first
        const pollHandled = await handlePollInteraction(interaction);
        if (pollHandled) return;

        // Handle slash commands
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            
            const errorMessage = { 
                content: 'There was an error while executing this command!', 
                ephemeral: true 
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },
};