// utils/pollScheduler.js
const pollManager = require('../../data/pollManager');
const { createPollEmbed } = require('./pollEmbed');
const { createPollButtons } = require('./pollButtons');
const { generatePollId, createPollData } = require('./pollHelpers');
const { endPollById } = require('../../events/pollInteractionHandler');
const pollTemplates = require('../../config/pollTemplates');

class PollScheduler {
    constructor() {
        this.scheduledPolls = new Map();
        this.startScheduler();
    }

    startScheduler() {
        // Check every minute for scheduled polls
        setInterval(() => {
            this.checkScheduledPolls();
        }, 60000);
    }

    scheduleSessionPoll(channelId, client) {
        const template = pollTemplates.templates['session-plan'];
        if (!template.autoSchedule) return;

        const nextRunTime = this.getNextScheduleTime(template.autoSchedule);
        
        this.scheduledPolls.set('session-plan', {
            channelId,
            template,
            nextRun: nextRunTime,
            client
        });

        console.log(`📅 Session poll scheduled for: ${nextRunTime.toLocaleString()}`);
    }

    getNextScheduleTime(schedule) {
        const now = new Date();
        const next = new Date();
        
        // Set to the specified day of week
        const daysUntilTarget = (schedule.dayOfWeek - now.getDay() + 7) % 7;
        next.setDate(now.getDate() + daysUntilTarget);
        
        // Set to the specified time
        next.setHours(schedule.hour, schedule.minute, 0, 0);
        
        // If the time has already passed today and it's the target day, schedule for next week
        if (daysUntilTarget === 0 && now.getTime() >= next.getTime()) {
            next.setDate(next.getDate() + 7);
        }
        
        return next;
    }

    async checkScheduledPolls() {
        const now = new Date();
        
        for (const [pollKey, scheduledPoll] of this.scheduledPolls.entries()) {
            if (now >= scheduledPoll.nextRun) {
                await this.createScheduledPoll(pollKey, scheduledPoll);
                
                // Schedule the next occurrence
                const nextRun = this.getNextScheduleTime(scheduledPoll.template.autoSchedule);
                scheduledPoll.nextRun = nextRun;
                console.log(`📅 Next ${pollKey} poll scheduled for: ${nextRun.toLocaleString()}`);
            }
        }
    }

    async createScheduledPoll(pollKey, scheduledPoll) {
        try {
            const { channelId, template, client } = scheduledPoll;
            const channel = await client.channels.fetch(channelId);
            
            if (!channel) {
                console.error(`❌ Channel not found: ${channelId}`);
                return;
            }

            // Generate poll data
            const question = "What day works best for our next session?";
            const options = pollTemplates.getTemplateOptions('session-plan');
            const duration = template.defaultDuration;
            const pollId = generatePollId('scheduler');
            
            const pollData = createPollData(question, options, duration, false, 'scheduler');
            pollManager.createPoll(pollId, pollData);

            // Create embed and buttons
            const embed = createPollEmbed(pollData);
            embed.setAuthor({ 
                name: `${template.emoji} ${template.name} (Auto-scheduled)`,
                iconURL: client.user.displayAvatarURL()
            });
            
            embed.setFooter({ 
                text: `${template.description} • Total votes: 0 • Ends in ${Math.floor(duration / 1440)} days` 
            });

            const buttons = createPollButtons(options, pollId);

            // Send the poll
            const message = await channel.send({
                content: "🔔 **Weekly Session Poll** - Time to plan our next session!",
                embeds: [embed],
                components: buttons
            });

            // Schedule auto-end
            setTimeout(() => {
                endPollById(pollId, { message });
            }, duration * 60 * 1000);

            console.log(`✅ Auto-created session poll in ${channel.name}`);

        } catch (error) {
            console.error('❌ Error creating scheduled poll:', error);
        }
    }

    // Method to manually set up the scheduler (call this when your bot starts)
    setupSessionPoll(channelId, client) {
        this.scheduleSessionPoll(channelId, client);
    }
}

module.exports = new PollScheduler();