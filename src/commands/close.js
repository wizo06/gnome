const logger = require('@wizo06/logger')
const { db } = require('../firebase.js')

const close = async (interaction) => {
  try {
    await interaction.deferReply()

    await db.collection('status').doc('0').set({ active: false })

    logger.success(`Closed the current giveaway`)
    await interaction.editReply(`✅ You closed the current giveaway. Users can't join anymore.`)
  }
  catch (e) {
    console.error(e)
    await interaction.editReply(`❌ Failed to close the current giveaway. Please contact <@!105897471049207808> for assistance.`)
  }
}

module.exports = { close }