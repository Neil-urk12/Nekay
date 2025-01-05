import Dexie, { Table } from 'dexie'
import { BaseItem, JournalEntry, Task, Folder } from '../composables/interfaces'

export interface Note extends BaseItem {
  content: string
}

export interface PomodoroSession extends BaseItem {
  startTime: number
  endTime: number
  duration: number
  type: 'work' | 'break'
  completed: boolean
}

export interface PomodoroStats extends BaseItem {
  completedSessions: number
  totalFocusTime: number
}

class NekayDatabase extends Dexie {
  tasks!: Table<Task>
  journal!: Table<JournalEntry>
  folders!: Table<Folder>
  notes!: Table<Note>
  pomodoro!: Table<PomodoroSession>

  constructor() {
    super('NekayOfflineDB_v2')
    
    this.version(1).stores({
      tasks: 'id, taskContent, status, folderId, syncStatus, lastModified, timestamp, [syncStatus+lastModified]',
      journal: 'id, title, folderId, date, lastModified, [syncStatus+lastModified]',
      folders: 'id, name, type, syncStatus, lastModified, timestamp, [syncStatus+lastModified]',
      notes: 'id, noteTitle, noteContent, syncStatus, timestamp, lastModified, [syncStatus+lastModified]',
      pomodoro: 'id, type, syncStatus, startTime, timestamp, lastModified, [syncStatus+lastModified]',
    })

    this.tasks = this.table('tasks')
    this.journal = this.table('journal')
    this.folders = this.table('folders')
    this.notes = this.table('notes')
    this.pomodoro = this.table('pomodoro')
  }
}

const db = new NekayDatabase()