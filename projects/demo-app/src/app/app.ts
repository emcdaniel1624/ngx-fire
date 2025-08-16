import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { injectCollection } from 'ngx-fire';
import { z } from 'zod';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-4xl mx-auto py-8 px-4">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Posts</h1>
          <p class="text-gray-600">Manage your collection</p>
        </div>

        <!-- Add Post Form -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Add New Post</h2>
          <form (ngSubmit)="addPost()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                [(ngModel)]="newPost.title"
                name="title"
                type="text"
                placeholder="Enter post title"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                [(ngModel)]="newPost.content"
                name="content"
                rows="3"
                placeholder="Enter post content"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              [disabled]="!newPost.title || !newPost.content"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Post
            </button>
          </form>
        </div>

        <!-- Error State -->
        @if (posts.error()) {
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div class="text-red-800 font-medium">Error loading posts</div>
            <div class="text-red-600 text-sm mt-1">{{ posts.error()?.message }}</div>
          </div>
        }

        <!-- Posts List -->
        <div class="space-y-4">
          @for (post of posts.data(); track post.id) {
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 group hover:shadow-md transition-shadow">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ post.title }}</h3>
                  <p class="text-gray-600 mb-3">{{ post.content }}</p>
                  <div class="text-sm text-gray-400">
                    {{ post.createdAt | date:'medium' }}
                  </div>
                </div>
                <button
                  (click)="deletePost(post.id)"
                  class="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Delete post"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          } @empty {
            <div class="text-center py-12">
              <div class="text-gray-500 mb-2">No posts yet</div>
              <div class="text-sm text-gray-400">Add your first post above</div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class App {
  posts = injectCollection<Post>('posts')

  newPost = {
    title: '',
    content: ''
  }

  async addPost() {
    if (!this.newPost.title || !this.newPost.content) return

    await this.posts.insert({
      title: this.newPost.title,
      content: this.newPost.content,
      createdAt: new Date()
    })

    // Reset form
    this.newPost = { title: '', content: '' }
  }

  async deletePost(id: string) {
    await this.posts.remove(id)
  }
}

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.date()
})

type Post = z.infer<typeof PostSchema>
