// utils/templateLoader.js
const fs = require('fs');
const path = require('path');

// Simple fallback if templateLoader is causing issues
const defaultTemplates = {
    templates: {
        'yes-no': {
            name: 'Yes/No Poll',
            options: ['Yes', 'No'],
            description: 'Simple yes or no question',
            emoji: '✅',
            defaultDuration: 30
        },
        'rating-5': {
            name: '5-Star Rating',
            options: ['⭐ (1 Star)', '⭐⭐ (2 Stars)', '⭐⭐⭐ (3 Stars)', '⭐⭐⭐⭐ (4 Stars)', '⭐⭐⭐⭐⭐ (5 Stars)'],
            description: '1-5 star rating system',
            emoji: '⭐',
            defaultDuration: 60
        },
/*        'session-plan': {
            name: 'Next Session',
            description: 'Schedule next session',
            emoji: '📅',
            isDynamic: true,
            generateOptions: function() {
                const options = [];
                const today = new Date();
    
                // Find the next Sunday
                let nextSunday = new Date(today);
                const daysUntilSunday = (7 - today.getDay()) % 7;
    
                // If today is Sunday, go to next Sunday
                if (today.getDay() === 0) {
                    nextSunday.setDate(today.getDate() + 7);
                } else {
                    nextSunday.setDate(today.getDate() + daysUntilSunday);
                }
    
                // Generate 3 consecutive Sundays from that point
                for (let i = 0; i < 3; i++) {
                    const optionDate = new Date(nextSunday);
                    optionDate.setDate(nextSunday.getDate() + (i * 7));
        
                    const formattedDate = optionDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    });
        
                    options.push(`📅 ${formattedDate}`);
                }
    
                options.push('❌ None of these work');
                return options;
            }
        }       */
    },
    quickPolls: {},
    categories: {}
};

class TemplateLoader {
    constructor() {
        this.templates = { ...defaultTemplates.templates };
        this.quickPolls = { ...defaultTemplates.quickPolls };
        this.categories = { ...defaultTemplates.categories };
        console.log('📊 TemplateLoader initialized with fallback templates');
    }

    getTemplate(key) {
        return this.templates[key];
    }

    getQuickPoll(key) {
        return this.quickPolls[key];
    }

    getAllTemplates() {
        return this.templates;
    }

    getAllQuickPolls() {
        return this.quickPolls;
    }

    getCategories() {
        return this.categories;
    }
}

module.exports = new TemplateLoader();