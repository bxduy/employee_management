import db from '../models/index.js'
const FormTemplate = db.FormTemplate

const createFormTemplates = async () => {
    try {

        const templates = [
            {
                name: 'trial',
                criteria: JSON.stringify({
                    sections: [
                        {
                            title: 'Basic Information',
                            fields: [
                                { label: 'Name' },
                                { label: 'Email' },
                                { label: 'Position' }
                            ]
                        },
                        {
                            title: 'Trial Period Details',
                            fields: [
                                { label: 'Start Date' },
                                { label: 'End Date' },
                                { label: 'Mentor Name' }
                            ]
                        },
                        {
                            title: 'Performance Evaluation',
                            fields: [
                                { label: 'Task Completion Rate' },
                                { label: 'Quality of Work' },
                                { label: 'Attendance' }
                            ]
                        }
                    ]
                })
            },
            {
                name: 'annual',
                criteria: JSON.stringify({
                    sections: [
                        {
                            title: 'Personal Information',
                            fields: [
                                { label: 'Name' },
                                { label: 'Email' },
                                { label: 'Phone Number' },
                            ]
                        },
                        {
                            title: 'Job Performance',
                            fields: [
                                { label: 'Job Knowledge' },
                                { label: 'Work Quality' },
                                { label: 'Attendance' },
                                { label: 'Communication Skills' }
                            ]
                        },
                        {
                            title: 'Professional Development',
                            fields: [
                                { label: 'Training Attended' },
                                { label: 'Certifications Earned' },
                                { label: 'Goals for Next Year' }
                            ]
                        }
                    ]
                })
            }
        ];

        // Tạo các mẫu form
        for (const template of templates) {
            await FormTemplate.create(template);
        }

        console.log('Form templates created successfully!');
    } catch (error) {
        console.error('Error creating form templates:', error);
    } 
};

createFormTemplates();
