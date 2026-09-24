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



			sendAudio: async (
				jid: string,
				audio: Extract<AnyMessageContent, { audio: any }>["audio"],
				ptt = false,
				options: MiscMessageGenerationOptions = {}
			) => {
				return sock.sendMessage(jid, { audio, ptt }, options)
			},
			sendVideo: async (
				jid: string,
				video: Extract<AnyMessageContent, { video: any }>["video"],
				caption?: string,
				options: MiscMessageGenerationOptions = {}
			) => {
				return sock.sendMessage(jid, { video, caption }, options)
			},
			sendImage: async (
				jid: string,
				image: Extract<AnyMessageContent, { image: any }>["image"],
				caption?: string,
				options: MiscMessageGenerationOptions = {}
			) => {
				return sock.sendMessage(jid, { image, caption }, options)
			},
		},
	})
}
