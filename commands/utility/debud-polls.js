// commands/utility/debug-polls.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pollManager = require('../../data/pollManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug-polls')
        .setDescription('Debug active polls (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const activePollIds = pollManager.listActivePollIds();
        
        if (activePollIds.length === 0) {
            await interaction.reply({
                content: '📊 No active polls found.',
                ephemeral: true
            });
            return;
        }

        const pollList = activePollIds.map((id, index) => `${index + 1}. \`${id}\``).join('\n');
        
        await interaction.reply({
            content: `📊 **Active Polls (${activePollIds.length}):**\n${pollList}`,
            ephemeral: true
        });
    }
};