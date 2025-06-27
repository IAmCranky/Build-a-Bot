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
        }
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