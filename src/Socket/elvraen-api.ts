import type { AnyMessageContent, MiscMessageGenerationOptions } from '../Types'

type ElvraenSocket = {
	sendMessage: (
		jid: string,
		content: AnyMessageContent,
		options?: MiscMessageGenerationOptions
	) => Promise<unknown>
}

export const attachElvraenAPI = <T extends ElvraenSocket>(sock: T) => {
	return Object.assign(sock, {
		elvraen: {
			sendText: async (
				jid: string,
				text: string,
				options: MiscMessageGenerationOptions = {}
			) => {
				return sock.sendMessage(jid, { text }, options)
			},
		},
	})
}
