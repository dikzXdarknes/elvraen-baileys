import { jest } from '@jest/globals'
import { readFileSync } from 'fs'
import { join } from 'path'
import { proto } from '../../../WAProto/index.js'
import { attachElvraenAPI } from '../../Socket/elvraen-api'

const makeSocket = () => ({
  sendMessage: jest.fn(async (..._args: any[]): Promise<any> => ({ key: { id: 'sent' } })),
  star: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  readMessages: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  chatModify: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  onWhatsApp: jest.fn(async (..._args: any[]): Promise<any> => ([{ jid: '123@s.whatsapp.net', exists: true }])),
  profilePictureUrl: jest.fn(async (..._args: any[]): Promise<any> => ('https://example.test/picture.jpg')),
  fetchStatus: jest.fn(async (..._args: any[]): Promise<any> => ([])),
  fetchBlocklist: jest.fn(async (..._args: any[]): Promise<any> => ([])),
  updateProfileStatus: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  updateProfileName: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  getBusinessProfile: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  addOrEditContact: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  removeContact: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  addLabel: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  addChatLabel: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  removeChatLabel: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  addMessageLabel: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  removeMessageLabel: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  addOrEditQuickReply: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
  removeQuickReply: jest.fn(async (..._args: any[]): Promise<any> => (undefined)),
})

