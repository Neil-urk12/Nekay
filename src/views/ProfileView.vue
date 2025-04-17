<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase/firebase-config'
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'

const myNickname = 'bubu1112041823'
const route = useRoute()
const nicknameParam = route.params.nickname as string

interface Profile { avatar: string; username: string; bio: string; highlights: { image: string; label: string }[]; posts: string[] }
const profile = ref<Profile>({ avatar: '', username: '', bio: '', highlights: [], posts: [] })
const activeTab = ref('posts')
const newPostUrl = ref('')

const loadProfile = async () => {
  const pDoc = await getDoc(doc(db, 'profiles', nicknameParam))
  if (pDoc.exists()) profile.value = pDoc.data() as Profile
  // subscribe to posts
  const postsQuery = query(collection(db, 'profiles', nicknameParam, 'posts'), orderBy('createdAt', 'desc'))
  onSnapshot(postsQuery, snap => {
    profile.value.posts = snap.docs.map(d => (d.data() as any).url)
  })
}

const addPost = async () => {
  if (!newPostUrl.value.trim()) return
  await addDoc(collection(db, 'profiles', nicknameParam, 'posts'), { url: newPostUrl.value.trim(), createdAt: serverTimestamp() })
  newPostUrl.value = ''
}

onMounted(loadProfile)
</script>

<template>
  <div class="profile-container">
    <!-- Header: Avatar, Stats, Edit Button -->
    <header class="profile-header grid-cols">
      <div class="avatar-wrapper">
        <img class="avatar" :src="profile.avatar" alt="User Avatar" />
      </div>
      <div class="profile-details">
        <div class="profile-actions">
          <h1 class="username">{{ profile.username }}</h1>
          <button class="edit-btn">Edit Profile</button>
          <!-- Add settings icon button maybe -->
        </div>

        <div class="profile-bio">
          <h2 class="display-name">{{ profile.username }}</h2>
          <p class="bio">{{ profile.bio }}</p>
        </div>
      </div>
    </header>

    <!-- Bio (for smaller screens) -->
    <div class="profile-bio-mobile">
      <!-- <h2 class="display-name">Display Name</h2> Optional -->
      <p class="bio">{{ profile.bio }}</p>
    </div>

    <!-- Highlights -->
    <section class="highlights-section" v-if="profile.highlights.length > 0">
      <div class="highlights-container">
        <div v-for="(h, idx) in profile.highlights" :key="idx" class="highlight">
          <div class="highlight-image-wrapper">
            <img :src="h.image" :alt="`Highlight: ${h.label}`" />
          </div>
          <span class="highlight-label">{{ h.label }}</span>
        </div>
      </div>
    </section>

    <!-- Navigation Tabs -->
    <!-- <nav class="profile-nav">
      <button
        :class="['profile-nav-item', { active: activeTab === 'posts' }]"
        @click="activeTab = 'posts'"
        aria-label="Posts"
      >
        <span v-html="IconGrid" class="nav-icon"></span>
        <span class="nav-label">Posts</span>
      </button>
      <button
        :class="['profile-nav-item', { active: activeTab === 'reels' }]"
        @click="activeTab = 'reels'"
        aria-label="Reels"
      >
        <span v-html="IconReels" class="nav-icon"></span>
        <span class="nav-label">Reels</span>
      </button>
      <button
        :class="['profile-nav-item', { active: activeTab === 'tagged' }]"
        @click="activeTab = 'tagged'"
        aria-label="Tagged Posts"
      >
        <span v-html="IconTagged" class="nav-icon"></span>
        <span class="nav-label">Tagged</span>
      </button>
    </nav> -->

    <!-- Content Area (Posts Grid, Reels, Tagged) -->
    <main class="profile-content">
      <div v-if="activeTab === 'posts'">
        <!-- Post creation form (own profile only) -->
        <div v-if="activeTab==='posts' && nicknameParam===myNickname" class="add-post">
          <input v-model="newPostUrl" placeholder="Image URL" />
          <button @click="addPost">Add Post</button>
        </div>
        <!-- Posts Grid -->
        <div v-if="profile.posts.length > 0" class="posts-grid">
          <div v-for="(post, index) in profile.posts" :key="`post-${index}`" class="post-item">
            <img :src="post" alt="User post" loading="lazy" />
            <!-- Add overlay with likes/comments on hover if desired -->
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No posts yet.</p>
        </div>
      </div>
      <div v-if="activeTab === 'reels'" class="content-placeholder">
        Reels Content Goes Here
      </div>
      <div v-if="activeTab === 'tagged'" class="content-placeholder">
        Tagged Content Goes Here
      </div>
    </main>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 975px; /* Instagram's max width */
  margin: 0 auto;
  padding: 24px 16px;
  background-color: #fafafa;
  height: 97vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #262626;
}

