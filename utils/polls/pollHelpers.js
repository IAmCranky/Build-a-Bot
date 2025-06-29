// utils/pollHelpers.js

// Add a counter to ensure unique IDs
let pollCounter = 0;

function validatePollOptions(optionsString) {
    const options = optionsString.split(';')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

    const errors = [];

    if (options.length < 2) {
        errors.push('You need at least 2 options for a poll!');
    }

    if (options.length > 10) {
        errors.push('Maximum 10 options allowed!');
    }

    // Check for duplicate options
    const uniqueOptions = [...new Set(options)];
    if (uniqueOptions.length !== options.length) {
        errors.push('Duplicate options are not allowed!');
    }

    // Check option length
    const longOptions = options.filter(opt => opt.length > 100);
    if (longOptions.length > 0) {
        errors.push('Options must be 100 characters or less!');
    }

    return {
        isValid: errors.length === 0,
        errors,
        options: uniqueOptions
    };
}

function generatePollId(userId) {
    // 🔧 FIX: Better unique ID generation
    pollCounter++;
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    
    const pollId = `poll_${timestamp}_${userId}_${pollCounter}_${random}`;
    console.log(`🔧 Generated poll ID: ${pollId}`); // Debug log
    
    return pollId;
}

function createPollData(question, options, duration, anonymous, creatorId) {
    return {
        question,
        options,
        votes: new Map(),
        anonymous,
        endTime: Date.now() + (duration * 60 * 1000),
        creator: creatorId,
        active: true,
        createdAt: Date.now()
    };
}

function canEndPoll(userId, pollData, member) {
    return pollData.creator === userId || 
           member.permissions.has('ManageMessages') ||
           member.permissions.has('Administrator');
}

module.exports = {
    validatePollOptions,
    generatePollId,
    createPollData,
    canEndPoll
};