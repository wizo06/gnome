const { Client, Intents } = require('discord.js')
const logger = require('@wizo06/logger')
const CONFIG = require('@iarna/toml').parse(require('fs').readFileSync('config/config.toml'))
const { start } = require('./commands/start.js')
const { close } = require('./commands/close.js')
const { resume } = require('./commands/resume.js')
const { draw } = require('./commands/draw.js')
const { exportCommand } = require('./commands/export.js')
const { join } = require('./commands/join.js')
const { whois } = require('./commands/whois.js')

;(async () => {
	try {
		const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]})
    
    client.on('interactionCreate', interaction => {
      if (!interaction.isCommand()) return

      if (interaction.commandName === 'start') return start(interaction)
      if (interaction.commandName === 'close') return close(interaction)
      if (interaction.commandName === 'resume') return resume(interaction)
      if (interaction.commandName === 'draw') return draw(interaction)
      if (interaction.commandName === 'export') return exportCommand(interaction)
      if (interaction.commandName === 'join') return join(interaction)
      if (interaction.commandName === 'whois') return whois(interaction)
    })

    client.on('ready', () => {
      logger.success(`Logged in as ${client.user.tag}!`)
    })
    
		await client.login(CONFIG.discord.token)
	}
	catch (e) {
		console.error(e)
	}
})()
