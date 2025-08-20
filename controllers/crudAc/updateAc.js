const {Ac}=require('../../db');
async function updateAc(acName, modeType, fanSpeed, rowData, temperature, heatLevel,powerState) {
    try {
        if (powerState!="on" && powerState!="off") {
            let updateQuery = {};
            let arrayFilters = [];

            // Use switch to handle different mode types
            switch (modeType) {
                case "cold":
                    // Update by temperature for 'cold' mode
                    updateQuery = {
                        $set: {
                            'modes.$[mode].fanSettings.$[fan].codes.$[code].rowData': rowData
                        }
                    };
                    arrayFilters = [
                        { 'mode.modeType': modeType },  // Match the mode type (cold)
                        { 'fan.fanSpeed': fanSpeed },   // Match the fan speed (autoFan, lowFan, etc.)
                        { 'code.temperature': temperature } // Match the specific temperature
                    ];
                    break;

                case "heat":
                    // Update by heat level for 'heat' mode
                    updateQuery = {
                        $set: {
                            'modes.$[mode].fanSettings.$[fan].codes.$[code].rowData': rowData
                        }
                    };
                    arrayFilters = [
                        { 'mode.modeType': modeType },  // Match the mode type (heat)
                        { 'fan.fanSpeed': fanSpeed },   // Match the fan speed (autoFan, lowFan, etc.)
                        { 'code.heatLevel': heatLevel } // Match the specific heat level
                    ];
                    break;

                case "fan":
                    // Update by fan speed for 'fan' mode (no temperature or heat level)
                    updateQuery = {
                        $set: {
                            'modes.$[mode].fanSettings.$[fan].rowData': rowData
                        }
                    };
                    arrayFilters = [
                        { 'mode.modeType': modeType },  // Match the mode type (fan)
                        { 'fan.fanSpeed': fanSpeed }    // Match the fan speed (autoFan, lowFan, etc.)
                    ];
                    break;
                    
                case "dry":
                    // Update by fan speed for 'fan' or 'dry' modes (no temperature or heat level)
                    updateQuery = {
                        $set: {
                            'modes.$[mode].fanSettings.$[fan].rowData': rowData
                        }
                    };
                    arrayFilters = [
                        { 'mode.modeType': modeType },  // Match the mode type (fan or dry)
                        { 'fan.fanSpeed': fanSpeed }    // Match the fan speed (autoFan, lowFan, etc.)
                    ];
                    break;

                default:
                    throw new Error('Invalid mode type');
            }

            // Perform the update
            const updatedAc = await Ac.updateOne(
                { name: acName },
                updateQuery,
                {
                    arrayFilters: arrayFilters,
                    new: true  // Return the updated document
                }
            );
            return updatedAc;
        }else if(powerState=="on"){
            const updatedAc = await Ac.updateOne(
                { name: acName },
                {
                    $set: {
                        'on': rowData
                    }
                }
            );
            return updatedAc;

        }else if(powerState=="off"){
            const updatedAc = await Ac.updateOne(
                { name: acName },
                {
                    $set: {
                        'off': rowData
                    }
                }
            );
            return updatedAc;

        }

          // Optionally return the updated document
    } catch (error) {
        console.error('Error updating AC:', error.message);
        throw error;
    }
}



module.exports = updateAc;