describe('attachElvraenAPI', () => {
  it('attaches the API without replacing the original socket', () => {
    const sock = makeSocket()
    const result = attachElvraenAPI(sock as never) as typeof sock & { elvraen: Record<string, (...args: any[]) => Promise<unknown>> }

    expect(result).toBe(sock)
    expect(result.elvraen).toBeDefined()
  })

  it('forwards account, profile, contact, label, and quick-reply operations', async () => {
    const sock = makeSocket()
    const { elvraen } = attachElvraenAPI(sock as never) as typeof sock & { elvraen: any }
    const contact = { fullName: 'Example Contact' } as any
    const labels = { id: 'label-1', name: 'Support' } as any
    const quickReply = { shortcut: '/hello', message: 'Hello!' } as any

    await elvraen.checkWhatsApp('123', '456')
    expect(sock.onWhatsApp).toHaveBeenCalledWith('123', '456')

    await elvraen.getProfilePicture('123@s.whatsapp.net')
    expect(sock.profilePictureUrl).toHaveBeenLastCalledWith('123@s.whatsapp.net', 'preview', undefined)
    await elvraen.getProfilePicture('123@s.whatsapp.net', 'image', 5000)
    expect(sock.profilePictureUrl).toHaveBeenLastCalledWith('123@s.whatsapp.net', 'image', 5000)

    await elvraen.getStatus('123@s.whatsapp.net')
    expect(sock.fetchStatus).toHaveBeenCalledWith('123@s.whatsapp.net')
    await elvraen.getBlocklist()
    expect(sock.fetchBlocklist).toHaveBeenCalledTimes(1)
    await elvraen.updateProfileStatus('Available')
    expect(sock.updateProfileStatus).toHaveBeenCalledWith('Available')
    await elvraen.updateProfileName('ELVRAEN')
    expect(sock.updateProfileName).toHaveBeenCalledWith('ELVRAEN')
    await elvraen.getBusinessProfile('123@s.whatsapp.net')
    expect(sock.getBusinessProfile).toHaveBeenCalledWith('123@s.whatsapp.net')
    await elvraen.addOrEditContact('123@s.whatsapp.net', contact)
    expect(sock.addOrEditContact).toHaveBeenCalledWith('123@s.whatsapp.net', contact)
    await elvraen.removeContact('123@s.whatsapp.net')
    expect(sock.removeContact).toHaveBeenCalledWith('123@s.whatsapp.net')
    await elvraen.addLabel('123@s.whatsapp.net', labels)
    expect(sock.addLabel).toHaveBeenCalledWith('123@s.whatsapp.net', labels)
    await elvraen.addChatLabel('123@s.whatsapp.net', 'label-1')
    expect(sock.addChatLabel).toHaveBeenCalledWith('123@s.whatsapp.net', 'label-1')
    await elvraen.removeChatLabel('123@s.whatsapp.net', 'label-1')
    expect(sock.removeChatLabel).toHaveBeenCalledWith('123@s.whatsapp.net', 'label-1')
    await elvraen.addMessageLabel('123@s.whatsapp.net', 'message-1', 'label-1')
    expect(sock.addMessageLabel).toHaveBeenCalledWith('123@s.whatsapp.net', 'message-1', 'label-1')
    await elvraen.removeMessageLabel('123@s.whatsapp.net', 'message-1', 'label-1')
    expect(sock.removeMessageLabel).toHaveBeenCalledWith('123@s.whatsapp.net', 'message-1', 'label-1')
    await elvraen.addOrEditQuickReply(quickReply)
    expect(sock.addOrEditQuickReply).toHaveBeenCalledWith(quickReply)
    await elvraen.removeQuickReply('1700000000')
    expect(sock.removeQuickReply).toHaveBeenCalledWith('1700000000')
  })

  it('builds common outgoing message payloads and preserves options', async () => {
    const sock = makeSocket()
    const { elvraen } = attachElvraenAPI(sock as never) as typeof sock & { elvraen: any }
    const jid = '123@s.whatsapp.net'
    const options = { ephemeralExpiration: 60 } as any
    const key = { remoteJid: jid, fromMe: true, id: 'message-1' } as any
    const message = { key, message: { conversation: 'original' } } as any
    const image = Buffer.from('image')
    const audio = Buffer.from('audio')
    const video = Buffer.from('video')
    const document = Buffer.from('document')
    const sticker = Buffer.from('sticker')

    await elvraen.sendText(jid, 'hello', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { text: 'hello' }, options)

    await elvraen.sendAudio(jid, audio)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { audio, ptt: false }, {})
    await elvraen.sendAudio(jid, audio, true, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { audio, ptt: true }, options)
    await elvraen.sendVoice(jid, audio, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { audio, ptt: true }, options)
    await elvraen.sendVideo(jid, video, 'caption', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { video, caption: 'caption' }, options)
    await elvraen.sendVideoNote(jid, video, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { video, ptv: true }, options)
    await elvraen.sendDocument(jid, document, 'application/pdf', 'file.pdf', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { document, mimetype: 'application/pdf', fileName: 'file.pdf' }, options)
    await elvraen.sendDocument(jid, document, 'application/pdf')
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { document, mimetype: 'application/pdf' }, {})
    await elvraen.sendImage(jid, image, 'photo', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { image, caption: 'photo' }, options)
    await elvraen.sendSticker(jid, sticker, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { sticker }, options)

    await elvraen.sendLocation(jid, -6.2, 106.8, 'Office', 'Jakarta', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, {
      location: { degreesLatitude: -6.2, degreesLongitude: 106.8, name: 'Office', address: 'Jakarta' },
    }, options)
    await elvraen.sendLocation(jid, 1, 2)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, {
      location: { degreesLatitude: 1, degreesLongitude: 2 },
    }, {})

    const sections = [{ title: 'Section', rows: [{ title: 'Row', rowId: 'row-1' }] }] as any
    await elvraen.sendList(jid, 'Title', 'Description', 'Choose', sections, 'Footer', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, {
      list: { title: 'Title', description: 'Description', buttonText: 'Choose', listType: proto.Message.ListMessage.ListType.SINGLE_SELECT, sections, footerText: 'Footer' },
    }, options)

    const buttons = [{ buttonId: 'ok', buttonText: { displayText: 'OK' }, type: 1 }] as any
    await elvraen.sendButtons(jid, 'Body', buttons, 'Footer', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, {
      buttons: { contentText: 'Body', footerText: 'Footer', headerType: proto.Message.ButtonsMessage.HeaderType.TEXT, buttons },
    }, options)

    await elvraen.sendCTA(jid, 'Body', 'cta_url', '{"url":"https://example.test"}', 'Header', 'Footer', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, {
      interactiveMessage: {
        body: { text: 'Body' }, header: { title: 'Header' }, footer: { text: 'Footer' },
        nativeFlowMessage: { buttons: [{ name: 'cta_url', buttonParamsJson: '{"url":"https://example.test"}' }] },
      },
    }, options)

    const cards = [{ body: { text: 'Card' } }] as any
    await elvraen.sendCarousel(jid, cards, 2, proto.Message.InteractiveMessage.CarouselMessage.CarouselCardType.HSCROLL_CARDS, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, {
      interactiveMessage: { carouselMessage: { cards, messageVersion: 2, carouselCardType: proto.Message.InteractiveMessage.CarouselMessage.CarouselCardType.HSCROLL_CARDS } },
    }, options)

    const templateButtons = [{ index: 0, quickReplyButton: { displayText: 'Open', id: 'open' } }] as any
    await elvraen.sendTemplate(jid, 'Body', templateButtons, 'Footer', 'Title', 'template-1', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, {
      templateMessage: { hydratedFourRowTemplate: { hydratedContentText: 'Body', hydratedFooterText: 'Footer', hydratedTitleText: 'Title', templateId: 'template-1', hydratedButtons: templateButtons } },
    }, options)

    const interactiveButtons = [{ name: 'quick_reply', buttonParamsJson: '{}' }] as any
    await elvraen.sendInteractive(jid, 'Body', interactiveButtons, 'Header', 'Subtitle', 'Footer', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, {
      interactiveMessage: { body: { text: 'Body' }, header: { title: 'Header', subtitle: 'Subtitle' }, footer: { text: 'Footer' }, nativeFlowMessage: { buttons: interactiveButtons } },
    }, options)

    await elvraen.sendNativeFlow(jid, 'Body', buttons, 'Footer', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, {
      buttons: { contentText: 'Body', footerText: 'Footer', headerType: proto.Message.ButtonsMessage.HeaderType.TEXT, buttons: buttons.map((button: any) => ({ ...button, type: proto.Message.ButtonsMessage.Button.Type.NATIVE_FLOW })) },
    }, options)

    await elvraen.sendButtonReply(jid, 'button-1', 'Accept', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { buttonReply: { id: 'button-1', displayText: 'Accept', index: 0 }, type: 'plain' }, options)
    await elvraen.sendListReply(jid, 'row-1', 'Selected', 'Details', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { listReply: { title: 'Selected', description: 'Details', singleSelectReply: { selectedRowId: 'row-1' } } }, options)
    await elvraen.sendListReply(jid, 'row-2', 'Selected without description')
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { listReply: { title: 'Selected without description', singleSelectReply: { selectedRowId: 'row-2' } } }, {})
    await elvraen.sendContact(jid, 'Test Contact', 'BEGIN:VCARD\nEND:VCARD', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { contacts: { displayName: 'Test Contact', contacts: [{ vcard: 'BEGIN:VCARD\nEND:VCARD' }] } }, options)
    await elvraen.sendReaction(jid, key, '👍', options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { react: { text: '👍', key } }, options)
    await elvraen.sendPoll(jid, 'Poll', ['A', 'B'])
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { poll: { name: 'Poll', values: ['A', 'B'], selectableCount: 1 } }, {})
    await elvraen.sendPoll(jid, 'Poll', ['A', 'B'], 2, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { poll: { name: 'Poll', values: ['A', 'B'], selectableCount: 2 } }, options)
    await elvraen.sendPin(jid, key, 0, 604800, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { pin: key, type: 0, time: 604800 }, options)
    await elvraen.sendDelete(jid, key, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { delete: key }, options)
    await elvraen.sendForward(jid, message, true, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { forward: message, force: true }, options)
    await elvraen.sendReply(jid, 'reply', message, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { text: 'reply' }, { ...options, quoted: message })
    await elvraen.editMessage(jid, key, { text: 'edited' }, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith(jid, { text: 'edited', edit: key }, options)
    await elvraen.sendStatus({ text: 'status' }, options)
    expect(sock.sendMessage).toHaveBeenLastCalledWith('status@broadcast', { text: 'status' }, options)
  })

  it('forwards chat state and message utility operations', async () => {
    const sock = makeSocket()
    const { elvraen } = attachElvraenAPI(sock as never) as typeof sock & { elvraen: any }
    const jid = '123@s.whatsapp.net'
    const lastMessages = [{ key: { remoteJid: jid, id: 'last-message' } }] as any
    const key = { id: 'message-1', fromMe: true }
    const keys = [{ remoteJid: jid, id: 'message-1' }] as any

    await elvraen.readMessages(keys)
    expect(sock.readMessages).toHaveBeenCalledWith(keys)
    await elvraen.archiveChat(jid, lastMessages)
    expect(sock.chatModify).toHaveBeenLastCalledWith({ archive: true, lastMessages }, jid)
    await elvraen.unarchiveChat(jid, lastMessages)
    expect(sock.chatModify).toHaveBeenLastCalledWith({ archive: false, lastMessages }, jid)
    await elvraen.markChatUnread(jid, lastMessages)
    expect(sock.chatModify).toHaveBeenLastCalledWith({ markRead: false, lastMessages }, jid)
    await elvraen.starMessage(jid, key)
    expect(sock.star).toHaveBeenLastCalledWith(jid, [key], true)
    await elvraen.unstarMessage(jid, key)
    expect(sock.star).toHaveBeenLastCalledWith(jid, [key], false)
  })

  it('returns the underlying method results and propagates rejected operations', async () => {
    const sock = makeSocket()
    const result = { ok: true }
    sock.onWhatsApp.mockResolvedValueOnce(result as any)
    const { elvraen } = attachElvraenAPI(sock as never) as typeof sock & { elvraen: any }

    await expect(elvraen.checkWhatsApp('123')).resolves.toBe(result)
    const error = new Error('socket operation failed')
    sock.fetchBlocklist.mockRejectedValueOnce(error)
    await expect(elvraen.getBlocklist()).rejects.toBe(error)
  })

  it('does not rebuild the namespace when attached more than once', () => {
    const sock = makeSocket()
    attachElvraenAPI(sock as never)
    const first = (sock as any).elvraen
    attachElvraenAPI(sock as never)
    expect((sock as any).elvraen).toBe(first)
  })

  it('exposes exactly the methods documented in docs/ELVRAEN-API.md', () => {
    const sock = makeSocket()
    const { elvraen } = attachElvraenAPI(sock as never) as typeof sock & { elvraen: Record<string, unknown> }
    const doc = readFileSync(join(process.cwd(), 'docs', 'ELVRAEN-API.md'), 'utf8')

    const documented = new Set<string>()
    for (const row of doc.split('\n').filter((line: string) => line.startsWith('| `'))) {
      for (const match of (row.split('|')[1] ?? '').matchAll(/`(\w+)\(/g)) {
        documented.add(match[1]!)
      }
    }

    expect(documented.size).toBeGreaterThan(0)
    expect(Object.keys(elvraen).sort()).toEqual([...documented].sort())
    for (const name of documented) {
      expect(typeof elvraen[name]).toBe('function')
    }
  })
})
