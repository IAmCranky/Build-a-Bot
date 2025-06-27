// events/pollInteractionHandler.js
const pollManager = require('../data/pollManager');
const { createPollEmbed, createResultsEmbed } = require('../utils/pollEmbed');
const { createPollButtons } = require('../utils/pollButtons');
const { canEndPoll } = require('../utils/pollHelpers');
const { EmbedBuilder, MessageFlags } = require('discord.js');

async function handlePollInteraction(interaction) {
    console.log(`🔧 handlePollInteraction called`);
    console.log(`🔧 Interaction type: ${interaction.type}`);
    console.log(`🔧 Is button: ${interaction.isButton()}`);
    
    if (!interaction.isButton()) {
        console.log(`❌ Not a button interaction, returning false`);
        return false;
    }

    const customId = interaction.customId;
    console.log(`🔧 Button clicked: ${customId}`);
    
    if (!customId.startsWith('poll_')) {
        console.log(`❌ Not a poll button, returning false`);
        return false;
    }

    console.log(`✅ Processing poll button interaction`);

    // 🔧 Simplified parsing first - let's see if this works
    const parts = customId.split('_');
    console.log(`🔧 Custom ID parts:`, parts);
    
    if (parts.length < 4) {
        console.log(`❌ Invalid custom ID format: ${customId}`);
        try {
            await interaction.reply({
                content: '❌ Invalid button format!',
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error replying to invalid format:', error);
        }
        return true;
    }

    // Simple parsing: poll_[type]_[...pollId parts...]_[optionIndex if vote]
    const type = parts[1]; // vote, results, or end
    console.log(`🔧 Button type: ${type}`);
    
    let pollId, optionIndex;
    
    if (type === 'vote') {
        // For vote: poll_vote_...pollId..._optionIndex
        optionIndex = parts[parts.length - 1];
        pollId = parts.slice(2, -1).join('_');
    } else {
        // For results/end: poll_results/end_...pollId...
        pollId = parts.slice(2).join('_');
    }

    console.log(`🔧 Parsed - Type: ${type}, Poll ID: ${pollId}, Option: ${optionIndex}`);
    
    // Check if poll exists
    console.log(`🔧 Looking for poll in manager...`);
    const pollData = pollManager.getPoll(pollId);
    
    if (!pollData) {
        console.log(`❌ Poll data not found for ID: ${pollId}`);
        const activePollIds = pollManager.listActivePollIds ? pollManager.listActivePollIds() : ['No listActivePollIds method'];
        console.log(`❌ Available polls:`, activePollIds);
        
        try {
            await interaction.reply({ 
                content: '❌ This poll no longer exists!', 
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error replying poll not found:', error);
        }
        return true;
    }

    console.log(`✅ Poll found! Active: ${pollData.active}`);

    if (!pollData.active) {
        console.log(`❌ Poll is not active: ${pollId}`);
        try {
            await interaction.reply({ 
                content: '❌ This poll has ended!', 
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error replying poll ended:', error);
        }
        return true;
    }

    // Process the interaction
    try {
        console.log(`🔧 Processing ${type} action for poll ${pollId}`);
        
        switch (type) {
            case 'vote':
                console.log(`🗳️ Handling vote...`);
                await handleVote(interaction, pollData, pollId, parseInt(optionIndex));
                break;
            case 'results':
                console.log(`📊 Handling results...`);
                await handleResults(interaction, pollData);
                break;
            case 'end':
                console.log(`🔚 Handling end poll...`);
                await handleEndPoll(interaction, pollData, pollId);
                break;
            default:
                console.log(`❌ Unknown button type: ${type}`);
                await interaction.reply({
                    content: '❌ Unknown action. Please try again.',
                    flags: MessageFlags.Ephemeral
                });
                return true;
        }
        
        console.log(`✅ Successfully processed ${type} action`);
        
    } catch (error) {
        console.error(`❌ Error handling poll interaction (${type}):`, error);
        console.error(`❌ Error stack:`, error.stack);
        
        try {
            const errorMessage = { 
                content: '❌ An error occurred while processing your request. Please try again.', 
                flags: MessageFlags.Ephemeral
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        } catch (followUpError) {
            console.error('Error sending error message:', followUpError);
        }
    }

    return true;
}

async function handleVote(interaction, pollData, pollId, optionIndex) {
    console.log(`🗳️ handleVote called`);
    console.log(`🗳️ User: ${interaction.user.id}, Poll: ${pollId}, Option: ${optionIndex}`);
    
    // Validate option index
    if (isNaN(optionIndex) || optionIndex < 0 || optionIndex >= pollData.options.length) {
        console.log(`❌ Invalid option index: ${optionIndex} (valid range: 0-${pollData.options.length - 1})`);
        await interaction.reply({ 
            content: '❌ Invalid option selected!', 
            flags: MessageFlags.Ephemeral
        });
        return;
    }
    
    try {
        const userId = interaction.user.id;
        
        // Remove existing vote if present
        if (pollManager.hasVoted(pollId, userId)) {
            console.log(`🔄 User ${userId} changing vote`);
            pollManager.removeVote(pollId, userId);
        }
        
        // Add new vote
        console.log(`🗳️ Adding vote...`);
        const voteAdded = pollManager.addVote(pollId, userId, optionIndex);
        if (!voteAdded) {
            throw new Error('Failed to add vote to poll manager');
        }
        
        console.log(`✅ Vote added successfully`);
        
        // Create updated embed and buttons
        console.log(`🔧 Creating updated embed...`);
        const embed = createPollEmbed(pollData);
        console.log(`🔧 Creating updated buttons...`);
        const buttons = createPollButtons(pollData.options, pollId);
        
        console.log(`🔧 Updating interaction...`);
        await interaction.update({
            embeds: [embed],
            components: buttons
        });
        
        console.log(`✅ Vote processed and UI updated successfully`);
        
    } catch (error) {
        console.error(`❌ Error in handleVote:`, error);
        throw error;
    }
}

async function handleResults(interaction, pollData) {
    console.log(`📊 handleResults called`);
    
    if (pollData.anonymous) {
        console.log(`🔒 Poll is anonymous`);
        await interaction.reply({ 
            content: '🔒 This poll is anonymous. Results will be shown when it ends.', 
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    try {
        console.log(`📊 Creating results embed...`);
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
                const maxVotersShown = 5;
                const votersToShow = voters.slice(0, maxVotersShown);
                fieldValue += votersToShow.join(', ');
                
                if (voters.length > maxVotersShown) {
                    fieldValue += `\n... and ${voters.length - maxVotersShown} more`;
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

        console.log(`📊 Sending results embed...`);
        await interaction.reply({ 
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
        
        console.log(`✅ Results embed shown successfully`);
        
    } catch (error) {
        console.error(`❌ Error showing results:`, error);
        await interaction.reply({
            content: '❌ Failed to show results. Please try again.',
            flags: MessageFlags.Ephemeral
        });
    }
}

async function handleEndPoll(interaction, pollData, pollId) {
    console.log(`🔚 handleEndPoll called`);
    
    if (!canEndPoll(interaction.user.id, pollData, interaction.member)) {
        console.log(`❌ User ${interaction.user.id} cannot end poll`);
        await interaction.reply({ 
            content: '❌ Only the poll creator or moderators can end this poll!', 
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    console.log(`🔚 Ending poll ${pollId}...`);
    await endPollById(pollId, interaction);
    await interaction.reply({ 
        content: '✅ Poll ended successfully!', 
        flags: MessageFlags.Ephemeral
    });
}

async function endPollById(pollId, interaction) {
    console.log(`🔚 endPollById called for: ${pollId}`);
    
    const pollData = pollManager.endPoll(pollId);
    if (!pollData) {
        console.log(`❌ Could not end poll - poll data not found: ${pollId}`);
        return;
    }

    const embed = createPollEmbed(pollData, true);

    try {
        if (interaction.message) {
            await interaction.message.edit({
                embeds: [embed],
                components: []
            });
            console.log(`✅ Poll ended and message updated`);
        } else {
            console.log(`❌ No message found to edit for poll: ${pollId}`);
        }
    } catch (error) {
        console.error('Error ending poll:', error);
    }
}

module.exports = {
    handlePollInteraction,
    endPollById
};