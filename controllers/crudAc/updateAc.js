const {Ac}=require('../../db');
async function updateAc(acName, modeType, fanSpeed, newHexCode, temperature, heatLevel,powerState) {
    try {
        if (powerState!=true && powerState!=false) {
            let updateQuery = {};
            let arrayFilters = [];

            // Use switch to handle different mode types
            switch (modeType) {
                case "cool":
                    // Update by temperature for 'cool' mode
                    updateQuery = {
                        $set: {
                            'modes.$[mode].fanSettings.$[fan].codes.$[code].hexadecimalCode': newHexCode
                        }
                    };
                    arrayFilters = [
                        { 'mode.modeType': modeType },  // Match the mode type (cool)
                        { 'fan.fanSpeed': fanSpeed },   // Match the fan speed (autoFan, lowFan, etc.)
                        { 'code.temperature': temperature } // Match the specific temperature
                    ];
                    break;

                case "heat":
                    // Update by heat level for 'heat' mode
                    updateQuery = {
                        $set: {
                            'modes.$[mode].fanSettings.$[fan].codes.$[code].hexadecimalCode': newHexCode
                        }
                    };
                    arrayFilters = [
                        { 'mode.modeType': modeType },  // Match the mode type (heat)
                        { 'fan.fanSpeed': fanSpeed },   // Match the fan speed (autoFan, lowFan, etc.)
                        { 'code.heatLevel': heatLevel } // Match the specific heat level
                    ];
                    break;

                case "fan":
                case "dry":
                    // Update by fan speed for 'fan' or 'dry' modes (no temperature or heat level)
                    updateQuery = {
                        $set: {
                            'modes.$[mode].fanSettings.$[fan].hexadecimalCode': newHexCode
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
        }else if(powerState==true){
            const updatedAc = await Ac.updateOne(
                { name: acName },
                {
                    $set: {
                        'on': newHexCode
                    }
                }
            );
            return updatedAc;

        }else if(powerState==false){
            const updatedAc = await Ac.updateOne(
                { name: acName },
                {
                    $set: {
                        'off': newHexCode
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