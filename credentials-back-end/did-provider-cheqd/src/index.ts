/**
 * @public
 */
const schema = require('../plugin.schema.json')
export { schema }
export { CheqdDIDProvider } from './did-manager/cheqd-did-provider'
export { CheqdDidResolver, getResolver } from './did-manager/cheqd-did-resolver'
export { CheqdResolver } from './did-manager/resolver'
export * from './types/IMyAgentPlugin'
