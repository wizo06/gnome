const logger = require('@wizo06/logger')
const { db } = require('../firebase.js')

const resume = async (interaction) => {
  try {
    await interaction.deferReply()

    await db.collection('status').doc('0').set({ active: true })

    logger.success(`Resumed the current giveaway`)
    await interaction.editReply(`✅ You resumed the current giveaway. Users can join again.`)
  }
  catch (e) {
    console.error(e)
    await interaction.editReply(`❌ Failed to resume the current giveaway. Please contact <@!105897471049207808> for assistance.`)
  }
}

module.exports = { resume }