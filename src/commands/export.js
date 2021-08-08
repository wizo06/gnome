const { ApiClient } = require('twitch')
const { RefreshableAuthProvider, StaticAuthProvider } = require('twitch-auth')
const CONFIG = require('@iarna/toml').parse(require('fs').readFileSync('config/config.toml'))
const { clientId, clientSecret, broadcasterName } = CONFIG.twitch
const { accessToken, refreshToken, expiryTimestamp } = require('config/token.json')
const { writeFileSync } = require('fs')
const logger = require('@wizo06/logger')
const { db } = require('../firebase.js')
const fetch = require('node-fetch')

const authProvider = new RefreshableAuthProvider(
  new StaticAuthProvider(clientId, accessToken),
  {
    clientSecret,
    refreshToken,
    expiry: new Date(expiryTimestamp),
    onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
      const newTokenData = {
        accessToken,
        refreshToken,
        expiryTimestamp: expiryDate === null ? null : expiryDate.getTime()
      }
      
      writeFileSync('./config/token.json', JSON.stringify(newTokenData, null, 2), 'UTF-8')
    }
  }
)

const apiClient = new ApiClient({ authProvider })

const exportCommand = async (interaction) => {
  try {
    await interaction.deferReply()

    logger.debug(`Setting "active" to "false"`)
    await interaction.editReply(`⏳ Closing the giveaway for you...`)
    await db.collection('status').doc('0').set({ active: false })

    logger.debug(`Retrieving userId of broadcaster`)
    const user = await apiClient.helix.users.getUserByName(broadcasterName)
    if (!user) {
      console.error(`Could not get info about broadcaster: ${broadcasterName}`)
      return await interaction.editReply(`❌ Failed to draw a winner. Please contact <@!105897471049207808> for assistance.`)
    }
    
    const twitchUsersMap = new Map()

    // Get subscribers
    logger.debug(`Retrieving subscribers`)
    await interaction.editReply(`⏳ Retrieving subscribers...`)
    const subsPaginated = await apiClient.helix.subscriptions.getSubscriptionsPaginated(user.id)
    const subscriptions = await subsPaginated.getAll()
    
    for (const sub of subscriptions) {
      twitchUsersMap.set(sub.userName, { subscribed: true })
    }  

    // Get followers
    logger.debug(`Retrieving followers`)
    await interaction.editReply(`⏳ Retrieving followers...`)
    const followingOfBroadcasterPaginated = await apiClient.helix.users.getFollowsPaginated({ followedUser: user.id })
    const followingOfBroadcaster = await followingOfBroadcasterPaginated.getAll()

    for (const follow of followingOfBroadcaster) {
      const value = twitchUsersMap.get(follow.userName)
      if (value) {
        value['followDate'] = follow.followDate
        twitchUsersMap.set(follow.userName, value)
      }
      else {
        twitchUsersMap.set(follow.userName, { followDate: follow.followDate })
      }
    }

    const followerBonus = interaction.options.get('follower_bonus')?.value 
    const subscriberBonus = interaction.options.get('subscriber_bonus')?.value 
    const shuffle = interaction.options.get('shuffle')?.value 

    const snapshot = await db.collection('users').get()

    logger.debug(`Populating pool. followerBonus: ${followerBonus}. subscriberBonus: ${subscriberBonus}. shuffle: ${shuffle}`)
    const pool = []
    snapshot.forEach(doc => {
      const value = twitchUsersMap.get(doc.data().twitchUserName)

      // User is not following the broadcaster. Do not add to pool.
      if (!value?.followDate) return

      // Each user gets at least 1 entry
      pool.push(doc.data().twitchUserName)

      // +1 bonus entry if user has been following for more than 30 days (accuracy +- 1s)
      if (followerBonus) {
        const followDateUNIX = Math.floor(new Date(value.followDate).getTime() / 1000)
        const nowUNIX = Math.floor(new Date().getTime() / 1000)
        const diff = nowUNIX - followDateUNIX
        const thirtyDaysInSeconds = 2592000
        if (diff > thirtyDaysInSeconds) pool.push(doc.data().twitchUserName)
      }

      // +1 bonus entry if user is subscribed
      if (subscriberBonus) {
        if (value.subscribed) pool.push(doc.data().twitchUserName)
      }
    })

    if (pool.length === 0) return await interaction.editReply(`❌ No one was able to qualify to enter the pool.`)

    // Shuffle if needed
    const finalPool = (shuffle) 
      ? pool.map(a => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map(a => a[1]) 
      : pool
      
    const params = new URLSearchParams()
    params.append('api_dev_key', CONFIG.pastebin.api)
    params.append('api_option', 'paste')
    params.append('api_paste_code', finalPool.join('\n'))
    params.append('api_paste_private', '1')
    params.append('api_paste_expire_date', '1H')
  
    const opts = {
      method: 'POST',
      body: params,
    }
  
    const res = await fetch('https://pastebin.com/api/api_post.php', opts)
    if (res.status != 200) {
      writeFileSync('./export.txt', finalPool.join('\n'), 'UTF-8')
      throw new Error()
    }
    const body = await res.text()
        
    logger.success(`Pastebin link: ${body}`)
    await interaction.editReply(`✅ The exported list can be found here: <${body}>. The list will expire in 1 hour!`)
  }
  catch (e) {
    console.error(e)
    await interaction.editReply(`❌ Failed to export the entries. Please contact <@!105897471049207808> for assistance.`)
  }
}

module.exports = { exportCommand }