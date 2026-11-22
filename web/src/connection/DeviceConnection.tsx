/*
 * Zweck: Verbindung der Web-App zum Pad als Zustand für die Oberfläche (Issue #11).
 * Inhalt: DeviceConnectionProvider. Der Zustand (siehe deviceConnectionContext.ts) wird durch Verbinden, Trennen
 *         und Abziehen des Pads gesteuert. Beim Verbinden öffnet der Provider den Port, legt Transport und
 *         ProtocolClient an und fragt device.info ab, damit nur ein passendes Gerät als verbunden gilt. Die serielle
 *         Schnittstelle ist austauschbar (Tests).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ProtocolClient, ProtocolError } from '../protocol/client.ts'
import { getSerial, SerialTransport, type SerialLike } from '../protocol/serialTransport.ts'
import { DeviceConnectionContext, type ConnectionState } from './deviceConnectionContext.ts'

function describeFailure(error: unknown): string {
  if (error instanceof ProtocolError) {
    if (error.code === 'TIMEOUT' || error.code === 'INVALID_RESPONSE') {
      return 'Das gewählte Gerät antwortet nicht wie ein Makropad. Bitte das richtige Gerät auswählen.'
    }
    if (error.code === 'UNSUPPORTED_VERSION') return 'Das Pad spricht eine andere Protokollversion als die App.'
    return error.message
  }
  return 'Der Port lässt sich nicht öffnen. Wird er von einem anderen Programm benutzt?'
}

interface ProviderProps {
  children: ReactNode
  /** The serial interface to use. Defaults to `navigator.serial`, tests pass a simulated one. */
  serial?: SerialLike
  /** Time to wait for the pad's answer when connecting. Defaults to the client's default. */
  timeoutMs?: number
}

/** Owns the serial connection to the pad and offers it to the app through `useDeviceConnection`. */
export function DeviceConnectionProvider({ children, serial = getSerial(), timeoutMs }: ProviderProps) {
  const [state, setState] = useState<ConnectionState>(serial === undefined ? { status: 'unsupported' } : { status: 'disconnected' })
  const [client, setClient] = useState<ProtocolClient | null>(null)
  const transport = useRef<SerialTransport | null>(null)

  const release = useCallback(async () => {
    const current = transport.current
    transport.current = null
    setClient(null)
    await current?.close()
  }, [])

  const connect = useCallback(async () => {
    if (serial === undefined || state.status === 'connecting' || state.status === 'connected') return

    let port
    try {
      port = await serial.requestPort()
    } catch {
      return // the user closed the port dialog, nothing to report
    }

    setState({ status: 'connecting' })
    let opened: SerialTransport | null = null
    try {
      opened = await SerialTransport.open(port)
      const next = new ProtocolClient(opened, { timeoutMs })
      const info = await next.deviceInfo()
      transport.current = opened
      opened.onClose(() => {
        // Ignore the close we triggered ourselves: it already replaced the state.
        if (transport.current !== opened) return
        transport.current = null
        setClient(null)
        setState({ status: 'disconnected', notice: 'Die Verbindung zum Pad wurde getrennt.' })
      })
      setClient(next)
      setState({ status: 'connected', info })
    } catch (error) {
      await opened?.close()
      setState({ status: 'error', message: describeFailure(error) })
    }
  }, [serial, timeoutMs, state.status])

  const disconnect = useCallback(async () => {
    await release()
    setState({ status: 'disconnected' })
  }, [release])

  // Free the port when the app goes away
  useEffect(() => () => void transport.current?.close(), [])

  const value = useMemo(() => ({ state, client, connect, disconnect }), [state, client, connect, disconnect])
  return <DeviceConnectionContext.Provider value={value}>{children}</DeviceConnectionContext.Provider>
}
