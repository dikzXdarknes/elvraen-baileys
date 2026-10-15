import { jest } from '@jest/globals'
import { proto } from '../../../WAProto/index.js'
import { attachElvraenAPI } from '../../Socket/elvraen-api'
import { generateWAMessageContent } from '../../Utils/messages'

/**
 * Menjalankan payload yang dibuat helper `sock.elvraen` melalui generator pesan Baileys yang asli.
 * Ini memastikan payload benar-benar diterima generator (bukan hanya cocok dengan mock).
 * Tes ini TIDAK membuktikan pesan terkirim atau tampil di klien WhatsApp.
 */
const setup = () => {
	const sent: any[] = []
	const sock: any = {}
	for (const name of [
		'star',
		'readMessages',
		'chatModify',
		'onWhatsApp',
		'profilePictureUrl',
		'fetchStatus',
		'fetchBlocklist',
		'updateProfileStatus',
		'updateProfileName',
		'getBusinessProfile',
		'addOrEditContact',
		'removeContact',
		'addLabel',
		'addChatLabel',
		'removeChatLabel',
		'addMessageLabel',
		'removeMessageLabel',
		'addOrEditQuickReply',
		'removeQuickReply'
	]) {
		sock[name] = jest.fn(async () => undefined)
	}

	sock.sendMessage = jest.fn(async (_jid: string, content: unknown) => {
		sent.push(content)
		return undefined
	})

	const { elvraen } = attachElvraenAPI(sock) as any
	const build = async () => generateWAMessageContent(sent[sent.length - 1], {} as any)
	return { elvraen, build }
}

const jid = '123@s.whatsapp.net'
const key = { remoteJid: jid, fromMe: true, id: 'message-1' }

describe('payload helper ELVRAEN diterima generator pesan Baileys', () => {
	it('teks, lokasi, kontak, reaksi, poll', async () => {
		const { elvraen, build } = setup()

		await elvraen.sendText(jid, 'halo')
		expect((await build()).extendedTextMessage?.text).toBe('halo')

		await elvraen.sendLocation(jid, -6.2, 106.8, 'Kantor', 'Jakarta')
		expect((await build()).locationMessage?.degreesLatitude).toBe(-6.2)

		await elvraen.sendContact(jid, 'Kontak', 'BEGIN:VCARD\nVERSION:3.0\nFN:Kontak\nEND:VCARD')
		expect((await build()).contactMessage?.displayName).toBe('Kontak')

		await elvraen.sendReaction(jid, key, '👍')
		expect((await build()).reactionMessage?.text).toBe('👍')

		await elvraen.sendPoll(jid, 'Pilih', ['A', 'B'])
		expect((await build()).pollCreationMessageV3?.name).toBe('Pilih')
	})

	it('hapus, pin, dan edit menjadi protocol/pin message', async () => {
		const { elvraen, build } = setup()

		await elvraen.sendDelete(jid, key)
		expect((await build()).protocolMessage?.type).toBe(proto.Message.ProtocolMessage.Type.REVOKE)

		await elvraen.sendPin(jid, key, proto.PinInChat.Type.PIN_FOR_ALL, 86400)
		expect((await build()).pinInChatMessage?.type).toBe(proto.PinInChat.Type.PIN_FOR_ALL)

		await elvraen.editMessage(jid, key, { text: 'diedit' })
		expect((await build()).protocolMessage?.type).toBe(proto.Message.ProtocolMessage.Type.MESSAGE_EDIT)
	})

	it('pesan interaktif dan balasannya', async () => {
		const { elvraen, build } = setup()

		const sections = [{ title: 'Menu', rows: [{ title: 'Satu', rowId: 'satu' }] }]
		await elvraen.sendList(jid, 'Judul', 'Deskripsi', 'Pilih', sections, 'Footer')
		expect((await build()).listMessage?.sections?.length).toBe(1)

		const buttons = [{ buttonId: 'ok', buttonText: { displayText: 'OK' }, type: 1 }]
		await elvraen.sendButtons(jid, 'Isi', buttons, 'Footer')
		expect((await build()).buttonsMessage?.buttons?.length).toBe(1)

		await elvraen.sendNativeFlow(jid, 'Isi', buttons)
		expect((await build()).buttonsMessage?.buttons?.[0]?.type).toBe(proto.Message.ButtonsMessage.Button.Type.NATIVE_FLOW)

		await elvraen.sendCTA(jid, 'Isi', 'cta_url', '{"display_text":"Buka","url":"https://example.test"}', 'Header')
		expect((await build()).interactiveMessage?.nativeFlowMessage?.buttons?.length).toBe(1)

		await elvraen.sendInteractive(jid, 'Isi', [{ name: 'quick_reply', buttonParamsJson: '{}' }], 'Header', 'Sub')
		expect((await build()).interactiveMessage?.body?.text).toBe('Isi')

		await elvraen.sendCarousel(jid, [{ body: { text: 'Kartu' } }])
		expect((await build()).interactiveMessage?.carouselMessage?.cards?.length).toBe(1)

		await elvraen.sendTemplate(jid, 'Isi', [{ index: 0, quickReplyButton: { displayText: 'Buka', id: 'buka' } }])
		expect((await build()).templateMessage?.hydratedFourRowTemplate?.hydratedContentText).toBe('Isi')

		await elvraen.sendButtonReply(jid, 'ok', 'OK')
		expect((await build()).buttonsResponseMessage?.selectedButtonId).toBe('ok')

		await elvraen.sendListReply(jid, 'satu', 'Satu', 'Deskripsi')
		expect((await build()).listResponseMessage?.singleSelectReply?.selectedRowId).toBe('satu')
	})
})
