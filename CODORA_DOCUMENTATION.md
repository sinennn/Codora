# Codora - Complete Application Documentation

## Overview

**Codora** is an AI-powered developer learning platform that teaches programming through guided lessons, AI mentorship, and structured learning paths. At its core are two AI tutors — Nime and Nesto — who provide personalized instruction, feedback, and coaching to help developers build real skills.

**Mission**: Make coding education addictive, smart, and personal through AI-driven mentorship.

**Platform**: Mobile-first application built with React + Capacitor + Ionic, deployable to iOS, Android, and web.

---

## Core Philosophy

Codora is built on the principle that **learning comes first**. The platform prioritizes:

1. **Understanding before testing** — Lessons teach concepts before assessments validate them
2. **AI mentorship as the core** — Nime and Nesto aren't features, they're the product
3. **Skill mastery over scores** — Progress is measured by what you can do, not points earned
4. **Adaptive learning** — Content adjusts based on your strengths and weak areas
5. **Long-term growth** — Building lasting programming skills, not short-term engagement

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 19 + TypeScript |
| Mobile Framework | Capacitor + Ionic |
| Styling | Tailwind CSS |
| Backend & Database | Firebase (Auth, Firestore, Realtime DB, Storage) |
| AI Integration | Google Gemini API |
| Build Tool | Vite |
| State Management | React Context API |
| Animations | Framer Motion |

---

## Core Features

### 1. AI Tutor System (The Heart of Codora)

The dual-tutor system is Codora's primary learning mechanism. Every user interaction is designed around receiving guidance, feedback, and mentorship from these AI tutors.

**Nime - The Learning Guide**
- Warm, encouraging, patient personality
- Explains concepts clearly with the "why" behind everything
- Breaks down complex topics into digestible pieces
- Celebrates progress and reassures during struggles
- Provides contextual tips and learning recommendations
- Like a patient senior developer who genuinely loves teaching

**Nesto - The Performance Coach**
- Direct, motivating, results-focused personality
- Identifies gaps and pushes for improvement
- Tracks consistency and holds learners accountable
- Challenges users to level up their skills
- Focuses on discipline, repetition, and mastery
- Like a coach who believes in your potential

**How Tutors Integrate**
- Lesson explanations and walkthroughs
- Real-time feedback during exercises
- Post-assessment analysis and guidance
- Weak topic identification and remediation
- Personalized learning path recommendations
- Daily tips and motivation

### 2. Lesson System

**AI-Generated Lessons**
- Dynamic lessons tailored to chosen field or technology
- Structured sections with clear learning objectives
- Code examples with syntax highlighting
- Progressive difficulty within each lesson
- Estimated completion times

**Exercise Types**
- Code completion — Fill in missing code
- Multiple choice — Concept validation
- Code fix/debugging — Find and fix errors
- Concept explanation — Demonstrate understanding

**Lesson Flow**
1. Tutor introduces the topic and context
2. Concept explanation with examples
3. Guided exercises with hints
4. Tutor feedback on performance
5. Summary and next steps

### 3. Learning Paths

- Personalized roadmaps based on goals
- Progressive skill building
- Technology and field recommendations
- Estimated completion timelines
- Adaptive based on performance

### 4. Assessment System

Assessments exist to **validate understanding and identify weak areas**, not as the primary experience.

**Purpose of Assessments**
- Confirm concept mastery after lessons
- Identify topics needing more practice
- Adapt future lesson recommendations
- Reinforce concepts already taught

**Assessment Features**
- AI-generated questions via Gemini API
- Three difficulty levels:
  - **Starter**: Fundamental concepts
  - **Intermediate**: Practical application
  - **Advanced**: Complex problem-solving
- Detailed explanations for every answer
- Tutor feedback on results
- Weak topic flagging for follow-up lessons

### 5. Skill Tracking & Mastery

**Per-Skill Progress**
- Mastery levels (0-5) for each topic
- Categories: Language, Framework, Concept
- Accuracy tracking over time
- Last practiced timestamps

**Weak Topic Identification**
- Automatic detection of struggling areas
- Tutor recommendations for remediation
- Targeted lesson suggestions
- Progress tracking on improvements

### 6. Progress & Motivation System

Gamification elements support learning — they are not the product.

**XP & Leveling**
- Rewards for completing lessons and exercises
- 10 progression levels reflecting skill growth:
  1. Novice → 10. Legend

**Streaks**
- Encourages consistent daily practice
- Streak-based achievements for habit building

**Daily Goals**
- Configurable learning targets
- Progress tracking toward goals

**Achievements**
- Milestone recognition (first lesson, streak milestones, mastery achievements)
- Focused on learning accomplishments, not competition

### 7. Collaborative Learning (Group Sessions)

- Real-time group learning sessions
- Shared assessments for study groups
- Room creation and joining
- Synchronized progress

---

## Learning Topics

