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
        }
    },

    // Quick poll options for common scenarios
    quickPolls: {
        'weekend-plans': ['Stay Home', 'Go Out', 'Visit Friends', 'Work/Study', 'Travel'],
        'food-choice': ['Pizza', 'Burgers', 'Asian Food', 'Mexican Food', 'Italian Food', 'Other'],
        'meeting-time': ['Morning (9-11 AM)', 'Midday (11 AM-1 PM)', 'Afternoon (1-4 PM)', 'Evening (4-6 PM)'],
        'game-night': ['Board Games', 'Video Games', 'Card Games', 'Trivia', 'Party Games']
    }
};