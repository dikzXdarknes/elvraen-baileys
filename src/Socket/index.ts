import { DEFAULT_CONNECTION_CONFIG } from '../Defaults'
import type { UserFacingSocketConfig } from '../Types'
import { makeCommunitiesSocket } from './communities'
import { attachElvraenAPI } from './elvraen-api'

const makeWASocket = (config: UserFacingSocketConfig) => {
	const newConfig = { ...DEFAULT_CONNECTION_CONFIG, ...config }
	const sock = makeCommunitiesSocket(newConfig)

	return attachElvraenAPI(sock)
}

export default makeWASocket
