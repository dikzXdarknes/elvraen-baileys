import { proto } from '../../WAProto/index.js'
import type { AnyMessageContent, MiscMessageGenerationOptions, WAMessage, WAMessageKey } from '../Types'

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
			) => sock.sendMessage(jid, { text }, options),

			sendAudio: async (
				jid: string,
				audio: Extract<AnyMessageContent, { audio: any }>['audio'],
				ptt = false,
				options: MiscMessageGenerationOptions = {}
			) => sock.sendMessage(jid, { audio, ptt }, options),

			sendVideo: async (
				jid: string,
				video: Extract<AnyMessageContent, { video: any }>['video'],
				caption?: string,
				options: MiscMessageGenerationOptions = {}
			) => sock.sendMessage(jid, { video, caption }, options),

			sendDocument: async (
				jid: string,
				document: Extract<AnyMessageContent, { document: any }>['document'],
				mimetype: string,
				fileName?: string,
				options: MiscMessageGenerationOptions = {}
			) =>
				sock.sendMessage(
					jid,
					{ document, mimetype, ...(fileName ? { fileName } : {}) },
					options
				),

			sendImage: async (
				jid: string,
				image: Extract<AnyMessageContent, { image: any }>['image'],
				caption?: string,
				options: MiscMessageGenerationOptions = {}
			) => sock.sendMessage(jid, { image, caption }, options),

			sendSticker: async (
				jid: string,
				sticker: Extract<AnyMessageContent, { sticker: any }>['sticker'],
				options: MiscMessageGenerationOptions = {}
			) => sock.sendMessage(jid, { sticker }, options),

			sendLocation: async (
				jid: string,
				latitude: number,
				longitude: number,
				name?: string,
				address?: string,
				options: MiscMessageGenerationOptions = {}
			) =>
				sock.sendMessage(
					jid,
					{
						location: {
							degreesLatitude: latitude,
							degreesLongitude: longitude,
							...(name ? { name } : {}),
							...(address ? { address } : {}),
						},
					},
					options
				),

			sendContact: async (
				jid: string,
				displayName: string,
				vcard: string,
				options: MiscMessageGenerationOptions = {}
			) =>
				sock.sendMessage(
					jid,
					{
						contacts: {
							displayName,
							contacts: [{ vcard }],
						},
					},
					options
				),

			sendReaction: async (
				jid: string,
				key: WAMessageKey,
				text: string,
				options: MiscMessageGenerationOptions = {}
			) =>
				sock.sendMessage(
					jid,
					{ react: { text, key } },
					options
				),

			sendPoll: async (
				jid: string,
				name: string,
				values: string[],
				selectableCount = 1,
				options: MiscMessageGenerationOptions = {}
			) =>
				sock.sendMessage(
					jid,
					{
						poll: {
							name,
							values,
							selectableCount,
						},
					},
					options
				),

			sendPin: async (
				jid: string,
				key: WAMessageKey,
				type: proto.PinInChat.Type,
				time?: 86400 | 604800 | 2592000,
				options: MiscMessageGenerationOptions = {}
			) =>
				sock.sendMessage(
					jid,
					{
						pin: key,
						type,
						...(time !== undefined ? { time } : {}),
					},
					options
				),

			sendDelete: async (
				jid: string,
				key: WAMessageKey,
				options: MiscMessageGenerationOptions = {}
			) =>
				sock.sendMessage(
					jid,
					{ delete: key },
					options
				),

			sendForward: async (
				jid: string,
				message: WAMessage,
				force = false,
				options: MiscMessageGenerationOptions = {}
			) =>
				sock.sendMessage(
					jid,
					{ forward: message, force },
					options
				),

			sendReply: async (
				jid: string,
				text: string,
				quoted: WAMessage,
				options: MiscMessageGenerationOptions = {}
			) =>
				sock.sendMessage(
					jid,
					{ text },
					{ ...options, quoted }
				),
		},
	})
}
