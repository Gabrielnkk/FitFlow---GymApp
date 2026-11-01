import { KeepAwake } from '@capawesome/capacitor-keep-awake'

const FLAG = 'fitflow-keep-awake'

export function isKeepAwakeOn(): boolean {
  try {
    return localStorage.getItem(FLAG) !== 'off'
  } catch {
    return true
  }
}

export function setKeepAwakeOn(on: boolean): void {
  try {
    localStorage.setItem(FLAG, on ? 'on' : 'off')
  } catch {
    // sem armazenamento, sem problema
  }
}

export async function keepScreenOn(): Promise<void> {
  if (!isKeepAwakeOn()) return
  try {
    await KeepAwake.keepAwake()
  } catch {
    // sem suporte, sem problema
  }
}

export async function allowScreenSleep(): Promise<void> {
  try {
    await KeepAwake.allowSleep()
  } catch {
    // sem suporte, sem problema
  }
}