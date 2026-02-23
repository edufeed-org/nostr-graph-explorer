import { getDB } from './schema'

export interface Annotation {
  id: string
  targetEventId: string
  content: string
  createdAt: number
  tags: string[]
}

/**
 * Create a new annotation for an event
 */
export async function createAnnotation(
  targetEventId: string,
  content: string,
  tags: string[] = [],
): Promise<Annotation> {
  const annotation: Annotation = {
    id: crypto.randomUUID(),
    targetEventId,
    content,
    createdAt: Date.now(),
    tags,
  }

  const db = await getDB()
  await db.put('annotations', annotation)

  return annotation
}

/**
 * Get all annotations for a specific event
 */
export async function getAnnotationsForEvent(
  eventId: string,
): Promise<Annotation[]> {
  const db = await getDB()
  return db.getAllFromIndex('annotations', 'by-target', eventId)
}

/**
 * Get a single annotation by ID
 */
export async function getAnnotation(
  annotationId: string,
): Promise<Annotation | undefined> {
  const db = await getDB()
  return db.get('annotations', annotationId)
}

/**
 * Update an annotation
 */
export async function updateAnnotation(
  annotationId: string,
  content: string,
  tags?: string[],
): Promise<void> {
  const db = await getDB()
  const annotation = await db.get('annotations', annotationId)

  if (!annotation) {
    throw new Error(`Annotation ${annotationId} not found`)
  }

  annotation.content = content
  if (tags !== undefined) {
    annotation.tags = tags
  }

  await db.put('annotations', annotation)
}

/**
 * Delete an annotation
 */
export async function deleteAnnotation(annotationId: string): Promise<void> {
  const db = await getDB()
  await db.delete('annotations', annotationId)
}

/**
 * Get all annotations
 */
export async function getAllAnnotations(): Promise<Annotation[]> {
  const db = await getDB()
  return db.getAll('annotations')
}

/**
 * Search annotations by content
 */
export async function searchAnnotations(query: string): Promise<Annotation[]> {
  const annotations = await getAllAnnotations()
  const lowerQuery = query.toLowerCase()

  return annotations.filter(
    (annotation) =>
      annotation.content.toLowerCase().includes(lowerQuery) ||
      annotation.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  )
}
