const { Client, Intents } = require('discord.js')
const logger = require('@wizo06/logger')
const CONFIG = require('@iarna/toml').parse(require('fs').readFileSync('config/config.toml'))
const { token, guildId } = CONFIG.discord

;(async () => {
	try {
		const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]})
		await client.login(token)
	
		const startData = {
			name: 'start',
			description: 'Start a new giveaway.',
			defaultPermission: false,
		}

		const closeData = {
			name: 'close',
			description: 'Close the current giveaway. This will prevent users from joining the current giveaway.',
			defaultPermission: false,
		}

		const resumeData = {
			name: 'resume',
			description: 'Resume the current giveaway. This will allow users to join the current giveaway again.',
			defaultPermission: false,
		}

		const drawData = {
			name: 'draw',
			description: `Draw a winner from the current entries. The giveaway will be closed if it isn't already.`,
			defaultPermission: false,
			options: [
				{
					name: 'follower_bonus',
					description: 'Give +1 bonus entry for users who have been following for more than 30 days.',
					type: 'BOOLEAN',
				},
				{
					name: 'subscriber_bonus',
					description: 'Give +1 bonus entry for users who are subscribed.',
					type: 'BOOLEAN'
				},
				{
					name: 'shuffle',
					description: 'Shuffle before drawing.',
					type: 'BOOLEAN'
				}
			]
		}

		const exportData = {
			name: 'export',
			description: 'Export all entries into a text file. Useful for copy pasting them into a random name picker website.',
			defaultPermission: false,
			options: [
				{
					name: 'follower_bonus',
					description: 'Give +1 bonus entry for users who have been following for more than 30 days.',
					type: 'BOOLEAN',
				},
				{
					name: 'subscriber_bonus',
					description: 'Give +1 bonus entry for users who are subscribed.',
					type: 'BOOLEAN'
				},
				{
					name: 'shuffle',
					description: 'Shuffle before exporting.',
					type: 'BOOLEAN'
				}

			]
		}

		const joinData = {
			name: 'join',
			description: 'Join the giveaway by providing your Twitch username.',
			defaultPermission: true,
			options: [
				{
					name: 'username',
					description: 'Your Twitch username',
					type: 'STRING',
					required: true,
				}
			]
		}
		
		const whoisData = {
			name: 'whois',
			description: 'Look up all the users that provided a given Twitch username.',
			defaultPermission: false,
			options: [
				{
					name: 'username',
					description: 'Twitch username',
					type: 'STRING',
					required: true,
				}
			]
		}
		
		const commandsData = [startData, closeData, resumeData, drawData, exportData, joinData, whoisData]
		const commands = await client.guilds.cache.get(guildId)?.commands.set(commandsData)
		logger.success(`Commands registered`)

		const startCommand = commands.filter(command => command.name === 'start')
		const closeCommand = commands.filter(command => command.name === 'close')
		const resumeCommand = commands.filter(command => command.name === 'resume')
		const drawCommand = commands.filter(command => command.name === 'draw')
		const exportCommand = commands.filter(command => command.name === 'export')
		const whoisCommand = commands.filter(command => command.name === 'whois')

		const { ownerId } = client.guilds.cache.get(guildId)

		const startPermissions = {
			id: startCommand.first().id,
			permissions: [
				{
					id: ownerId,
					type: 'USER',
					permission: true,
				}
			]
		}

		const closePermissions = {
			id: closeCommand.first().id,
			permissions: [
				{
					id: ownerId,
					type: 'USER',
					permission: true,
				}
			]
		}

		const resumePermissions = {
			id: resumeCommand.first().id,
			permissions: [
				{
					id: ownerId,
					type: 'USER',
					permission: true,
				}
			]
		}

		const drawPermissions = {
			id: drawCommand.first().id,
			permissions: [
				{
					id: ownerId,
					type: 'USER',
					permission: true,
				}
			]
		}

		
		const exportPermissions = {
			id: exportCommand.first().id,
			permissions: [
				{
					id: ownerId,
					type: 'USER',
					permission: true,
				}
			]
		}
		
		const whoisPermissions = {
			id: whoisCommand.first().id,
			permissions: [
				{
					id: ownerId,
					type: 'USER',
					permission: true,
				}
			]
		}
		const fullPermissions = [startPermissions, closePermissions, resumePermissions, drawPermissions, exportPermissions, whoisPermissions]
		await client.guilds.cache.get(guildId)?.commands.permissions.set({ fullPermissions })
		logger.success(`Permissions adjusted`)
	
		await client.destroy()
	}
	catch (e) {
		console.error(e)
	}
})()
