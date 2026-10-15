/**
 * Starter bot ELVRAEN.
 *
 * Jalankan:  yarn start   (atau: yarn example:elvraen-bot)
 *
 * Variabel lingkungan (semua opsional):
 *   ELVRAEN_PHONE     nomor WhatsApp dengan kode negara, angka saja (mis. 62812xxxxxxx).
 *                     Jika kosong dan sesi belum ada, nomor ditanyakan di terminal.
 *   ELVRAEN_AUTH_DIR  folder sesi (bawaan: ./elvraen_auth). JANGAN di-commit / dibagikan.
 *   ELVRAEN_PREFIX    awalan perintah (bawaan: .)
 *   LOG_LEVEL         debug | info | warn | error (bawaan: info)
 */
import { Boom } from '@hapi/boom'
import P from 'pino'
import readline from 'readline'
import makeWASocket, {
	DisconnectReason,
	fetchLatestBaileysVersion,
	isJidBroadcast,
	isJidNewsletter,
	makeCacheableSignalKeyStore,
	normalizeMessageContent,
	useMultiFileAuthState,
	type WAMessage
} from '../src'

const logger = P({ level: process.env.LOG_LEVEL ?? 'info' })
const authDir = process.env.ELVRAEN_AUTH_DIR ?? './elvraen_auth'
const prefix = process.env.ELVRAEN_PREFIX ?? '.'

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

const ask = (question: string) => {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
	return new Promise<string>(resolve => {
		rl.question(question, answer => {
			rl.close()
			resolve(answer.trim())
		})
	})
}

/** Rapikan nomor: buang non-angka, ubah awalan 08 menjadi 628. Mengembalikan undefined jika tidak masuk akal. */
const normalizePhone = (raw: string): string | undefined => {
	let digits = raw.replace(/\D/g, '')
	if (digits.startsWith('08')) {
		digits = `62${digits.slice(1)}`
		logger.info(`Nomor diawali 08 diubah ke format internasional: ${digits}`)
	}

	return digits.length >= 8 && digits.length <= 15 && !digits.startsWith('0') ? digits : undefined
}

const getText = (message: WAMessage): string | undefined => {
	// normalizeMessageContent membuka pembungkus ephemeral / view-once / edited
	const content = normalizeMessageContent(message.message)
	return (
		content?.conversation ??
		content?.extendedTextMessage?.text ??
		content?.imageMessage?.caption ??
		content?.videoMessage?.caption ??
		content?.documentMessage?.caption ??
		undefined
	)
}

type Sock = ReturnType<typeof makeWASocket>

const handleCommand = async (sock: Sock, message: WAMessage, jid: string, body: string) => {
	const command = body.slice(prefix.length).split(/\s+/)[0]?.toLowerCase()
	switch (command) {
		case 'ping':
			await sock.elvraen.sendReply(jid, 'Pong! ELVRAEN Baileys aktif.', message)
			break
		case 'menu':
			await sock.elvraen.sendReply(
				jid,
				[
					'*ELVRAEN Baileys Starter*',
					`${prefix}ping — tes koneksi bot`,
					`${prefix}id — lihat ID chat`,
					`${prefix}menu — tampilkan menu`
				].join('\n'),
				message
			)
			break
		case 'id':
			await sock.elvraen.sendReply(jid, `Chat ID: ${jid}`, message)
			break
		default:
			break
	}
}

type SessionResult = 'stop' | 'reconnect'

