# ELVRAEN Convenience API

`makeWASocket()` attaches an `elvraen` namespace to the returned socket. The
original socket APIs remain available. The namespace type is exported as `ElvraenAPI`,
and `attachElvraenAPI()` is idempotent (calling it twice keeps the existing namespace). These helpers forward to the underlying
socket methods and propagate their return values and errors.

## Quick start

```ts
import makeWASocket, { useMultiFileAuthState } from 'elvraen-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({ auth: state })
sock.ev.on('creds.update', saveCreds)

await sock.elvraen.sendText('1234567890@s.whatsapp.net', 'Hello from ELVRAEN')
await sock.elvraen.sendVoice('1234567890@s.whatsapp.net', audioBuffer)
```

Pass a valid WhatsApp JID to recipient-oriented methods and media in a format
accepted by Baileys. `sendVoice()` uses the voice-note flag; `sendVideoNote()`
uses the video-note flag. The helpers do not bypass WhatsApp rules or recipient
privacy settings.

## Account, profile and contact

| Method | Purpose |
| --- | --- |
| `checkWhatsApp(...phoneNumbers)` | Check numbers through `sock.onWhatsApp()`. |
| `getProfilePicture(jid, type = 'preview', timeoutMs?)` | Get profile-picture URL; `type` is `preview` or `image`. |
| `getStatus(...jids)` | Forward to `sock.fetchStatus()`. |
| `getBlocklist()` | Fetch blocklist. |
| `updateProfileStatus(status)` | Update account status text. |
| `updateProfileName(name)` | Update profile name. |
| `getBusinessProfile(jid)` | Fetch business profile. |
| `addOrEditContact(jid, contact)` | Add/edit a contact action. |
| `removeContact(jid)` | Remove contact. |

## Labels and quick replies

| Method | Purpose |
| --- | --- |
| `addLabel(jid, labels)` | Add labels. |
| `addChatLabel(jid, labelId)` / `removeChatLabel(jid, labelId)` | Add/remove a chat label. |
| `addMessageLabel(jid, messageId, labelId)` / `removeMessageLabel(jid, messageId, labelId)` | Add/remove a message label. |
| `addOrEditQuickReply(quickReply)` | Add or edit a quick reply. |
| `removeQuickReply(timestamp)` | Remove quick reply by timestamp. |

## Media and ordinary messages

| Method | Purpose |
| --- | --- |
| `sendText(jid, text, options?)` | Send text. |
| `sendImage(jid, image, caption?, options?)` | Send image and optional caption. |
| `sendAudio(jid, audio, ptt = false, options?)` | Send audio; set `ptt` to `true` for voice-note format. |
| `sendVoice(jid, audio, options?)` | Send audio explicitly with `ptt: true`. |
| `sendVideo(jid, video, caption?, options?)` | Send video and optional caption. |
| `sendVideoNote(jid, video, options?)` | Send video with `ptv: true` for video-note format. |
| `sendDocument(jid, document, mimetype, fileName?, options?)` | Send document. |
| `sendSticker(jid, sticker, options?)` | Send sticker. |
| `sendLocation(jid, latitude, longitude, name?, address?, options?)` | Send location. |
| `sendContact(jid, displayName, vcard, options?)` | Send vCard contact. |
| `sendReaction(jid, key, text, options?)` | React to a message. |
| `sendPoll(jid, name, values, selectableCount = 1, options?)` | Send poll. |
| `sendPin(jid, key, type, time?, options?)` | Send a pin-in-chat action. |
| `sendDelete(jid, key, options?)` | Request message deletion. |
| `sendForward(jid, message, force = false, options?)` | Forward message. |
| `sendReply(jid, text, quoted, options?)` | Send quoted text reply. |
| `editMessage(jid, key, content, options?)` | Send message-edit operation. |
| `sendStatus(content, options?)` | Send to `status@broadcast`. |

## Interactive messages and replies

| Method | Purpose |
| --- | --- |
| `sendList(jid, title, description, buttonText, sections, footerText?, options?)` | Build a list message. |
| `sendButtons(jid, contentText, buttons, footerText?, options?)` | Build a button message. |
| `sendCTA(jid, bodyText, buttonName, buttonParamsJson, headerTitle?, footerText?, options?)` | Build a native-flow CTA. |
| `sendCarousel(jid, cards, messageVersion = 1, carouselCardType?, options?)` | Build a carousel message. |
| `sendTemplate(jid, contentText, buttons, footerText?, titleText?, templateId?, options?)` | Build a hydrated template. |
| `sendInteractive(jid, bodyText, buttons, headerTitle?, headerSubtitle?, footerText?, options?)` | Build a native-flow interactive message. |
| `sendNativeFlow(jid, contentText, buttons, footerText?, options?)` | Mark supplied buttons as native-flow buttons. |
| `sendButtonReply(jid, buttonId, displayText, options?)` | Build a button-reply payload. |
| `sendListReply(jid, rowId, displayText, description?, options?)` | Build a list-reply payload. |

## Chat and read state

| Method | Purpose |
| --- | --- |
| `readMessages(keys)` | Mark messages read. |
| `archiveChat(jid, lastMessages)` / `unarchiveChat(jid, lastMessages)` | Archive/unarchive a chat. |
| `markChatUnread(jid, lastMessages)` | Mark chat unread. |
| `starMessage(jid, key)` / `unstarMessage(jid, key)` | Star/unstar a message. |

Interactive, template, list, carousel, status, and note formats depend on the
current WhatsApp Web protocol and client support. A passing unit test validates
payload construction and forwarding, not delivery/rendering on every client.
