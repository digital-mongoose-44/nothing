'use server'

import { revalidatePath } from 'next/cache'
import { IncidentDAL } from '@/lib/dal/incident/incident.dal'
import {
  type IncidentCreateInput,
  IncidentCreateInputSchema,
  type IncidentUpdateInput,
  IncidentUpdateInputSchema,
  type IncidentFilter
} from '@/lib/dal/incident/incident.dto'
import { type ActionResult, success, failure } from '@/lib/dal/types'

/**
 * List incidents with optional filtering
 */
export async function listIncidentsAction(params?: {
  filter?: IncidentFilter
  page?: number
  pageSize?: number
}): Promise<ActionResult<Awaited<ReturnType<IncidentDAL['listIncidents']>>>> {
  try {
    const dal = await IncidentDAL.create()
    const result = await dal.listIncidents(params)
    return success(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Get a single incident by ID
 */
export async function getIncidentAction(
  id: string
): Promise<
  ActionResult<{ incident: Awaited<ReturnType<IncidentDAL['getIncident']>> }>
> {
  try {
    const dal = await IncidentDAL.create()
    const incident = await dal.getIncident(id)
    return success({ incident })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Create a new incident
 */
export async function createIncidentAction(
  input: IncidentCreateInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = IncidentCreateInputSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((e) => e.message).join(', '))
  }

  try {
    const dal = await IncidentDAL.create()
    const incident = await dal.createIncident(parsed.data)
    revalidatePath('/incidents')
    return success({ id: incident.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Update an incident
 */
export async function updateIncidentAction(
  id: string,
  input: IncidentUpdateInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = IncidentUpdateInputSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((e) => e.message).join(', '))
  }

  try {
    const dal = await IncidentDAL.create()
    const incident = await dal.updateIncident(id, parsed.data)
    revalidatePath('/incidents')
    revalidatePath(`/incidents/${id}`)
    return success({ id: incident.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Delete an incident (admin only)
 */
export async function deleteIncidentAction(
  id: string
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const dal = await IncidentDAL.admin()
    await dal.deleteIncident(id)
    revalidatePath('/incidents')
    return success({ deleted: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Assign an incident to a user (admin/moderator only)
 */
export async function assignIncidentAction(
  id: string,
  userId: string | null
): Promise<ActionResult<{ id: string }>> {
  try {
    const dal = await IncidentDAL.create()
    const incident = await dal.assignIncident(id, userId)
    revalidatePath('/incidents')
    revalidatePath(`/incidents/${id}`)
    return success({ id: incident.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}
