const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
require('dotenv').config();


const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
});
client.commands = new Collection();

const pollChannel = process.env.P0LL_CHANNEL;
const guildId = process.env.GUILD_ID;
const clientId = process.env.CLIENT_ID;
const token = process.env.BOT_TOKEN;
if (!token, /*!pollChannel, REMOVE COMMENT IF USING POLL SCHEDULER*/ !guildId, !clientId) {
  console.error('Error: BOT environment variable not set!');
  process.exit(1);
}


// Load commands from folders
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// In your main bot file
const pollScheduler = require('./utils/polls/pollScheduler');

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Set up the session poll scheduler
    const sessionChannelId = pollChannel;
    pollScheduler.setupSessionPoll(sessionChannelId, client);
});

// Deploy Commands
function deploy() {
    const commands = [];
    // Grab all the command folders from the commands directory you created earlier
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
	    // Grab all the command files from the commands directory you created earlier
	    const commandsPath = path.join(foldersPath, folder);
	    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	    for (const file of commandFiles) {
		    const filePath = path.join(commandsPath, file);
		    const command = require(filePath);
		    if ('data' in command && 'execute' in command) {
			    commands.push(command.data.toJSON());
		    } else {
			    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		    }
	    }
    }

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(token);

    // and deploy your commands!
    (async () => {
	    try {
		    console.log(`Started refreshing ${commands.length} application (/) commands.`);

		    // The put method is used to fully refresh all commands in the guild with the current set
		    const data = await rest.put(
			    Routes.applicationGuildCommands(clientId, guildId),
			    { body: commands },
		    );

		    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	    } catch (error) {
		    // And of course, make sure you catch and log any errors!
		    console.error(error);
	    }
    })();

}


client.once('ready', async () => {
    await deploy();
    let guild;
    try {
        guild = await client.guilds.fetch(guildId);

        // Fetch channels
        const channels = await guild.channels.fetch();
        const channelData = Array.from(channels.values()).map(ch => ({
            id: ch.id,
            name: ch.name,
            type: ch.type,
        }));
        fs.writeFileSync('config/channels.json', JSON.stringify(channelData, null, 2));
        console.log('Channels saved to config/channels.json');

        // Fetch members
        const members = await guild.members.fetch({ time: 20000 });
        const memberData = Array.from(members.values()).map(mem => ({
            id: mem.id,
            username: mem.user.username,
            displayName: mem.displayName,
        }));
        fs.writeFileSync('config/members.json', JSON.stringify(memberData, null, 2));
        console.log('Members saved to config/members.json');

    } catch (error) {
        console.error('Error:', error);
        // Don't destroy/exit here
    }
    // DO NOT HAS: client.destroy(); or process.exit();
});


client.login(process.env.BOT_TOKEN);