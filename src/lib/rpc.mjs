import DiscordRPC from "discord-rpc"
const rpc = new DiscordRPC.Client({ transport: 'ipc' })

const defaultConfig = {
    details: "On the main page.",
    state: "TEMP mode",
    largeImageKey: "tempalpha",
    startTimestamp: new Date(),
    largeImageText: ":3",
    instance: false
}

/**
     * @param config Config for the Rich Presence client.
     * 
     * You can check out https://discord.com/developers/docs/rich-presence/how-to#introducing-rich-presence for more information
*/
export function updateRPC(config) {
    rpc.setActivity(config)
}

export default function initRPC(mode) {
    defaultConfig.state = defaultConfig.state.replace("TEMP", mode)
    rpc.on('ready', () => {
        rpc.setActivity(defaultConfig)
    })
}

rpc.login({ clientId: "1269057919429644358" }).catch(err => console.log(err))