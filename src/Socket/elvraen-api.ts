import { proto } from '../../WAProto/index.js'
import type { AnyMessageContent, LastMessageList, MiscMessageGenerationOptions, WAMessage, WAMessageKey } from '../Types'
import type { makeCommunitiesSocket } from './communities'

/** Socket Baileys asli (sebelum helper ELVRAEN dipasang). */
type BaseSocket = ReturnType<typeof makeCommunitiesSocket>

/**
 * Method socket yang dipakai helper. Tipenya diambil langsung dari socket asli
 * sehingga perubahan signature di Baileys akan memunculkan error compile di sini,
 * bukan bug diam-diam saat runtime.
 */
type ElvraenSocket = Pick<
	BaseSocket,
	| 'sendMessage'
	| 'star'
	| 'readMessages'
	| 'chatModify'
	| 'onWhatsApp'
	| 'profilePictureUrl'
	| 'fetchStatus'
	| 'fetchBlocklist'
	| 'updateProfileStatus'
	| 'updateProfileName'
	| 'getBusinessProfile'
	| 'addOrEditContact'
	| 'removeContact'
	| 'addLabel'
	| 'addChatLabel'
	| 'removeChatLabel'
	| 'addMessageLabel'
	| 'removeMessageLabel'
	| 'addOrEditQuickReply'
	| 'removeQuickReply'
>

type Opts = MiscMessageGenerationOptions
type StarKey = { id: string; fromMe?: boolean }
type MediaOf<K extends string> = Extract<AnyMessageContent, Record<K, any>>[K]

