const logger = require('@wizo06/logger')
const { db } = require('../firebase.js')
const CONFIG = require('@iarna/toml').parse(require('fs').readFileSync('config/config.toml'))
const { broadcasterName } = CONFIG.twitch

const join = async (interaction) => {
  try {
    await interaction.deferReply()

    const doc = await db.collection('status').doc('0').get()
    if (doc.exists && doc.data().active === false) return await interaction.editReply(`❌ You cannot enter the current giveaway because it is closed.`)
    
    const { id, tag } = interaction.user
    const userProvidedTwitchName = interaction.options.get('username').value 
    
    logger.info(`${tag} (${id}) => ${userProvidedTwitchName}`)
    await db.collection('users').doc(id).set({ twitchUserName: userProvidedTwitchName })
    logger.success(`${tag} (${id}) => ${userProvidedTwitchName}`)

    await interaction.editReply(`✅ You have successfully entered the giveaway as the twitch user \`${userProvidedTwitchName}\`. **Make sure you are following ${broadcasterName} on Twitch** or else you won't be included in the pool when drawing a winner.`)
  }
  catch (e) {
    console.error(e)
    await interaction.editReply(`❌ Failed to enter the giveaway. Please contact <@!105897471049207808> for assistance.`)
  }
}

module.exports = { join }