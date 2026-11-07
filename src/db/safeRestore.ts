// made by: Gabriel Mattos
import { buildBackup, restoreBackup, type RestoreResult } from './backup'
import { buildExtras, restoreExtras, type Extras } from './extras'

export type SafeRestoreOutcome =
  | { ok: true; result: RestoreResult; foodCount: number | null }
  // rolledBack = true: deu erro, mas seus dados de antes foram devolvidos.
  // rolledBack = false: deu erro e nem a devolução funcionou; safetyCopy é a cópia de segurança em texto.
  | { ok: false; error: string; rolledBack: boolean; safetyCopy?: string }

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'erro desconhecido'
}

/**
 * Importa o backup com rede de segurança:
 * 1) guarda uma cópia temporária dos dados atuais (na memória);
 * 2) grava o backup; 3) se algo falhar, devolve a cópia e cancela a importação.
 */
export async function safeRestore(
  backup: Parameters<typeof restoreBackup>[0],
  extras: Extras | null,
): Promise<SafeRestoreOutcome> {
  let snapshot: { backup: Awaited<ReturnType<typeof buildBackup>>; extras: Extras }
  try {
    snapshot = { backup: await buildBackup(), extras: await buildExtras() }
  } catch (err) {
    // sem cópia de segurança não arriscamos mexer nos dados
    return {
      ok: false,
      error: `Não foi possível preparar a cópia de segurança (${messageOf(err)}). Nada foi alterado.`,
      rolledBack: true,
    }
  }

  try {
    const result = await restoreBackup(backup)
    const foodCount = extras ? await restoreExtras(extras) : null
    return { ok: true, result, foodCount }
  } catch (err) {
    try {
      await restoreBackup(snapshot.backup)
      // A dieta é gravada "tudo ou nada", então se ela falhou continua intacta.
      // Aqui só devolvemos os ajustes pequenos (dias, meta, personagem); se falhar, não é grave.
      await restoreExtras(snapshot.extras).catch(() => 0)
      return {
        ok: false,
        error: `A importação falhou (${messageOf(err)}). Seus dados de antes foram mantidos.`,
        rolledBack: true,
      }
    } catch (rollbackErr) {
      return {
        ok: false,
        error: `A importação falhou (${messageOf(err)}) e não consegui devolver seus dados (${messageOf(rollbackErr)}).`,
        rolledBack: false,
        safetyCopy: JSON.stringify(Object.assign({}, snapshot.backup, { extras: snapshot.extras }), null, 2),
      }
    }
  }
}
