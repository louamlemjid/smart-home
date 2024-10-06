const {Ac}=require('../../db');
async function addNewAc(AcName) {
    try {
        const modes = [
            {
                modeType: 'cool',
                fanSettings: [
                    {
                    fanSpeed: 'auto',
                    codes:[
                            { temperature: 16},
                            { temperature: 17},
                            { temperature: 18},
                            { temperature: 19},
                            { temperature: 20},
                            { temperature: 21},
                            { temperature: 22},
                            { temperature: 23},
                            { temperature: 24},
                            { temperature: 25},
                            { temperature: 26},
                            { temperature: 27},
                            { temperature: 28},
                            { temperature: 29},
                            { temperature: 30}
                    ]
                },
                {
                    fanSpeed: 'low',
                    codes:[
                            { temperature: 16},
                            { temperature: 17},
                            { temperature: 18},
                            { temperature: 19},
                            { temperature: 20},
                            { temperature: 21},
                            { temperature: 22},
                            { temperature: 23},
                            { temperature: 24},
                            { temperature: 25},
                            { temperature: 26},
                            { temperature: 27},
                            { temperature: 28},
                            { temperature: 29},
                            { temperature: 30}
                    ]
                },
                {
                    fanSpeed: 'medium',
                    codes:[
                            { temperature: 16},
                            { temperature: 17},
                            { temperature: 18},
                            { temperature: 19},
                            { temperature: 20},
                            { temperature: 21},
                            { temperature: 22},
                            { temperature: 23},
                            { temperature: 24},
                            { temperature: 25},
                            { temperature: 26},
                            { temperature: 27},
                            { temperature: 28},
                            { temperature: 29},
                            { temperature: 30}
                    ]
                },
                {
                    fanSpeed: 'high',
                    codes:[
                            { temperature: 16},
                            { temperature: 17},
                            { temperature: 18},
                            { temperature: 19},
                            { temperature: 20},
                            { temperature: 21},
                            { temperature: 22},
                            { temperature: 23},
                            { temperature: 24},
                            { temperature: 25},
                            { temperature: 26},
                            { temperature: 27},
                            { temperature: 28},
                            { temperature: 29},
                            { temperature: 30}
                    ]
                }
                
            ]
            },
            {
                modeType: 'heat',
                fanSettings: [
                    {
                    fanSpeed: 'auto',
                    codes:[
                        {heatLevel: 1},
                        {heatLevel: 2},
                        {heatLevel: 3},
                        {heatLevel: 4},
                        {heatLevel: 5}
                    ]
                    },
                    {
                        fanSpeed: 'medium',
                        codes:[
                            {heatLevel: 1},
                            {heatLevel: 2},
                            {heatLevel: 3},
                            {heatLevel: 4},
                            {heatLevel: 5}
                        ]
                    },
                    {
                        fanSpeed: 'high',
                        codes:[
                            {heatLevel: 1},
                            {heatLevel: 2},
                            {heatLevel: 3},
                            {heatLevel: 4},
                            {heatLevel: 5}
                            ]
                    },
                    {
                        fanSpeed: 'low',
                        codes:[
                            {heatLevel: 1},
                            {heatLevel: 2},
                            {heatLevel: 3},
                            {heatLevel: 4},
                            {heatLevel: 5}
                        ]
                                }
                ]
            },
            {
                modeType: 'dry',
                fanSettings: [
                    {
                        fanSpeed: 'auto'
                    },
                    {
                        fanSpeed: 'medium'
                    },
                    {
                        fanSpeed: 'high'
                    },
                    {
                        fanSpeed: 'low'
                    }]
            },
            {
                modeType: 'fan',
                fanSettings: [
                {
                    fanSpeed: 'auto'
                },
                {
                    fanSpeed: 'medium'
                },
                {
                    fanSpeed: 'high'
                },
                {
                    fanSpeed: 'low'
                }
            ]
            }
        ];
        let newAc = await Ac.insertMany({
            name: AcName,
            modes: modes
        });
        console.log(`New AC '${AcName}' added successfully!`);
        return newAc;
    } catch (error) {
        console.error('Error adding new AC:', error.message);
        throw error;
    }
}
module.exports = addNewAc;