/** Satu siklus koneksi. Mengembalikan apa yang harus dilakukan setelah koneksi berakhir. */
const runSession = async (
	getStopRequested: () => boolean,
	registerStop: (stop: () => void) => void,
	onOpen: () => void
): Promise<SessionResult> => {
	const { state, saveCreds } = await useMultiFileAuthState(authDir)

	let phoneNumber: string | undefined
	if (!state.creds.registered) {
		const raw = process.env.ELVRAEN_PHONE ?? (await ask('Nomor WhatsApp (kode negara, angka saja; contoh 62812...): '))
		phoneNumber = normalizePhone(raw)
		if (!phoneNumber) {
			logger.error('Nomor tidak valid. Gunakan kode negara tanpa +, contoh 62812xxxxxxx. Jalankan ulang bot.')
			return 'stop'
		}
	}

	const { version } = await fetchLatestBaileysVersion()
	const sock = makeWASocket({
		version,
		logger,
		auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) }
	})

	registerStop(() => void sock.end(undefined))
	sock.ev.on('creds.update', saveCreds)

	sock.ev.on('messages.upsert', async ({ messages, type }) => {
		if (type !== 'notify') return

		for (const message of messages) {
			const jid = message.key.remoteJid
			if (!jid || !message.message || message.key.fromMe) continue
			if (isJidBroadcast(jid) || isJidNewsletter(jid)) continue

			const body = getText(message)?.trim()
			if (!body?.startsWith(prefix)) continue

			try {
				await handleCommand(sock, message, jid, body)
			} catch (error) {
				logger.error({ err: error, jid }, 'Gagal memproses perintah')
			}
		}
	})

	return new Promise<SessionResult>(resolve => {
		let pairingRequested = false

		sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
			// Event `qr` datang setelah handshake selesai; saat itulah kode pairing boleh diminta.
			if (qr && phoneNumber && !pairingRequested) {
				pairingRequested = true
				try {
					const code = await sock.requestPairingCode(phoneNumber)
					console.log(`\nKode pairing: ${code}`)
					console.log('Buka WhatsApp > Perangkat tertaut > Tautkan perangkat > Tautkan dengan nomor telepon.\n')
				} catch (error) {
					logger.error({ err: error }, 'Gagal meminta kode pairing')
					void sock.end(error instanceof Error ? error : new Error('Gagal meminta kode pairing'))
				}
			}

			if (connection === 'open') {
				onOpen()
				logger.info('ELVRAEN Baileys tersambung ke WhatsApp')
			}

			if (connection === 'close') {
				const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode
				if (getStopRequested()) return resolve('stop')

				if (statusCode === DisconnectReason.loggedOut) {
					logger.error(
						`Sesi logout dari WhatsApp. Untuk menautkan ulang, hapus folder ${authDir} secara manual lalu jalankan lagi.`
					)
					return resolve('stop')
				}

				if (statusCode === DisconnectReason.forbidden || statusCode === DisconnectReason.multideviceMismatch) {
					logger.error({ statusCode }, 'Koneksi ditolak WhatsApp; bot dihentikan.')
					return resolve('stop')
				}

				logger.warn({ statusCode }, 'Koneksi terputus')
				resolve('reconnect')
			}
		})
	})
}

async function runBot() {
	let stopRequested = false
	let stopCurrent: (() => void) | undefined
	let failures = 0

	const shutdown = () => {
		if (stopRequested) return
		stopRequested = true
		logger.info('Menghentikan bot...')
		stopCurrent?.()
	}

	process.once('SIGINT', shutdown)
	process.once('SIGTERM', shutdown)

	while (!stopRequested) {
		const result = await runSession(
			() => stopRequested,
			stop => (stopCurrent = stop),
			() => (failures = 0)
		)
		if (result === 'stop' || stopRequested) return

		// Reconnect dengan jeda bertahap (2s, 4s, ... maks 30s). Setelah pairing, WhatsApp memang
		// memutus koneksi sekali (restartRequired); itu normal dan akan tersambung ulang otomatis.
		failures += 1
		const delay = Math.min(2000 * 2 ** Math.min(failures - 1, 4), 30_000)
		logger.info(`Menyambung ulang dalam ${delay / 1000} detik...`)
		await sleep(delay)
	}
}

runBot().catch(error => {
	logger.fatal({ err: error }, 'Starter bot berhenti karena terjadi error')
	process.exitCode = 1
})
