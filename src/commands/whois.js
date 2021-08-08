const logger = require('@wizo06/logger')
const { db } = require('../firebase.js')
const { MessageEmbed } = require('discord.js')

const whois = async (interaction) => {
  try {
    await interaction.deferReply()

    const userProvidedTwitchName = interaction.options.get('username').value 

    const snapshot = await db.collection('users').where('twitchUserName', '==', userProvidedTwitchName).get()
    if (snapshot.empty) {
      logger.debug('Snapshot is empty')
      return await interaction.editReply(`No one joined the giveaway as \`${userProvidedTwitchName}\``)
    }
    
    const users = []
    snapshot.forEach(doc => {
      users.push(doc.id)
    })

    const embed = new MessageEmbed()
      .setTitle(`Twitch username: \`${userProvidedTwitchName}\``)
      .setDescription(users.map(id => `<@!${id}>`).join(' '))
      .setTimestamp()

    logger.success(`Twitch username: ${userProvidedTwitchName}`)
    console.log(users)
    await interaction.editReply({ content: '** **', embeds: [embed] })
  }
  catch (e) {
    console.error(e)
    await interaction.editReply(`❌ Failed to whois the current giveaway. Please contact <@!105897471049207808> for assistance.`)
  }
}

module.exports = { whois }