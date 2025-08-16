ngx-fire


A small, declarative, signal-based way to work with Firebase in Angular. It uses Angular signals for ergonomic state and real-time updates. Today it focuses on Firestore; Auth support is planned ASAP.

Features

- Declarative signals for real-time Firestore data
- Minimal API surface
- No @angular/fire dependency (uses Firebase Web SDK directly)
- Emulator support via configuration
- Auto-cleanup on component destroy

Install

- 


From npm:


	- npm install ngx-fire firebase
- 
Peer requirements:


	- Angular 17+ (works great with 18/19/20)
	- Firebase JS SDK 10+
If you’re developing locally against the source (monorepo), map the library path in your root tsconfig instead of installing from npm:


	{
	  "compilerOptions": {
	    "paths": {
	      "ngx-fire": ["projects/ngx-fire/src/public-api.ts"]
	    }
	  }
	}

Quick Start

1) Provide Firestore in your app config

	// app.config.ts
	import { ApplicationConfig } from '@angular/core'
	import { provideRouter } from '@angular/router'
	import { provideFirestore } from 'ngx-fire'
	
	export const appConfig: ApplicationConfig = {
	  providers: [
	    provideRouter([]),
	    provideFirestore({
	      firebaseConfig: {
	        apiKey: '...',
	        authDomain: '...',
	        projectId: '...',
	        appId: '...'
	      },
	      // Optional: connect to emulator
	      // useEmulator: true
	      // or with options:
	      // useEmulator: { host: 'localhost', port: 8080 }
	    })
	  ]
	}

Supported config shapes:


	// Simplest:
	provideFirestore({ firebaseConfig })
	
	// Enable emulator with defaults (localhost:8080):
	provideFirestore({ firebaseConfig, useEmulator: true })
	
	// Custom emulator:
	provideFirestore({
	  firebaseConfig,
	  useEmulator: { host: '127.0.0.1', port: 8080 }
	})

2) Use injectCollection in a component

	import { Component, ChangeDetectionStrategy } from '@angular/core'
	import { injectCollection } from 'ngx-fire'
	
	type Post = {
	  id: string
	  title: string
	  content: string
	  createdAt: Date
	}
	
	@Component({
	  selector: 'app-posts',
	  template: `
	    @if (posts.error()) {
	      <p class="text-red-600">Error: {{ posts.error()?.message }}</p>
	    }
	
	    <ul>
	      @for (p of posts.data(); track p.id) {
	        <li>{{ p.title }} — {{ p.content }}</li>
	      }
	    </ul>
	
	    <button (click)="add()">Add</button>
	  `,
	  changeDetection: ChangeDetectionStrategy.OnPush
	})
	export class PostsComponent {
	  posts = injectCollection<Post>('posts')
	
	  async add() {
	    await this.posts.insert({
	      title: 'Hello',
	      content: 'World',
	      createdAt: new Date()
	    })
	  }
	}

API

provideFirestore(config)


Initializes Firebase App and registers a Firestore instance in Angular DI.


- firebaseConfig: FirebaseOptions
- useEmulator:
	- boolean — true uses localhost:8080
	- { host?: string; port?: number } — custom emulator
Examples:


	provideFirestore({ firebaseConfig })
	provideFirestore({ firebaseConfig, useEmulator: true })
	provideFirestore({ firebaseConfig, useEmulator: { host: 'localhost', port: 8080 } })

injectCollection<T>(collectionPath: string)


Subscribes to a Firestore collection with real-time updates and exposes signals.

Returns:


- data: ReadonlySignal<T[]>
- error: ReadonlySignal<Error | null>
- hasError: ReadonlySignal<boolean>
- insert(doc: Omit<T, 'id'>): Promise<DocumentReference>
- update(id: string, changes: Partial<T>): Promise<DocumentReference>
- remove(id: string): Promise<void>
Notes:


- Each document in data() includes id as a field.
- Timestamps are normalized to Date for template friendliness.
- Cleanup happens automatically on component destroy.
Example:


	type Todo = { id: string; title: string; done: boolean; createdAt: Date }
	
	const todos = injectCollection<Todo>('todos')
	
	todos.data()     // Todo[]
	todos.error()    // Error | null
	todos.hasError() // boolean
	
	await todos.insert({ title: 'Buy milk', done: false, createdAt: new Date() })
	await todos.update('docId', { done: true })
	await todos.remove('docId')

Using Zod (optional)

	import { z } from 'zod'
	
	const PostSchema = z.object({
	  id: z.string(),
	  title: z.string(),
	  content: z.string(),
	  createdAt: z.date()
	})
	
	type Post = z.infer<typeof PostSchema>
	
	const posts = injectCollection<Post>('posts')

Validation at runtime is up to you; ngx-fire uses the inferred types for compile-time safety.

Firestore Emulator with Docker (optional)

	version: '3.8'
	services:
	  firebase-emulator:
	    image: google/cloud-sdk:emulators
	    command: >
	      bash -lc "
	      gcloud config set project your-project &&
	      gcloud beta emulators firestore start --host-port=0.0.0.0:8080 --quiet
	      "
	    ports:
	      - '8080:8080'

Start:


	docker compose up -d

Enable in app:


	provideFirestore({ firebaseConfig, useEmulator: true })

Roadmap

- Firebase Auth support with signal-based session state
- Document-level helpers (injectDoc)
- Query helpers (constraints, pagination)
- Transaction and batch utilities

License


MIT
