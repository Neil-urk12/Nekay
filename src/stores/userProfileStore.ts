import { defineStore } from 'pinia'
import { supabase } from '../supabase/supabase-config'

export const useUserProfileStore = defineStore('userProfile', {
  state: () => ({
    name: '',
    email: '',
    avatarUrl: null as string | null,
    loading: false,
    initialized: false,
  }),

  getters: {
    isProfileLoaded: state => state.initialized,
    userInitials: (state) => {
      if (state.name) {
        return state.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      }
      if (state.email) {
        return state.email[0].toUpperCase()
      }
      return '?'
    },
  },

  actions: {
    async fetchUserProfile(forceRefresh = false) {
      // Skip if already loaded unless forcing refresh
      if (this.initialized && !forceRefresh) {
        return
      }

      this.loading = true
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          throw new Error('User not authenticated')
        }

        this.email = session.user.email || ''

        // Fetch the user's name and avatar from the public.users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
          throw error
        }

        this.name = userData?.name || ''
        this.avatarUrl = userData?.avatar_url || null
        this.initialized = true
      }
      catch (error) {
        console.error('Error loading profile:', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },

    async updateName(newName: string) {
      if (!newName.trim()) {
        throw new Error('Name cannot be empty')
      }

      this.loading = true
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) {
          throw new Error('User not authenticated')
        }

        const { error } = await supabase
          .from('users')
          .update({ name: newName.trim() })
          .eq('id', session.user.id)

        if (error)
          throw error

        this.name = newName.trim()
      }
      catch (error) {
        console.error('Error updating name:', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },

    async updateEmail(newEmail: string) {
      if (!newEmail.trim() || newEmail === this.email) {
        return
      }

      this.loading = true
      try {
        const { error } = await supabase.auth.updateUser({
          email: newEmail.trim(),
        })

        if (error)
          throw error

        // Email update requires confirmation, so we don't update local state yet
        // The user will need to confirm the new email address
      }
      catch (error) {
        console.error('Error updating email:', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },

    async updateAvatar(file: File) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image must be less than 2MB')
      }

      this.loading = true
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) {
          throw new Error('User not authenticated')
        }

        const userId = session.user.id
        const fileExt = file.name.split('.').pop()
        const filePath = `${userId}/avatar.${fileExt}`

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true })

        if (uploadError)
          throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

        // Update user record in database
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: publicUrl })
          .eq('id', userId)

        if (updateError)
          throw updateError

        this.avatarUrl = publicUrl
      }
      catch (error) {
        console.error('Error uploading avatar:', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },

    clearProfile() {
      this.name = ''
      this.email = ''
      this.avatarUrl = null
      this.loading = false
      this.initialized = false
    },
  },
})
