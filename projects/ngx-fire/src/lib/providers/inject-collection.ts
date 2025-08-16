import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  signal,
  computed
} from '@angular/core'
import { FIRESTORE } from './provide-firestore'
import {
  addDoc,
  collection,
  deleteDoc,
  doc as fsDoc,
  DocumentData,
  onSnapshot,
  updateDoc,
  Timestamp,
  CollectionReference,
  QuerySnapshot,
  DocumentChange
} from 'firebase/firestore'

type WithId<T> = T & { id: string }

export function injectCollection<T extends DocumentData = DocumentData>(collectionPath: string) {
  assertInInjectionContext(injectCollection)

  const firestore = inject(FIRESTORE)
  const destroyRef = inject(DestroyRef)

  const items = new Map<string, WithId<T>>()

  const data = signal<WithId<T>[]>([])
  const error = signal<Error | null>(null)
  const hasError = computed(() => error() !== null)

  const collRef = collection(firestore, collectionPath) as CollectionReference<DocumentData>

  const unsubscribe = onSnapshot(
    collRef,
    (snap: QuerySnapshot<DocumentData>) => {
      snap.docChanges().forEach((change: DocumentChange<DocumentData>) => {
        const id = change.doc.id
        const raw = change.doc.data()
        const normalized = normalizeDoc(raw) as T

        if (change.type === 'added' || change.type === 'modified') {
          const existing = items.get(id)
          if (existing) {
            Object.assign(existing, normalized)
          } else {
            items.set(id, { id, ...(normalized as object) } as WithId<T>)
          }
        } else if (change.type === 'removed') {
          items.delete(id)
        }
      })

      data.set(Array.from(items.values()))
      error.set(null)
    },
    (err) => {
      error.set(err)
    }
  )

  destroyRef.onDestroy(() => unsubscribe())

  const insert = async (docData: Omit<T, 'id'>) => {
    return await addDoc(collRef, docData as unknown as DocumentData)
  }

  const update = async (id: string, partial: Partial<T>) => {
    const docRef = fsDoc(collRef, id)
    await updateDoc(docRef, partial as unknown as DocumentData)
    return docRef
  }

  const remove = async (id: string) => {
    const docRef = fsDoc(collRef, id)
    await deleteDoc(docRef)
    return docRef
  }

  return {
    data: data.asReadonly(),
    error: error.asReadonly(),
    hasError,
    insert,
    update,
    remove
  }
}

function normalizeDoc(obj: unknown): unknown {
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v instanceof Timestamp) out[k] = v.toDate()
      else if (v && typeof v === 'object' && !Array.isArray(v))
        out[k] = normalizeDoc(v)
      else out[k] = v
    }
    return out
  }
  return obj
}
