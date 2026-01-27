'use server'

import { revalidatePath } from 'next/cache'
import { RadioTrafficDAL } from '@/lib/dal/radio-traffic/radio-traffic.dal'
import {
  type RadioTrafficCreateInput,
  RadioTrafficCreateInputSchema,
  type RadioTrafficUpdateInput,
  RadioTrafficUpdateInputSchema
} from '@/lib/dal/radio-traffic/radio-traffic.dto'
import { type ActionResult, success, failure } from '@/lib/dal/types'

/**
 * Get radio traffic by ID
 */
export async function getRadioTrafficAction(
  id: string
): Promise<
  ActionResult<{
    radioTraffic: Awaited<ReturnType<RadioTrafficDAL['getRadioTraffic']>>
  }>
> {
  try {
    const dal = await RadioTrafficDAL.create()
    const radioTraffic = await dal.getRadioTraffic(id)
    return success({ radioTraffic })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * List radio traffic for an incident
 */
export async function listRadioTrafficByIncidentAction(
  incidentId: string,
  params?: { page?: number; pageSize?: number }
): Promise<
  ActionResult<Awaited<ReturnType<RadioTrafficDAL['listByIncident']>>>
> {
  try {
    const dal = await RadioTrafficDAL.create()
    const result = await dal.listByIncident(incidentId, params)
    return success(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Create new radio traffic
 */
export async function createRadioTrafficAction(
  input: RadioTrafficCreateInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = RadioTrafficCreateInputSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((e) => e.message).join(', '))
  }

  try {
    const dal = await RadioTrafficDAL.create()
    const radioTraffic = await dal.createRadioTraffic(parsed.data)
    revalidatePath(`/incidents/${parsed.data.incidentId}`)
    revalidatePath(`/incidents/${parsed.data.incidentId}/radio-traffic`)
    return success({ id: radioTraffic.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Update radio traffic (transcription/metadata)
 */
export async function updateRadioTrafficAction(
  id: string,
  input: RadioTrafficUpdateInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = RadioTrafficUpdateInputSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((e) => e.message).join(', '))
  }

  try {
    const dal = await RadioTrafficDAL.create()
    const radioTraffic = await dal.updateRadioTraffic(id, parsed.data)
    revalidatePath(`/incidents/${radioTraffic.incidentId}`)
    revalidatePath(`/radio-traffic/${id}`)
    return success({ id: radioTraffic.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Delete radio traffic
 */
export async function deleteRadioTrafficAction(
  id: string
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const dal = await RadioTrafficDAL.create()
    // Get the radio traffic first to know the incident ID for revalidation
    const radioTraffic = await dal.getRadioTraffic(id)
    if (!radioTraffic) {
      return failure('Radio traffic not found')
    }
    await dal.deleteRadioTraffic(id)
    revalidatePath(`/incidents/${radioTraffic.incidentId}`)
    return success({ deleted: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}