### Fields (46 categories)

Codora covers comprehensive developer education across:

- AI/Machine Learning
- Android/iOS Development
- API Development & Testing
- Backend/Frontend/Full Stack Development
- Blockchain Development
- Cloud Architecture & Computing (AWS, Azure, GCP)
- Data Engineering & Science
- Data Structures and Algorithms
- Database Administration
- DevOps & Platform Engineering
- Game Development
- Mobile Development (Flutter, React Native, Ionic)
- Security Engineering
- Software Architecture & Testing
- Systems Programming
- UI/UX Development
- Web Development
- And 25+ more specialized fields

### Technologies (215+ options)

**Languages**: JavaScript, TypeScript, Python, Java, C/C++, Go, Rust, Swift, Kotlin, and 50+ more

**Frameworks**: React, Angular, Vue.js, Next.js, Django, Spring Boot, Express.js, and 40+ more

**Databases**: PostgreSQL, MySQL, MongoDB, Redis, Firebase, and more

**Cloud & DevOps**: AWS, Azure, Docker, Kubernetes, Terraform, and more

---

## Application Structure

### Authentication
| Page | Description |
|------|-------------|
| Splash | Initial loading screen |
| Login | Email/password and Google OAuth |
| Signup | User registration |

### Main Experience
| Page | Description |
|------|-------------|
| Dashboard | Learning hub with progress, daily goals, tutor tips |
| Profile | Skills, achievements, learning history |
| Leaderboard | Community rankings (motivation, not competition) |

### Learning
| Page | Description |
|------|-------------|
| Tutor Select | Choose your AI mentor (Nime or Nesto) |
| Tutor Lesson | AI-generated interactive lessons with exercises |
| Tutor Complete | Lesson completion with feedback and next steps |

### Assessments
| Page | Description |
|------|-------------|
| Solo Settings | Configure assessment (topic, difficulty) |
| Solo Assessment | Individual knowledge check |
| Solo Complete | Results with tutor analysis |
| Group Session | Collaborative learning/assessment |

---

## Data Architecture

### UserProgress
```typescript
{
  // Identity
  id, username, email, photoURL
  
  // Learning Progress
  xp, level, levelTitle
  
  // Consistency
  currentStreak, longestStreak, lastActiveDate
  dailyGoal, dailyProgress
  
  // Skill Mastery
  skills: SkillProgress[]  // Per-topic mastery levels
  weakTopics: string[]     // Areas needing attention
  
  // Stats
  totalQuestions, correctAnswers, accuracy
  totalTimeSpent
  
  // Preferences
  preferredTutor: 'nime' | 'nesto' | 'both'
}
```

### SkillProgress
```typescript
{
  skillId, name
  category: 'language' | 'framework' | 'concept'
  level: number        // 0-5 mastery
  xp: number
  totalLessons, completedLessons
  accuracy: number
  lastPracticed?: string
}
```

---

## Services Architecture

### AI Services (Core)
- **tutorService.ts**: Nime & Nesto feedback, explanations, guidance
- **aiService.ts**: Lesson and assessment content generation

### Learning Services
- **userProgressService.ts**: Skill tracking, mastery, weak topics
- **scoreService.ts**: Progress rankings

### Firebase Collections
- `userProgress` — Learning progress, skills, achievements
- `tutorLessons` — Generated lesson content
- `userLessons` — User lesson progress
- `quizResults` — Assessment history for adaptive learning

---

## State Management

### Context Providers
- **AuthContext**: User authentication state
- **UserProgressContext**: Learning progress, skills, achievements

### Features
- Local caching for offline learning
- Automatic sync on reconnection
- Progress memory across sessions

---

## Integrations

### Firebase
- Authentication (Email, Google OAuth)
- Firestore (User data, lessons, progress)
- Realtime Database (Group sessions)
- Analytics (Learning patterns)

### Capacitor (Mobile)
- Google Auth, Notifications, Speech Recognition
- Offline storage, Network detection

### UI/UX
- Framer Motion (Smooth animations)
- React Syntax Highlighter (Code display)
- Radix UI (Accessible components)

---

## Future Direction

Codora is designed to expand into:

1. **Project-Based Learning** — Build real projects with AI guidance
2. **AI Code Review** — Submit code for tutor feedback
3. **Learning Communities** — Study groups and mentorship
4. **Certification Paths** — Structured programs with credentials
5. **IDE Integration** — Learn while you code

---

## Summary

Codora is an AI mentor + learning system where:

- **Nime and Nesto** are the core product, providing personalized instruction and feedback
- **Lessons** teach concepts through explanation, examples, and guided exercises
- **Assessments** validate understanding and identify areas for improvement
- **Skill tracking** measures real mastery, not just points
- **Gamification** supports consistent learning habits

The platform is built to help developers grow their skills through intelligent, adaptive, mentor-driven education — not through quiz mechanics or competitive gameplay.
