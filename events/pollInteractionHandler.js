// events/pollInteractionHandler.js
const pollManager = require('../data/pollManager');
const { createPollEmbed } = require('../utils/polls/pollEmbed');
const { createPollButtons } = require('../utils/polls/pollButtons');
const { canEndPoll } = require('../utils/polls/pollHelpers');
const { EmbedBuilder, MessageFlags } = require('discord.js');

async function handlePollInteraction(interaction) {
    if (!interaction.isButton() || !interaction.customId.startsWith('poll_')) {
        return false;
    }

    const parts = interaction.customId.split('_');
    if (parts.length < 4) {
        await interaction.reply({
            content: '❌ Invalid button format!',
            flags: MessageFlags.Ephemeral
        });
        return true;
    }

    const type = parts[1];
    let pollId, optionIndex;
    
    if (type === 'vote') {
        optionIndex = parseInt(parts[parts.length - 1]);
        pollId = parts.slice(2, -1).join('_');
    } else {
        pollId = parts.slice(2).join('_');
    }

    const pollData = pollManager.getPoll(pollId);
    if (!pollData) {
        await interaction.reply({ 
            content: '❌ This poll no longer exists!', 
            flags: MessageFlags.Ephemeral
        });
        return true;
    }

    if (!pollData.active) {
        await interaction.reply({ 
            content: '❌ This poll has ended!', 
            flags: MessageFlags.Ephemeral
        });
        return true;
    }

    try {
        switch (type) {
            case 'vote':
                await handleVote(interaction, pollData, pollId, optionIndex);
                break;
            case 'results':
                await handleResults(interaction, pollData);
                break;
            case 'end':
                await handleEndPoll(interaction, pollData, pollId);
                break;
            default:
                await interaction.reply({
                    content: '❌ Unknown action. Please try again.',
                    flags: MessageFlags.Ephemeral
                });
        }
    } catch (error) {
        console.error(`Error handling poll interaction (${type}):`, error);
        
        const errorMessage = { 
            content: '❌ An error occurred. Please try again.', 
            flags: MessageFlags.Ephemeral
        };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
    
    return true;
}

async function handleVote(interaction, pollData, pollId, optionIndex) {
    if (isNaN(optionIndex) || optionIndex < 0 || optionIndex >= pollData.options.length) {
        await interaction.reply({ 
            content: '❌ Invalid option selected!', 
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const userId = interaction.user.id;
    
    if (pollManager.hasVoted(pollId, userId)) {
        pollManager.removeVote(pollId, userId);
    }
    
    if (!pollManager.addVote(pollId, userId, optionIndex)) {
        throw new Error('Failed to add vote to poll manager');
    }

    const embed = createPollEmbed(pollData);
    const buttons = createPollButtons(pollData.options, pollId);
    
    await interaction.update({
        embeds: [embed],
        components: buttons
    });
}

async function handleResults(interaction, pollData) {
    if (pollData.anonymous) {
        await interaction.reply({ 
            content: '🔒 This poll is anonymous. Results will be shown when it ends.', 
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('📊 Detailed Poll Results')
        .setDescription(`**Question:** ${pollData.question}`)
        .setColor(0x3498db)
        .setTimestamp();

    pollData.options.forEach((option, index) => {
        const voters = Array.from(pollData.votes.entries())
            .filter(([userId, vote]) => vote === index)
            .map(([userId]) => `<@${userId}>`);
        
        const optionVotes = voters.length;
        const totalVotes = pollData.votes.size;
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        
        let fieldValue = `${percentage}% (${optionVotes} votes)\n`;
        
        if (voters.length > 0) {
            const votersToShow = voters.slice(0, 5);
            fieldValue += votersToShow.join(', ');
            if (voters.length > 5) {
                fieldValue += `\n... and ${voters.length - 5} more`;
            }
        } else {
            fieldValue += 'No votes yet';
        }
        
        embed.addFields({
            name: `${index + 1}. ${option}`,
            value: fieldValue,
            inline: false
        });
    });

    embed.setFooter({ text: `Total Votes: ${pollData.votes.size}` });
    
    await interaction.reply({ 
        embeds: [embed],
        flags: MessageFlags.Ephemeral
    });
}

async function handleEndPoll(interaction, pollData, pollId) {
    if (!canEndPoll(interaction.user.id, pollData, interaction.member)) {
        await interaction.reply({ 
            content: '❌ Only the poll creator or moderators can end this poll!', 
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    await endPollById(pollId, interaction);
    await interaction.reply({ 
        content: '✅ Poll ended successfully!', 
        flags: MessageFlags.Ephemeral
    });
}

async function endPollById(pollId, interaction) {
    const pollData = pollManager.endPoll(pollId);
    if (!pollData) return;

    const embed = createPollEmbed(pollData, true);
    
    try {
        if (interaction.message) {
            await interaction.message.edit({
                embeds: [embed],
                components: []
            });
        }
    } catch (error) {
        console.error('Error ending poll:', error);
    }
}

module.exports = {
    handlePollInteraction,
    endPollById
};