/* Header */
.profile-header.grid-cols {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 32px;
  align-items: center;
  margin-bottom: 1rem;
}

@media (max-width: 767px) {
  .profile-header.grid-cols {
    gap: 0px;
  }
}

.avatar-wrapper {
  flex-shrink: 0;
  width: 150px; /* Fixed size for avatar area */
  display: flex;
  justify-content: center;
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #dbdbdb;
}

.profile-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap; /* Allow wrapping on smaller screens if needed */
}

.username {
  font-size: 1.05rem; /* Larger username */
  font-weight: 300; /* Lighter weight like Instagram */
  margin: 0;
  color: #262626;
}

.edit-btn {
  padding: 6px 12px;
  border: 1px solid #dbdbdb;
  border-radius: 6px;
  background-color: #efefef;
  color: #262626;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.edit-btn:hover {
  background-color: #e0e0e0;
}

.profile-stats {
  display: flex;
  gap: 9.6px; /* More spacing between stats */
  font-size: 1rem;
}

.stat {
  color: #262626;
}

.stat .number {
  font-weight: 600;
  margin-right: 4.8px;
}

.profile-bio {
  font-size: 1rem;
  line-height: 1.4;
}

.profile-bio .display-name { /* Optional */
  font-weight: 600;
  margin-bottom: 4px;
}

.bio {
  margin: 0;
  color: #262626;
  white-space: pre-line; /* Respect line breaks in bio */
}

/* Hide desktop bio on mobile, show mobile version */
.profile-bio-mobile {
  display: none;
  padding: 0 16px;
  margin-bottom: 24px;
  font-size: 0.875rem;
  line-height: 1.4;
}
.profile-bio-mobile .bio {
  color: #262626;
  white-space: pre-line;
}

/* Highlights */
.highlights-section {
  margin-bottom: 24px;
  padding: 0 8px; /* Slight padding */
}

.highlights-container {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 12px; /* Space for scrollbar */
  /* Hide scrollbar visually */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.highlights-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.highlight {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0; /* Prevent shrinking */
  width: 80px; /* Fixed width for alignment */
  cursor: pointer;
}

.highlight-image-wrapper {
  width: 70px; /* Slightly smaller than container */
  height: 70px;
  border-radius: 50%;
  border: 1px solid #c7c7c7;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px; /* Creates the ring effect */
  background: linear-gradient(white, white) padding-box, /* Or use background color */
              linear-gradient(to right, red, orange) border-box; /* Example gradient */
  margin-bottom: 4px;
}
.highlight-image-wrapper img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fafafa; /* Inner border to separate from gradient */
}

.highlight-label {
  font-size: 0.95rem;
  color: #262626;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%; /* Ensure ellipsis works */
}

/* Navigation */
.profile-nav {
  display: flex;
  justify-content: center; /* Center items */
  border-top: 1px solid #dbdbdb;
  margin-bottom: 4px; /* Less margin */
}

