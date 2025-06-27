// data/pollManager.js
class PollManager {
    constructor() {
        this.activePolls = new Map();
        console.log('📊 PollManager initialized');
    }

    createPoll(pollId, pollData) {
        this.activePolls.set(pollId, pollData);
        console.log(`📊 Poll created: ${pollId} (Total active polls: ${this.activePolls.size})`);
    }

    getPoll(pollId) {
        const poll = this.activePolls.get(pollId);
        if (!poll) {
            console.log(`❌ Poll not found: ${pollId}`);
            console.log(`❌ Available polls: ${Array.from(this.activePolls.keys()).join(', ')}`);
        }
        return poll;
    }

    // 🔧 ADD: Method to list all active polls for debugging
    listActivePollIds() {
        return Array.from(this.activePolls.keys());
    }

    deletePoll(pollId) {
        const result = this.activePolls.delete(pollId);
        console.log(`🗑️ Poll deleted: ${pollId} (Success: ${result})`);
        return result;
    }

    endPoll(pollId) {
        const poll = this.getPoll(pollId);
        if (poll) {
            poll.active = false;
            console.log(`🔚 Poll ended: ${pollId}`);
        }
        return poll;
    }

    addVote(pollId, userId, optionIndex) {
        const poll = this.getPoll(pollId);
        if (!poll) return false;

        poll.votes.set(userId, optionIndex);
        console.log(`🗳️ Vote added: ${pollId} - User: ${userId} - Option: ${optionIndex}`);
        return true;
    }

    removeVote(pollId, userId) {
        const poll = this.getPoll(pollId);
        if (!poll) return false;

        const result = poll.votes.delete(userId);
        console.log(`🗳️ Vote removed: ${pollId} - User: ${userId} (Success: ${result})`);
        return result;
    }

    hasVoted(pollId, userId) {
        const poll = this.getPoll(pollId);
        return poll ? poll.votes.has(userId) : false;
    }
}

module.exports = new PollManager();