const buildElvraenAPI = (sock: ElvraenSocket) => ({
	// ---- Akun, profil, kontak ----
	checkWhatsApp: async (...phoneNumbers: string[]) => sock.onWhatsApp(...phoneNumbers),

	getProfilePicture: async (jid: string, type: 'preview' | 'image' = 'preview', timeoutMs?: number) =>
		sock.profilePictureUrl(jid, type, timeoutMs),

	getStatus: async (...jids: string[]) => sock.fetchStatus(...jids),

	getBlocklist: async () => sock.fetchBlocklist(),

	updateProfileStatus: async (status: string) => sock.updateProfileStatus(status),

	updateProfileName: async (name: string) => sock.updateProfileName(name),

	getBusinessProfile: async (jid: string) => sock.getBusinessProfile(jid),

	addOrEditContact: async (jid: string, contact: Parameters<ElvraenSocket['addOrEditContact']>[1]) =>
		sock.addOrEditContact(jid, contact),

	removeContact: async (jid: string) => sock.removeContact(jid),

	// ---- Label dan quick reply ----
	addLabel: async (jid: string, labels: Parameters<ElvraenSocket['addLabel']>[1]) => sock.addLabel(jid, labels),

	addChatLabel: async (jid: string, labelId: string) => sock.addChatLabel(jid, labelId),

	removeChatLabel: async (jid: string, labelId: string) => sock.removeChatLabel(jid, labelId),

	addMessageLabel: async (jid: string, messageId: string, labelId: string) =>
		sock.addMessageLabel(jid, messageId, labelId),

	removeMessageLabel: async (jid: string, messageId: string, labelId: string) =>
		sock.removeMessageLabel(jid, messageId, labelId),

	addOrEditQuickReply: async (quickReply: Parameters<ElvraenSocket['addOrEditQuickReply']>[0]) =>
		sock.addOrEditQuickReply(quickReply),

	removeQuickReply: async (timestamp: string) => sock.removeQuickReply(timestamp),

	// ---- Pesan biasa dan media ----
	sendText: async (jid: string, text: string, options: Opts = {}) => sock.sendMessage(jid, { text }, options),

	sendAudio: async (jid: string, audio: MediaOf<'audio'>, ptt = false, options: Opts = {}) =>
		sock.sendMessage(jid, { audio, ptt }, options),

	/** Kirim audio sebagai voice note WhatsApp (tidak mengonversi format audio). */
	sendVoice: async (jid: string, audio: MediaOf<'audio'>, options: Opts = {}) =>
		sock.sendMessage(jid, { audio, ptt: true }, options),

	sendVideo: async (jid: string, video: MediaOf<'video'>, caption?: string, options: Opts = {}) =>
		sock.sendMessage(jid, { video, caption }, options),

	/** Kirim video sebagai video note (bulat). Caption tidak dipakai oleh Baileys pada mode ini. */
	sendVideoNote: async (jid: string, video: MediaOf<'video'>, options: Opts = {}) =>
		sock.sendMessage(jid, { video, ptv: true }, options),

	sendDocument: async (
		jid: string,
		document: MediaOf<'document'>,
		mimetype: string,
		fileName?: string,
		options: Opts = {}
	) => sock.sendMessage(jid, { document, mimetype, ...(fileName ? { fileName } : {}) }, options),

	sendImage: async (jid: string, image: MediaOf<'image'>, caption?: string, options: Opts = {}) =>
		sock.sendMessage(jid, { image, caption }, options),

	sendSticker: async (jid: string, sticker: MediaOf<'sticker'>, options: Opts = {}) =>
		sock.sendMessage(jid, { sticker }, options),

	sendLocation: async (
		jid: string,
		latitude: number,
		longitude: number,
		name?: string,
		address?: string,
		options: Opts = {}
	) =>
		sock.sendMessage(
			jid,
			{
				location: {
					degreesLatitude: latitude,
					degreesLongitude: longitude,
					...(name ? { name } : {}),
					...(address ? { address } : {})
				}
			},
			options
		),

	sendContact: async (jid: string, displayName: string, vcard: string, options: Opts = {}) =>
		sock.sendMessage(jid, { contacts: { displayName, contacts: [{ vcard }] } }, options),

	sendReaction: async (jid: string, key: WAMessageKey, text: string, options: Opts = {}) =>
		sock.sendMessage(jid, { react: { text, key } }, options),

	sendPoll: async (jid: string, name: string, values: string[], selectableCount = 1, options: Opts = {}) =>
		sock.sendMessage(jid, { poll: { name, values, selectableCount } }, options),

	sendPin: async (
		jid: string,
		key: WAMessageKey,
		type: proto.PinInChat.Type,
		time?: 86400 | 604800 | 2592000,
		options: Opts = {}
	) => sock.sendMessage(jid, { pin: key, type, ...(time !== undefined ? { time } : {}) }, options),

	sendDelete: async (jid: string, key: WAMessageKey, options: Opts = {}) =>
		sock.sendMessage(jid, { delete: key }, options),

	sendForward: async (jid: string, message: WAMessage, force = false, options: Opts = {}) =>
		sock.sendMessage(jid, { forward: message, force }, options),

	sendReply: async (jid: string, text: string, quoted: WAMessage, options: Opts = {}) =>
		sock.sendMessage(jid, { text }, { ...options, quoted }),

	editMessage: async (jid: string, key: WAMessageKey, content: AnyMessageContent, options: Opts = {}) =>
		sock.sendMessage(jid, { ...content, edit: key }, options),

	sendStatus: async (content: AnyMessageContent, options: Opts = {}) =>
		sock.sendMessage('status@broadcast', content, options),

	// ---- Pesan interaktif (tampilan bergantung pada klien/versi WhatsApp) ----
	sendList: async (
		jid: string,
		title: string,
		description: string,
		buttonText: string,
		sections: proto.Message.ListMessage.ISection[],
		footerText?: string,
		options: Opts = {}
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
					...(footerText ? { footerText } : {})
				}
			},
			options
		),

	sendButtons: async (
		jid: string,
		contentText: string,
		buttons: proto.Message.ButtonsMessage.IButton[],
		footerText?: string,
		options: Opts = {}
	) =>
		sock.sendMessage(
			jid,
			{
				buttons: {
					contentText,
					...(footerText ? { footerText } : {}),
					headerType: proto.Message.ButtonsMessage.HeaderType.TEXT,
					buttons
				}
			},
			options
		),

	sendCTA: async (
		jid: string,
		bodyText: string,
		buttonName: string,
		buttonParamsJson: string,
		headerTitle?: string,
		footerText?: string,
		options: Opts = {}
	) =>
		sock.sendMessage(
			jid,
			{
				interactiveMessage: {
					body: { text: bodyText },
					...(headerTitle ? { header: { title: headerTitle } } : {}),
					...(footerText ? { footer: { text: footerText } } : {}),
					nativeFlowMessage: { buttons: [{ name: buttonName, buttonParamsJson }] }
				}
			},
			options
		),

	sendCarousel: async (
		jid: string,
		cards: proto.Message.IInteractiveMessage[],
		messageVersion = 1,
		carouselCardType: proto.Message.InteractiveMessage.CarouselMessage.CarouselCardType = proto.Message
			.InteractiveMessage.CarouselMessage.CarouselCardType.HSCROLL_CARDS,
		options: Opts = {}
	) =>
		sock.sendMessage(
			jid,
			{ interactiveMessage: { carouselMessage: { cards, messageVersion, carouselCardType } } },
			options
		),

	sendTemplate: async (
		jid: string,
		contentText: string,
		buttons: proto.IHydratedTemplateButton[],
		footerText?: string,
		titleText?: string,
		templateId?: string,
		options: Opts = {}
	) =>
		sock.sendMessage(
			jid,
			{
				templateMessage: {
					hydratedFourRowTemplate: {
						hydratedContentText: contentText,
						...(footerText ? { hydratedFooterText: footerText } : {}),
						...(titleText ? { hydratedTitleText: titleText } : {}),
						...(templateId ? { templateId } : {}),
						hydratedButtons: buttons
					}
				}
			},
			options
		),

	sendInteractive: async (
		jid: string,
		bodyText: string,
		buttons: proto.Message.InteractiveMessage.NativeFlowMessage.INativeFlowButton[],
		headerTitle?: string,
		headerSubtitle?: string,
		footerText?: string,
		options: Opts = {}
	) =>
		sock.sendMessage(
			jid,
			{
				interactiveMessage: {
					body: { text: bodyText },
					...(headerTitle || headerSubtitle
						? {
								header: {
									...(headerTitle ? { title: headerTitle } : {}),
									...(headerSubtitle ? { subtitle: headerSubtitle } : {})
								}
							}
						: {}),
					...(footerText ? { footer: { text: footerText } } : {}),
					nativeFlowMessage: { buttons }
				}
			},
			options
		),

	sendNativeFlow: async (
		jid: string,
		contentText: string,
		buttons: proto.Message.ButtonsMessage.IButton[],
		footerText?: string,
		options: Opts = {}
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
						type: proto.Message.ButtonsMessage.Button.Type.NATIVE_FLOW
					}))
				}
			},
			options
		),

	sendButtonReply: async (jid: string, buttonId: string, displayText: string, options: Opts = {}) =>
		sock.sendMessage(jid, { buttonReply: { id: buttonId, displayText, index: 0 }, type: 'plain' }, options),

	sendListReply: async (jid: string, rowId: string, displayText: string, description?: string, options: Opts = {}) =>
		sock.sendMessage(
			jid,
			{
				listReply: {
					title: displayText,
					...(description !== undefined ? { description } : {}),
					singleSelectReply: { selectedRowId: rowId }
				}
			},
			options
		),

	// ---- Status baca dan chat ----
	readMessages: async (keys: WAMessageKey[]) => sock.readMessages(keys),

	archiveChat: async (jid: string, lastMessages: LastMessageList) =>
		sock.chatModify({ archive: true, lastMessages }, jid),

	unarchiveChat: async (jid: string, lastMessages: LastMessageList) =>
		sock.chatModify({ archive: false, lastMessages }, jid),

	markChatUnread: async (jid: string, lastMessages: LastMessageList) =>
		sock.chatModify({ markRead: false, lastMessages }, jid),

	starMessage: async (jid: string, key: StarKey) => sock.star(jid, [key], true),

	unstarMessage: async (jid: string, key: StarKey) => sock.star(jid, [key], false)
})

/** Tipe namespace `sock.elvraen`. */
export type ElvraenAPI = ReturnType<typeof buildElvraenAPI>

/**
 * Memasang namespace `elvraen` pada socket yang sama (objek tidak diganti, method asli tetap ada).
 * Memanggilnya dua kali aman: namespace yang sudah ada tidak dibuat ulang.
 */
export const attachElvraenAPI = <T extends ElvraenSocket>(sock: T): T & { elvraen: ElvraenAPI } => {
	const target = sock as T & { elvraen?: ElvraenAPI }
	if (!target.elvraen) {
		target.elvraen = buildElvraenAPI(sock)
	}

	return target as T & { elvraen: ElvraenAPI }
}
