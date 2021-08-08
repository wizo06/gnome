const logger = require('@wizo06/logger')
const { db } = require('../firebase.js')
const { MessageActionRow, MessageButton } = require('discord.js')

const start = async (interaction) => {
  try {
    await interaction.deferReply()

    const doc = await db.collection('status').doc('0').get()

    // If there is no 'status' in db, simply start a new giveaway.
    if (!doc.exists) {
      await db.collection('status').doc('0').set({ active: true })
      logger.success(`Started a new giveaway`)
      await interaction.editReply(`✅ You started a new giveaway. Users can now join the giveaway by using the \`/join\` command.`)
      return
    }
    
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('yes')
          .setLabel('Yes')
          .setStyle('PRIMARY')
      )
      .addComponents(
        new MessageButton()
          .setCustomId('no')
          .setLabel('No')
          .setStyle('PRIMARY')
      )
    
    const snapshot = await db.collection('users').get()
    const messageContent = `⚠️ There is an ongoing giveaway with ${snapshot.size} entries. **Would you like to delete all current entries and start a new one?**`
    
    const msg = await interaction.editReply({ content: messageContent, components: [row] })

    const filter = interaction => (interaction.customId === 'yes' || interaction.customId === 'no') && interaction.user.id === interaction.guild.ownerId
    const msgCompIntr = await msg.awaitMessageComponent({ filter })

    // If button is 'no' then delete reply and do nothing
    if (msgCompIntr.customId === 'no') await interaction.deleteReply()
    // If button is 'yes' then set "active" to "false", 
    // then delete the 'users' collection and start a new giveaway
    else {
      logger.debug(`Setting "active" to "false"`)
      await interaction.editReply({ content: `⏳ Closing the giveaway for you...`, components: [] })

      // set active to false
      await db.collection('status').doc('0').set({ active: false })
      
      logger.debug(`Deleting collection`)
      await interaction.editReply({ content: `⏳ Deleting all current entries...` })
      // Batch delete the "users" collection
      const query = await db.collection('users')

      const deleteQueryBatch = async (db, query) => {
        const snapshot = await query.get()

        if (snapshot.size === 0) return Promise.resolve()

        const batch = db.batch()
        snapshot.docs.forEach(doc => { 
          batch.delete(doc.ref)
        })
        await batch.commit()
        
        process.nextTick(() => deleteQueryBatch(db, query))
      }

      await deleteQueryBatch(db, query)

      // Start a new giveaway
      logger.debug(`Setting "active" back to "true"`)
      await db.collection('status').doc('0').set({ active: true })
      logger.success(`Started a new giveaway`)
      await interaction.editReply(`✅ You started a new giveaway. Users can now join the giveaway by using the \`/join\` command.`)
    }
  }
  catch (e) {
    console.error(e)
    await interaction.editReply(`❌ Failed to start a new giveaway. Please contact <@!105897471049207808> for assistance.`)
  }
}

module.exports = { start }