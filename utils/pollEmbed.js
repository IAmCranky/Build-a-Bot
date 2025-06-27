// utils/pollEmbed.js
const { EmbedBuilder } = require('discord.js');

function createPollEmbed(pollData, isEnded = false) {
    const totalVotes = pollData.votes.size;
    
    let description = `**${pollData.question}**\n\n`;
    
    pollData.options.forEach((option, index) => {
        const optionVotes = Array.from(pollData.votes.values()).filter(vote => vote === index).length;
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        const barLength = Math.round(percentage / 5);
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
        
        description += `**${index + 1}.** ${option}\n`;
        description += `${bar} ${percentage}% (${optionVotes} votes)\n\n`;
    });

    const embed = new EmbedBuilder()
        .setTitle(isEnded ? '📊 Poll Results (ENDED)' : '📊 Poll')
        .setDescription(description)
        .setColor(isEnded ? 0xe74c3c : 0x3498db)
        .setTimestamp();

    if (isEnded) {
        embed.setFooter({ text: `Final results • Total votes: ${totalVotes}` });
    } else {
        const timeLeft = Math.round((pollData.endTime - Date.now()) / 60000);
        embed.setFooter({ text: `Total votes: ${totalVotes} • Ends in ${timeLeft} minutes` });
    }

    return embed;
}

function createResultsEmbed(pollData) {
    if (pollData.anonymous) {
        return null; // Will be handled by caller
    }

    let resultText = `**Detailed Results for:** ${pollData.question}\n\n`;
    
    pollData.options.forEach((option, index) => {
        const voters = Array.from(pollData.votes.entries())
            .filter(([userId, vote]) => vote === index)
            .map(([userId]) => `<@${userId}>`);
        
        resultText += `**${index + 1}.** ${option}\n`;
        resultText += voters.length > 0 ? `${voters.join(', ')}\n\n` : `No votes yet\n\n`;
    });

    return resultText;
}

module.exports = {
    createPollEmbed,
    createResultsEmbed
};