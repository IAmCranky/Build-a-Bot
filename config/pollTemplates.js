// config/pollTemplates.js
module.exports = {
    templates: {
        'yes-no': {
            name: 'Yes/No Poll',
            options: ['Yes', 'No'],
            description: 'Simple yes or no question'
        },
        'rating': {
            name: 'Rating Poll',
            options: ['⭐ (1)', '⭐⭐ (2)', '⭐⭐⭐ (3)', '⭐⭐⭐⭐ (4)', '⭐⭐⭐⭐⭐ (5)'],
            description: '1-5 star rating'
        },
        'satisfaction': {
            name: 'Satisfaction Survey',
            options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
            description: 'Satisfaction level survey'
        },
        'agreement': {
            name: 'Agreement Scale',
            options: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'],
            description: 'Level of agreement'
        },
        'frequency': {
            name: 'Frequency Poll',
            options: ['Always', 'Often', 'Sometimes', 'Rarely', 'Never'],
            description: 'How often something occurs'
        },
        'priority': {
            name: 'Priority Ranking',
            options: ['High Priority', 'Medium Priority', 'Low Priority', 'Not Important'],
            description: 'Priority level assessment'
        },
        'session-plan': {
                name: 'Next Session',
                description: 'Schedule next session',
                emoji: '📅',
                isDynamic: true,
                defaultDuration: 7200, // 5 days in minutes (5 * 24 * 60)
                autoSchedule: {
                    dayOfWeek: 0, // Sunday (0 = Sunday, 1 = Monday, etc.)
                    hour: 22, // 10 PM (24-hour format)
                    minute: 0
                },
                generateOptions: function() {
                    const options = [];
                    const today = new Date();
        
                    for (let i = 0; i < 3; i++) {
                        const nextSunday = new Date(today);
                        const daysUntilSunday = (7 - today.getDay()) % 7;
                        const daysToAdd = daysUntilSunday + (i * 7);
            
                        if (today.getDay() === 0 && i === 0) {
                            nextSunday.setDate(today.getDate() + 7);
                        } else {
                            nextSunday.setDate(today.getDate() + daysToAdd);
                        }
            
                        const formattedDate = nextSunday.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                        });
            
                        options.push(`📅 ${formattedDate}`);
                    }
        
                    options.push('❌ None of these work');
                    return options;
                }
            }
    },

    // Quick poll options for common scenarios
    quickPolls: {
        'weekend-plans': ['Stay Home', 'Go Out', 'Visit Friends', 'Work/Study', 'Travel'],
        'food-choice': ['Pizza', 'Burgers', 'Asian Food', 'Mexican Food', 'Italian Food', 'Other'],
        'meeting-time': ['Morning (9-11 AM)', 'Midday (11 AM-1 PM)', 'Afternoon (1-4 PM)', 'Evening (4-6 PM)'],
        'game-night': ['Board Games', 'Video Games', 'Card Games', 'Trivia', 'Party Games']
    },

    // Helper function to get options for a template
    getTemplateOptions: function(templateKey) {
        const template = this.templates[templateKey];
        if (!template) return null;
        
        // If it's a dynamic template, generate options
        if (template.isDynamic && template.generateOptions) {
            return template.generateOptions();
        }
        
        // Otherwise return static options
        return template.options;
    },

    // Helper function to check if template exists
    hasTemplate: function(templateKey) {
        return this.templates.hasOwnProperty(templateKey);
    }
};