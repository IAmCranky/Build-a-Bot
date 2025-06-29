// utils/pollButtons.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createPollButtons(options, pollId, isEnded = false) {
    console.log(`🔧 Creating buttons for poll: ${pollId}`);
    
    if (isEnded) return [];

    const rows = [];
    let currentRow = new ActionRowBuilder();
    
    // Create voting buttons - 🔧 USE UNDERSCORES NOT PIPES
    options.forEach((option, index) => {
        if (currentRow.components.length === 5) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
        
        const customId = `poll_vote_${pollId}_${index}`; // 🔧 CHANGED FROM poll|vote|...
        console.log(`🔧 Button custom ID: ${customId}`);
        
        const button = new ButtonBuilder()
            .setCustomId(customId)
            .setLabel(`${index + 1}. ${truncateText(option, 20)}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🗳️');
            
        currentRow.addComponents(button);
    });
    
    if (currentRow.components.length > 0) {
        rows.push(currentRow);
    }

    // Add control buttons - 🔧 USE UNDERSCORES NOT PIPES
    const controlRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`poll_results_${pollId}`) // 🔧 CHANGED FROM poll|results|...
                .setLabel('View Results')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📊'),
            new ButtonBuilder()
                .setCustomId(`poll_end_${pollId}`) // 🔧 CHANGED FROM poll|end|...
                .setLabel('End Poll')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🛑')
        );
    
    rows.push(controlRow);
    return rows;
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

module.exports = {
    createPollButtons
};