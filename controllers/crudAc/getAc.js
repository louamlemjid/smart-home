const Ac = require("../../models/Ac");
async function getAc() {
    try {
        // Fetch only the 'name' field for each AC
        const acNames = await Ac.find({}, { name: 1, _id: 0 });
        return acNames.map(ac => ac.name);
    } catch (error) {
        console.error("Error fetching AC names:", error);
        throw error;
    }
}
module.exports = getAc;