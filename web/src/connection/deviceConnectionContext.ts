/*
 * Zweck: Typen, Context und Hook der Verbindung zum Pad (Issue #11).
 * Inhalt: ConnectionState, der Context und useDeviceConnection. Liegt getrennt vom Provider, damit die Datei mit
 *         der Komponente nur Komponenten exportiert (Fast Refresh).
 */
import { createContext, useContext } from 'react'
import type { DeviceInfo, ProtocolClient } from '../protocol/client.ts'

export type ConnectionState =
  | { status: 'unsupported' }
  /** `notice` explains why an existing connection ended, e.g. the pad was unplugged. */
  | { status: 'disconnected'; notice?: string }
  | { status: 'connecting' }
  | { status: 'connected'; info: DeviceInfo }
  | { status: 'error'; message: string }

export interface DeviceConnection {
  state: ConnectionState
  /** Only set while connected. */
  client: ProtocolClient | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

export const DeviceConnectionContext = createContext<DeviceConnection | null>(null)

export function useDeviceConnection(): DeviceConnection {
  const value = useContext(DeviceConnectionContext)
  if (value === null) throw new Error('useDeviceConnection needs a DeviceConnectionProvider.')
  return value
}