.profile-nav-item {
  flex: 0 1 auto; /* Don't grow, allow shrinking, auto basis */
  padding: 8px 12px; /* Adjust padding */
  text-align: center;
  color: #8e8e8e;
  cursor: pointer;
  background: none;
  border: none;
  border-top: 2px solid transparent; /* Placeholder for active border */
  margin-top: -1px; /* Overlap border-top */
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.profile-nav-item .nav-icon {
  display: inline-block; /* Needed for v-html SVG */
  width: 16px; /* Smaller icon */
  height: 16px;
  vertical-align: middle;
}
.profile-nav-item .nav-icon svg { /* Style the SVG inside */
  display: block;
  width: 100%;
  height: 100%;
  fill: currentColor; /* Inherit color */
}

.profile-nav-item.active {
  color: #262626; /* Or use --active-tab-color */
  border-top-color: #262626; /* Or use --active-tab-color */
}
.profile-nav-item:not(.active):hover {
  color: #262626;
}

/* Content Area */
.profile-content {
  /* No extra styles needed unless specific layout per tab */
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  height: 100%;
  text-align: center;
  color: #8e8e8e;
  font-size: 1.2rem;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px; /* Smaller gap */
}

.post-item {
  position: relative;
  aspect-ratio: 1 / 1; /* Maintain square shape */
  background-color: #eee; /* Placeholder background */
  cursor: pointer;
}

.post-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block; /* Remove extra space below image */
  transition: opacity 0.3s ease;
}

.post-item:hover img {
  opacity: 0.85;
}

.content-placeholder {
  padding: 24px 0;
  text-align: center;
  color: #8e8e8e;
  font-size: 1.4rem;
}


/* --- Responsiveness --- */
@media (max-width: 767px) {
  .profile-container {
    padding: 16px 0; /* Remove side padding */
  }

  .profile-header {
    flex-direction: column; /* Stack header items */
    align-items: center; /* Center avatar */
    gap: 16px;
    padding: 0 16px; /* Add padding back here */
    margin-bottom: 16px;
  }

  .avatar-wrapper {
     width: 80px; /* Smaller avatar on mobile */
     margin-bottom: 8px;
  }
  .avatar {
    width: 80px;
    height: 80px;
  }

  .profile-details {
    align-items: center; /* Center details text */
    gap: 12px;
    width: 100%; /* Take full width */
  }

  .profile-actions {
    order: 2; /* Move actions below stats */
    justify-content: center;
    width: 100%;
    gap: 12px;
  }
  .username {
    order: -1; /* Keep username first visually in its row */
    font-size: 2.5rem;
    text-align: center;
    width: 100%; /* Take full width */
    margin-bottom: 8px;
  }
  .edit-btn {
    flex-grow: 1; /* Make button take available space */
    max-width: 250px; /* Limit button width */
  }

  .profile-stats {
    order: 1; /* Move stats above actions */
    justify-content: space-around; /* Spread stats */
    width: 100%;
    padding: 8px 0;
    border-top: 1px solid #dbdbdb;
    border-bottom: 1px solid #dbdbdb;
    margin-top: 8px;
    gap: 12px; /* Reduce gap */
    font-size: 0.875rem;
  }
  .stat {
    text-align: center;
    display: flex; /* Stack number and label */
    flex-direction: column;
    gap: 2px;
  }
  .stat .number {
    margin-right: 0;
  }

  .profile-bio {
    display: none; /* Hide desktop bio */
  }
  .profile-bio-mobile {
    display: block; /* Show mobile bio */
  }

  .highlights-section {
     padding: 0 16px; /* Add padding back */
     margin-bottom: 24px;
  }
  .highlight {
    width: 70px;
  }
  .highlight-image-wrapper {
    width: 60px;
    height: 60px;
  }
  .highlight-label {
    font-size: 2.7rem;
  }

  .profile-nav {
    /* Keep centered, maybe reduce padding slightly if needed */
  }
  .profile-nav-item {
    padding: 8px 12px;
    gap: 4px;
  }
  .nav-label {
    display: none; /* Hide labels on small screens, show only icons */
  }
   .profile-nav-item .nav-icon {
     width: 24px; /* Make icons slightly larger when labels are hidden */
     height: 24px;
   }

  .posts-grid {
    gap: 2px; /* Even smaller gap on mobile */
  }
}

</style>