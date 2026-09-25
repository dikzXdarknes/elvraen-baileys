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

			sendList: async (
			jid: string,
			title: string,
			description: string,
			buttonText: string,
			sections: proto.Message.ListMessage.ISection[],
			footerText?: string,
			options: MiscMessageGenerationOptions = {}
		) =>
				sock.sendMessage(
					jid,
					{
						list: {
							title,
							description,
							buttonText,
							listType: proto.Message.ListMessage.ListType.SINGLE_SELECT,
							sections,
							...(footerText ? { footerText } : {}),
						},
					},
					options
				),

		sendButtons: async (
			jid: string,
			contentText: string,
			buttons: proto.Message.ButtonsMessage.IButton[],
			footerText?: string,
			options: MiscMessageGenerationOptions = {}
		) =>
				sock.sendMessage(
					jid,
					{
						buttons: {
							contentText,
							...(footerText ? { footerText } : {}),
							headerType: proto.Message.ButtonsMessage.HeaderType.TEXT,
							buttons,
						},
					},
					options
				),

		sendNativeFlow: async (
			jid: string,
			contentText: string,
			buttons: proto.Message.ButtonsMessage.IButton[],
			footerText?: string,
			options: MiscMessageGenerationOptions = {}
		) =>
			sock.sendMessage(
				jid,
				{
					buttons: {
					contentText,
					...(footerText ? { footerText } : {}),
					headerType: proto.Message.ButtonsMessage.HeaderType.TEXT,
					buttons: buttons.map(button => ({
						...button,
						type: proto.Message.ButtonsMessage.Button.Type.NATIVE_FLOW,
					}))
					},
				},
				options
			),

		sendButtonReply: async (
			jid: string,
			buttonId: string,
			displayText: string,
			options: MiscMessageGenerationOptions = {}
		) =>
			sock.sendMessage(
				jid,
				{
					buttonReply: {
						id: buttonId,
						displayText,
						index: 0,
					},
					type: 'plain',
				},
				options
			),

		sendListReply: async (
			jid: string,
			rowId: string,
			displayText: string,
			description?: string,
			options: MiscMessageGenerationOptions = {}
		) =>
			sock.sendMessage(
				jid,
				{
					listReply: {
						title: displayText,
						description,
						singleSelectReply: {
							selectedRowId: rowId,
						},
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
