import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Tasks from '../Tasks.vue'
import { useNotesStore } from '../../stores/notes'

describe('Tasks.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T10:00:00')) // Morning time for testing
  })

  it('renders tasks and folders correctly', async () => {
    const wrapper = mount(Tasks)
    const store = useNotesStore()
    
    // Add test data
    await store.addFolder('Test Folder', 'task')
    await store.addTask('Test Task')

    expect(wrapper.find('.page-title').text()).toContain('My Tasks')
    expect(wrapper.find('.folder-item').text()).toContain('Test Folder')
    expect(wrapper.find('.task-item').text()).toContain('Test Task')
  })

  it('adds new task when form is submitted', async () => {
    const wrapper = mount(Tasks)
    
    await wrapper.find('.add-task input').setValue('New Task')
    await wrapper.find('.add-task button').trigger('click')

    expect(wrapper.findAll('.task-item')).toHaveLength(1)
    expect(wrapper.find('.task-item').text()).toContain('New Task')
  })

  it('adds new folder when form is submitted', async () => {
    const wrapper = mount(Tasks)
    
    await wrapper.find('.add-folder input').setValue('New Folder')
    await wrapper.find('.add-folder button').trigger('click')

    expect(wrapper.findAll('.folder-item')).toHaveLength(2) // Including "All Tasks"
    expect(wrapper.find('.folder-item:last-child').text()).toContain('New Folder')
  })

  it('toggles task completion status', async () => {
    const wrapper = mount(Tasks)
    const store = useNotesStore()
    
    await store.addTask('Test Task')
    await wrapper.find('input[type="checkbox"]').setValue(true)

    const taskElement = wrapper.find('.task-label span')
    expect(taskElement.classes()).toContain('completed')
  })

  it('filters tasks by selected folder', async () => {
    const wrapper = mount(Tasks)
    const store = useNotesStore()
    
    // Create folder and tasks
    const folder = await store.addFolder('Test Folder', 'task')
    await store.addTask('Task 1', folder.id)
    await store.addTask('Task 2', null)

    // Force a re-render to ensure the DOM is updated
    await wrapper.vm.$nextTick()
    
    // Click the folder (using the folder id for more reliable selection)
    const folderButton = wrapper.find(`[data-folder-id="${folder.id}"]`)
    await folderButton.trigger('click')
    
    // Wait for the filtered results
    await wrapper.vm.$nextTick()
    
    // Verify filtered tasks
    const taskItems = wrapper.findAll('.task-item')
    expect(taskItems).toHaveLength(1)
    expect(taskItems[0].text()).toContain('Task 1')
  })

  it('sets correct background based on time of day', () => {
    const wrapper = mount(Tasks)
    
    expect(wrapper.find('.tasks-container').attributes('style'))
      .toContain('url(/public/assets/bgsky.jpg)')
  })

  it('allows editing task title', async () => {
    const wrapper = mount(Tasks)
    const store = useNotesStore()
    
    await store.addTask('Original Task')
    await wrapper.find('.edit-button').trigger('click')
    await wrapper.find('.task-item input').setValue('Updated Task')
    await wrapper.find('.task-item button:first-child').trigger('click')

    expect(wrapper.find('.task-item').text()).toContain('Updated Task')
  })
})
