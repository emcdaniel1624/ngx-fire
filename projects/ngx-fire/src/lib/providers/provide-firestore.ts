import { Provider } from '@angular/core'
import { InjectionToken } from '@angular/core'
import { initializeApp, FirebaseOptions } from 'firebase/app'
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore'

export const FIRESTORE = new InjectionToken<Firestore>('Firestore')

export interface FirestoreConfig {
  firebaseConfig: FirebaseOptions
  useEmulator?: boolean | {
    host?: string
    port?: number
  }
}

export function provideFirestore(config: FirestoreConfig): Provider[] {
  const app = initializeApp(config.firebaseConfig)

  return [
    {
      provide: FIRESTORE,
      useFactory: () => {
        const firestore = getFirestore(app)
        if (config.useEmulator) {
          const host = typeof config.useEmulator === 'object' ? config.useEmulator.host ?? 'localhost' : 'localhost'
          const port = typeof config.useEmulator === 'object' ? config.useEmulator.port ?? 8080 : 8080

          try {
            connectFirestoreEmulator(firestore, host, port)
          } catch (e) {
            // Already connected
          }
        }
        return firestore
      }
    }
  ]
}
