import { db } from './db';
import { AppData, User, Team, Project, Task, Milestone, PromptEntry, ToolError, Comment, ActivityEvent } from '../types';

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function loadDemoData(): Promise<void> {
  const now = new Date();


  // Helper date generators
  const daysFromNow = (days: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const daysAgoIso = (days: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  // 1. Users
  const alexSalt = 'alex-demo-salt-1234';
  const samSalt = 'sam-demo-salt-5678';
  const [alexHash, samHash] = await Promise.all([
    hashPassword('demo1234', alexSalt),
    hashPassword('demo1234', samSalt)
  ]);

  const alexId = 'user-alex-demo';
  const samId = 'user-sam-rivera';
  const teamId = 'team-demo-studio';

  const userAlex: User = {
    id: alexId,
    name: 'Alex Demo',
    email: 'alex@demo.test',
    passwordHash: alexHash,
    passwordSalt: alexSalt,
    githubUsername: 'alex-demo',
    teamIds: [teamId],
    theme: 'system',
    createdAt: daysAgoIso(30)
  };

  const userSam: User = {
    id: samId,
    name: 'Sam Rivera',
    email: 'sam@demo.test',
    passwordHash: samHash,
    passwordSalt: samSalt,
    githubUsername: 'samrivera',
    teamIds: [teamId],
    theme: 'dark',
    createdAt: daysAgoIso(28)
  };

  // 2. Team
  const demoTeam: Team = {
    id: teamId,
    name: 'Demo Studio',
    memberIds: [alexId, samId],
    ownerId: alexId,
    createdAt: daysAgoIso(28)
  };

  // 3. Projects
  // Project 1 (Solo): Portfolio Site
  const proj1Id = 'proj-portfolio-site';
  const col1Todo = 'col-p1-todo';
  const col1Progress = 'col-p1-inprogress';
  const col1Review = 'col-p1-review';
  const col1Done = 'col-p1-done';

  const proj1MilestoneOverdue = 'ms-p1-overdue';
  const proj1MilestoneUpcoming = 'ms-p1-upcoming';

  const project1: Project = {
    id: proj1Id,
    name: 'Portfolio Site',
    description: 'Personal developer showcase featuring interactive projects, resume, and blog.',
    teamId: null, // Solo
    ownerId: alexId,
    members: [{ userId: alexId, role: 'owner' }],
    columns: [
      { id: col1Todo, name: 'To Do', category: 'open', order: 0 },
      { id: col1Progress, name: 'In Progress', category: 'in_progress', order: 1 },
      { id: col1Review, name: 'Review', category: 'in_progress', order: 2 },
      { id: col1Done, name: 'Done', category: 'closed', order: 3 },
    ],
    labels: ['design', 'frontend', 'seo', 'content', 'performance'],
    context: {
      summary: 'A fast, accessible, minimalist portfolio website highlighting full-stack engineering and AI tools experience.',
      techStack: 'Next.js 14 App Router, Tailwind CSS, TypeScript, MDX for blog posts, Vercel deployment.',
      functionalRequirements: '- Responsive navigation and project showcase\n- Interactive playground for AI prototypes\n- Contact form with client-side validation\n- Dark mode support matching OS preference',
      nonFunctionalRequirements: '- Lighthouse score 95+ across Performance, Accessibility, Best Practices, SEO\n- Sub-second page loads',
      dataRequirements: 'Static MDX files for projects and essays. No external database required.',
      databaseNotes: 'Content layer powered by Contentlayer or local markdown parsing.',
      extraNotes: 'Adopt clean editorial typography and generous whitespace. Ensure all code blocks have copy buttons.',
      updatedAt: daysAgoIso(1)
    },
    anchorLinks: {
      presentation: 'https://slides.example.com/alex-portfolio-deck',
      demo: 'https://demo.portfolio.dev',
      documentation: 'https://docs.portfolio.dev/guide'
    },
    createdAt: daysAgoIso(20)
  };

  // Project 2 (Team): Habit Tracker App
  const proj2Id = 'proj-habit-tracker';
  const col2Todo = 'col-p2-todo';
  const col2Progress = 'col-p2-inprogress';
  const col2Review = 'col-p2-review';
  const col2Done = 'col-p2-done';

  const proj2Ms1 = 'ms-p2-v1';
  const proj2Ms2 = 'ms-p2-v2';
  const proj2Ms3 = 'ms-p2-v3';

  const project2: Project = {
    id: proj2Id,
    name: 'Habit Tracker App',
    description: 'Cross-platform daily habit and streak tracking app with social accountability.',
    teamId: teamId, // Team
    ownerId: alexId,
    members: [
      { userId: alexId, role: 'owner' },
      { userId: samId, role: 'admin' }
    ],
    columns: [
      { id: col2Todo, name: 'To Do', category: 'open', order: 0 },
      { id: col2Progress, name: 'In Progress', category: 'in_progress', order: 1 },
      { id: col2Review, name: 'Review', category: 'in_progress', order: 2 },
      { id: col2Done, name: 'Done', category: 'closed', order: 3 },
    ],
    labels: ['core', 'mobile', 'api', 'analytics', 'ui'],
    context: {
      summary: 'Daily habit tracking app built to help individuals sustain daily streaks and share progress with accountability partners.',
      techStack: 'React Native (Expo), Node.js / Express backend, PostgreSQL, Tailwind-style React Native primitives.',
      functionalRequirements: '- Create, edit, and archive habits\n- Daily completion toggle with vibration feedback\n- Streak calculations and calendar heatmap\n- Push notifications for daily reminders',
      nonFunctionalRequirements: '- Offline-first local SQLite sync\n- WCAG AA compliant colour palettes for streaks',
      dataRequirements: 'Users, Habits, Completions, Streaks, Friendships.',
      databaseNotes: 'PostgreSQL on Supabase, indexed by userId and date.',
      extraNotes: 'Use optimistic UI updates for habit completion toggles.',
      updatedAt: daysAgoIso(2)
    },
    anchorLinks: {
      presentation: 'https://slides.example.com/habit-tracker-pitch',
      demo: 'https://habit-tracker.demo.app',
      report: 'https://docs.google.com/document/d/example-final-report'
    },
    createdAt: daysAgoIso(25)
  };

  // 4. Milestones
  const milestones: Milestone[] = [
    // Project 1 Milestones
    {
      id: proj1MilestoneOverdue,
      projectId: proj1Id,
      title: 'v0.1 Prototype Polish',
      notes: 'Initial layout, typography, and basic project carousel.',
      dueDate: daysFromNow(-3), // 3 days overdue
      color: null,
      createdAt: daysAgoIso(15)
    },
    {
      id: proj1MilestoneUpcoming,
      projectId: proj1Id,
      title: 'v1.0 Public Launch',
      notes: 'Final content review, SEO metadata, and domain setup.',
      dueDate: daysFromNow(10), // 10 days left
      color: null,
      createdAt: daysAgoIso(10)
    },
    // Project 2 Milestones
    {
      id: proj2Ms1,
      projectId: proj2Id,
      title: 'Alpha Release (Core Loop)',
      notes: 'Habit CRUD, streak counter, and local storage.',
      dueDate: daysFromNow(-7), // Overdue/done
      color: null,
      createdAt: daysAgoIso(24)
    },
    {
      id: proj2Ms2,
      projectId: proj2Id,
      title: 'Beta Release (Sync & Social)',
      notes: 'Cloud sync with Supabase and friend feeds.',
      dueDate: daysFromNow(5),
      color: null,
      createdAt: daysAgoIso(18)
    },
    {
      id: proj2Ms3,
      projectId: proj2Id,
      title: 'App Store Submission',
      notes: 'Screenshots, privacy policy, and production build review.',
      dueDate: daysFromNow(21),
      color: null,
      createdAt: daysAgoIso(10)
    }
  ];

  // 5. Tasks for Project 1 (Portfolio Site - 8 tasks)
  const p1Tasks: Task[] = [
    {
      id: 'p1-t1',
      projectId: proj1Id,
      columnId: col1Done,
      order: 0,
      title: 'Design clean monochrome hero section',
      description: 'Create an engaging hero banner with headline and social links.',
      priority: 'high',
      type: 'feature',
      assigneeId: alexId,
      milestoneId: proj1MilestoneOverdue,
      dueDate: daysFromNow(-10),
      labels: ['design', 'frontend'],
      notes: 'Implemented using Tailwind gradients and Inter font. Passes AA contrast.',
      requirements: [
        { id: 'r1', text: 'Responsive headline typography', done: true },
        { id: 'r2', text: 'Social icons linking to GitHub and Twitter', done: true }
      ],
      aiContext: 'Use Lucide React icons with accessible labels.',
      createdBy: alexId,
      createdAt: daysAgoIso(14),
      updatedAt: daysAgoIso(10)
    },
    {
      id: 'p1-t2',
      projectId: proj1Id,
      columnId: col1Done,
      order: 1,
      title: 'Configure dark mode toggle with system fallback',
      description: 'Support light, dark, and system preference with local storage persistence.',
      priority: 'medium',
      type: 'feature',
      assigneeId: alexId,
      milestoneId: proj1MilestoneOverdue,
      dueDate: daysFromNow(-8),
      labels: ['frontend'],
      notes: 'Works smoothly via Tailwind class strategy on html tag.',
      requirements: [
        { id: 'r3', text: 'System color scheme listener', done: true },
        { id: 'r4', text: 'Persistent local storage key', done: true }
      ],
      aiContext: 'Avoid flashing white on page load.',
      createdBy: alexId,
      createdAt: daysAgoIso(12),
      updatedAt: daysAgoIso(9)
    },
    {
      id: 'p1-t3',
      projectId: proj1Id,
      columnId: col1Review,
      order: 0,
      title: 'Interactive Project Showcase Cards',
      description: 'Filterable gallery of past projects with tech tags and live preview links.',
      priority: 'high',
      type: 'feature',
      assigneeId: alexId,
      milestoneId: proj1MilestoneOverdue, // Incomplete in overdue milestone
      dueDate: daysFromNow(-2),
      labels: ['frontend', 'design'],
      notes: 'Cards render nicely. Need to confirm keyboard focus outlines.',
      requirements: [
        { id: 'r5', text: 'Tag filtering', done: true },
        { id: 'r6', text: 'Modal preview on click', done: false },
        { id: 'r7', text: 'Keyboard navigable tab stop', done: true }
      ],
      aiContext: 'Ensure cards have aria-label and clear focus rings.',
      createdBy: alexId,
      createdAt: daysAgoIso(8),
      updatedAt: daysAgoIso(2)
    },
    {
      id: 'p1-t4',
      projectId: proj1Id,
      columnId: col1Progress,
      order: 0,
      title: 'Setup MDX blog post pipeline',
      description: 'Render markdown essays with syntax highlighting and reading time.',
      priority: 'medium',
      type: 'feature',
      assigneeId: alexId,
      milestoneId: proj1MilestoneUpcoming,
      dueDate: daysFromNow(2),
      labels: ['content', 'frontend'],
      notes: 'Remark GFM integration tested.',
      requirements: [
        { id: 'r8', text: 'Syntax highlighting with Prism/Shiki', done: true },
        { id: 'r9', text: 'Reading time calculation', done: false }
      ],
      aiContext: 'Keep bundle size minimal; avoid heavy server components.',
      createdBy: alexId,
      createdAt: daysAgoIso(6),
      updatedAt: daysAgoIso(1)
    },
    {
      id: 'p1-t5',
      projectId: proj1Id,
      columnId: col1Progress,
      order: 1,
      title: 'Accessible Contact Form with feedback toast',
      description: 'Form with name, email, message and honeypot spam protection.',
      priority: 'high',
      type: 'feature',
      assigneeId: alexId,
      milestoneId: proj1MilestoneUpcoming,
      dueDate: daysFromNow(0),
      labels: ['frontend'],
      notes: 'Drafting form validation logic with aria-describedby.',
      requirements: [
        { id: 'r10', text: 'Email format validation', done: true },
        { id: 'r11', text: 'Success toast announced politely', done: false }
      ],
      aiContext: 'All error messages must be linked to inputs with aria-describedby.',
      createdBy: alexId,
      createdAt: daysAgoIso(5),
      updatedAt: daysAgoIso(1)
    },
    {
      id: 'p1-t6',
      projectId: proj1Id,
      columnId: col1Todo,
      order: 0,
      title: 'SEO meta tags and OpenGraph image generator',
      description: 'Generate dynamic social preview images for projects and essays.',
      priority: 'low',
      type: 'feature',
      assigneeId: null,
      milestoneId: proj1MilestoneUpcoming,
      dueDate: daysFromNow(4),
      labels: ['seo'],
      notes: '',
      requirements: [
        { id: 'r12', text: 'Twitter card and OG tags', done: false },
        { id: 'r13', text: 'Dynamic OG image canvas or @vercel/og', done: false }
      ],
      aiContext: 'Follow schema.org structured data specs.',
      createdBy: alexId,
      createdAt: daysAgoIso(4),
      updatedAt: daysAgoIso(4)
    },
    {
      id: 'p1-t7',
      projectId: proj1Id,
      columnId: col1Todo,
      order: 1,
      title: 'Lighthouse accessibility and performance audit',
      description: 'Verify 100 score across mobile and desktop audits.',
      priority: 'medium',
      type: 'bug',
      assigneeId: alexId,
      milestoneId: proj1MilestoneUpcoming,
      dueDate: daysFromNow(1),
      labels: ['performance'],
      notes: '',
      requirements: [
        { id: 'r14', text: 'Zero contrast violations in dark and light', done: false },
        { id: 'r15', text: 'All images have explicit dimensions and alt text', done: false }
      ],
      aiContext: 'Verify with axe-core.',
      createdBy: alexId,
      createdAt: daysAgoIso(3),
      updatedAt: daysAgoIso(3)
    },
    {
      id: 'p1-t8',
      projectId: proj1Id,
      columnId: col1Todo,
      order: 2,
      title: 'Custom 404 and Error Boundary pages',
      description: 'Polite error screen with link back to homepage.',
      priority: 'low',
      type: 'bug',
      assigneeId: null,
      milestoneId: null,
      dueDate: null,
      labels: ['frontend'],
      notes: '',
      requirements: [],
      aiContext: '',
      createdBy: alexId,
      createdAt: daysAgoIso(2),
      updatedAt: daysAgoIso(2)
    }
  ];

  // 6. Tasks for Project 2 (Habit Tracker - 10 tasks)
  const p2Tasks: Task[] = [
    {
      id: 'p2-t1',
      projectId: proj2Id,
      columnId: col2Done,
      order: 0,
      title: 'Design Habit Database Schema & Migrations',
      description: 'Postgres tables for users, habits, logs, and frequency recurrence.',
      priority: 'high',
      type: 'feature',
      assigneeId: alexId,
      milestoneId: proj2Ms1,
      dueDate: daysFromNow(-18),
      labels: ['api', 'core'],
      notes: 'Schema created with foreign keys and unique constraints.',
      requirements: [
        { id: 'r21', text: 'Habit table with cadence enum', done: true },
        { id: 'r22', text: 'Habit_logs table with date index', done: true }
      ],
      aiContext: 'Use UUID primary keys.',
      createdBy: alexId,
      createdAt: daysAgoIso(22),
      updatedAt: daysAgoIso(18)
    },
    {
      id: 'p2-t2',
      projectId: proj2Id,
      columnId: col2Done,
      order: 1,
      title: 'Implement streak counting algorithm',
      description: 'Calculate current streak and historical longest streak considering grace days.',
      priority: 'high',
      type: 'feature',
      assigneeId: samId,
      milestoneId: proj2Ms1,
      dueDate: daysFromNow(-15),
      labels: ['core'],
      notes: 'Unit tests passing with 100% branch coverage.',
      requirements: [
        { id: 'r23', text: 'Grace day tolerance option', done: true },
        { id: 'r24', text: 'Timezone-aware day boundaries', done: true }
      ],
      aiContext: 'Handle leap years and DST transitions cleanly using date-fns.',
      createdBy: samId,
      createdAt: daysAgoIso(20),
      updatedAt: daysAgoIso(16)
    },
    {
      id: 'p2-t3',
      projectId: proj2Id,
      columnId: col2Done,
      order: 2,
      title: 'Daily Checklist Board UI',
      description: 'Single-tap habit completion list with animated progress bar.',
      priority: 'medium',
      type: 'feature',
      assigneeId: samId,
      milestoneId: proj2Ms1,
      dueDate: daysFromNow(-12),
      labels: ['ui', 'mobile'],
      notes: 'Haptic feedback on tap tested on iOS and Android.',
      requirements: [
        { id: 'r25', text: 'Quick complete button', done: true },
        { id: 'r26', text: 'Sound/haptic toggle', done: true }
      ],
      aiContext: 'Keep interactions responsive (< 16ms frame budget).',
      createdBy: samId,
      createdAt: daysAgoIso(19),
      updatedAt: daysAgoIso(15)
    },
    {
      id: 'p2-t4',
      projectId: proj2Id,
      columnId: col2Review,
      order: 0,
      title: 'Offline SQLite caching and sync queue',
      description: 'Queue habit logs when device is offline, sync when connection resumes.',
      priority: 'high',
      type: 'bug',
      assigneeId: alexId,
      milestoneId: proj2Ms2,
      dueDate: daysFromNow(-1),
      labels: ['core', 'mobile'],
      notes: 'Conflict resolution strategy: latest timestamp wins.',
      requirements: [
        { id: 'r27', text: 'Network status listener', done: true },
        { id: 'r28', text: 'Automatic background sync on reconnect', done: true }
      ],
      aiContext: 'Idempotent sync endpoint.',
      createdBy: alexId,
      createdAt: daysAgoIso(14),
      updatedAt: daysAgoIso(3)
    },
    {
      id: 'p2-t5',
      projectId: proj2Id,
      columnId: col2Progress,
      order: 0,
      title: 'Habit Analytics: 365-Day Activity Heatmap',
      description: 'GitHub-style contribution grid displaying year at a glance.',
      priority: 'medium',
      type: 'feature',
      assigneeId: samId,
      milestoneId: proj2Ms2,
      dueDate: daysFromNow(3),
      labels: ['analytics', 'ui'],
      notes: 'Generating SVG grid. Ensuring high-contrast color palette.',
      requirements: [
        { id: 'r29', text: 'Four intensity levels with text labels', done: true },
        { id: 'r30', text: 'Tooltip on cell hover/focus', done: false }
      ],
      aiContext: 'Accessible to protanopia and deuteranopia.',
      createdBy: samId,
      createdAt: daysAgoIso(10),
      updatedAt: daysAgoIso(1)
    },
    {
      id: 'p2-t6',
      projectId: proj2Id,
      columnId: col2Progress,
      order: 1,
      title: 'Social Friend Feed and High-Fives',
      description: 'View friends completing habits and send celebratory emojis.',
      priority: 'low',
      type: 'feature',
      assigneeId: alexId,
      milestoneId: proj2Ms2,
      dueDate: daysFromNow(0),
      labels: ['ui'],
      notes: 'Websocket connection or short polling for notifications.',
      requirements: [
        { id: 'r31', text: 'Friend activity list', done: true },
        { id: 'r32', text: 'Emoji reaction button', done: false }
      ],
      aiContext: 'Throttle reactions to prevent spam.',
      createdBy: alexId,
      createdAt: daysAgoIso(8),
      updatedAt: daysAgoIso(2)
    },
    {
      id: 'p2-t7',
      projectId: proj2Id,
      columnId: col2Todo,
      order: 0,
      title: 'Scheduled Daily Push Notifications',
      description: 'Personalized reminder at preferred time of day per habit.',
      priority: 'medium',
      type: 'feature',
      assigneeId: samId,
      milestoneId: proj2Ms3,
      dueDate: daysFromNow(6),
      labels: ['mobile'],
      notes: '',
      requirements: [
        { id: 'r33', text: 'Permission request modal', done: false },
        { id: 'r34', text: 'Local notification scheduling', done: false }
      ],
      aiContext: 'Clear explanation before requesting notification permissions.',
      createdBy: samId,
      createdAt: daysAgoIso(6),
      updatedAt: daysAgoIso(6)
    },
    {
      id: 'p2-t8',
      projectId: proj2Id,
      columnId: col2Todo,
      order: 1,
      title: 'Export Habit Data as CSV and JSON',
      description: 'Allow users to export all historical habit check-ins.',
      priority: 'low',
      type: 'feature',
      assigneeId: null,
      milestoneId: proj2Ms3,
      dueDate: null,
      labels: ['core'],
      notes: '',
      requirements: [],
      aiContext: '',
      createdBy: alexId,
      createdAt: daysAgoIso(5),
      updatedAt: daysAgoIso(5)
    },
    {
      id: 'p2-t9',
      projectId: proj2Id,
      columnId: col2Todo,
      order: 2,
      title: 'In-App Purchase / Subscription paywall',
      description: 'Pro tier for unlimited habits and advanced analytics.',
      priority: 'high',
      type: 'feature',
      assigneeId: alexId,
      milestoneId: proj2Ms3,
      dueDate: daysFromNow(8),
      labels: ['core'],
      notes: '',
      requirements: [],
      aiContext: '',
      createdBy: alexId,
      createdAt: daysAgoIso(4),
      updatedAt: daysAgoIso(4)
    },
    {
      id: 'p2-t10',
      projectId: proj2Id,
      columnId: col2Todo,
      order: 3,
      title: 'Dark Mode & Theme Customization',
      description: 'Provide OLED dark mode and colorful accents.',
      priority: 'low',
      type: 'bug',
      assigneeId: samId,
      milestoneId: null,
      dueDate: null,
      labels: ['ui'],
      notes: '',
      requirements: [],
      aiContext: '',
      createdBy: samId,
      createdAt: daysAgoIso(3),
      updatedAt: daysAgoIso(3)
    }
  ];

  // 7. Prompt Entries (5 entries across Project 1 tasks, covering all 3 outcomes)
  const prompts: PromptEntry[] = [
    {
      id: 'prompt-1',
      taskId: 'p1-t1',
      promptText: 'Write a responsive Tailwind CSS hero section with a clean headline, subheadline, and social icon links. Ensure high contrast.',
      resultText: '<section className="py-20 px-4 text-center max-w-4xl mx-auto">\n  <h1 className="text-5xl font-extrabold tracking-tight">Full-Stack Engineer & AI Builder</h1>\n  <p className="mt-4 text-xl text-slate-600 dark:text-slate-300">Crafting robust software with human intent and AI agility.</p>\n</section>',
      model: 'Claude 3.5 Sonnet',
      outcome: 'worked',
      outcomeNotes: 'Generated clean semantic HTML with accessible classes on the first try.',
      createdBy: alexId,
      createdAt: daysAgoIso(13)
    },
    {
      id: 'prompt-2',
      taskId: 'p1-t2',
      promptText: 'Create a React hook for managing light, dark, and system themes using Tailwind dark: class on document.documentElement.',
      resultText: 'export function useTheme() {\n  const [theme, setTheme] = useState("system");\n  // ... syncs with localStorage and prefers-color-scheme\n}',
      model: 'Cursor (auto)',
      outcome: 'worked',
      outcomeNotes: 'Handled OS color scheme changes and stored preference in localStorage.',
      createdBy: alexId,
      createdAt: daysAgoIso(11)
    },
    {
      id: 'prompt-3',
      taskId: 'p1-t3',
      promptText: 'Implement a tag filtering system for project cards that supports multi-select with AND logic and accessible keyboard pills.',
      resultText: '// Filter function using Array.every(tag => project.tags.includes(tag))',
      model: 'GPT-4o',
      outcome: 'partial',
      outcomeNotes: 'Filter logic was correct, but keyboard accessibility required manual fixes for Enter/Space handlers.',
      createdBy: alexId,
      createdAt: daysAgoIso(7)
    },
    {
      id: 'prompt-4',
      taskId: 'p1-t5',
      promptText: 'Generate a server action for contact form submission with Turnstile captcha verification and Resend email delivery.',
      resultText: 'export async function submitContact(formData: FormData) {\n  // missing captcha validation secret environment variable check\n}',
      model: 'Lovable',
      outcome: 'failed',
      outcomeNotes: 'Hallucinated non-existent API options for Resend SDK and failed captcha signature check.',
      createdBy: alexId,
      createdAt: daysAgoIso(4)
    },
    {
      id: 'prompt-5',
      taskId: 'p1-t5',
      promptText: 'Fix the contact form error handling: display inline field errors connected with aria-describedby and announce submission failure via aria-live.',
      resultText: '<div role="status" aria-live="polite">{statusMessage}</div>\n<input aria-describedby={error ? "email-err" : undefined} />',
      model: 'Claude 3.5 Sonnet',
      outcome: 'worked',
      outcomeNotes: 'Followed WCAG 2.1 AA form validation pattern perfectly.',
      createdBy: alexId,
      createdAt: daysAgoIso(3)
    }
  ];

  // 8. Tool Errors (2 for Project 1: one resolved, one active)
  const errors: ToolError[] = [
    {
      id: 'err-1',
      taskId: 'p1-t5',
      tool: 'Lovable',
      errorText: 'TypeError: resend.emails.sendWithTurnstile is not a function at submitContact (actions.ts:18:22)',
      description: 'AI tool assumed a combined captcha + email method that does not exist in the Resend SDK.',
      resolved: true,
      resolution: 'Separated Cloudflare Turnstile token validation via fetch to siteverify, then invoked resend.emails.send() separately.',
      createdBy: alexId,
      createdAt: daysAgoIso(4)
    },
    {
      id: 'err-2',
      taskId: 'p1-t3',
      tool: 'Cursor',
      errorText: 'Hydration failed because the initial UI does not match what was rendered on the server. Expected class "dark" on <html>',
      description: 'SSR rendered without dark mode class while client rendered with dark mode based on localStorage.',
      resolved: false,
      resolution: '',
      createdBy: alexId,
      createdAt: daysAgoIso(2)
    }
  ];

  // 9. Comments (on Project 2 team tasks)
  const comments: Comment[] = [
    {
      id: 'comm-1',
      taskId: 'p2-t2',
      authorId: alexId,
      body: 'Make sure we account for timezone switches when users travel across the dateline! The streak should not break if UTC changes.',
      createdAt: daysAgoIso(19)
    },
    {
      id: 'comm-2',
      taskId: 'p2-t2',
      authorId: samId,
      body: 'Good point @Alex. I added UTC calendar date normalisation in `dateUtils`. All tests passing now!',
      createdAt: daysAgoIso(18)
    },
    {
      id: 'comm-3',
      taskId: 'p2-t4',
      authorId: samId,
      body: 'Testing the SQLite sync on Android emulator with network throttling. Looking very stable.',
      createdAt: daysAgoIso(4)
    }
  ];

  // 10. Activity Events
  const activity: ActivityEvent[] = [
    {
      id: 'act-1',
      taskId: 'p1-t1',
      actorId: alexId,
      type: 'created',
      from: null,
      to: 'Design clean monochrome hero section',
      createdAt: daysAgoIso(14)
    },
    {
      id: 'act-2',
      taskId: 'p1-t1',
      actorId: alexId,
      type: 'moved',
      from: 'Review',
      to: 'Done',
      createdAt: daysAgoIso(10)
    },
    {
      id: 'act-3',
      taskId: 'p1-t2',
      actorId: alexId,
      type: 'moved',
      from: 'In Progress',
      to: 'Done',
      createdAt: daysAgoIso(9)
    },
    {
      id: 'act-4',
      taskId: 'p1-t3',
      actorId: alexId,
      type: 'moved',
      from: 'In Progress',
      to: 'Review',
      createdAt: daysAgoIso(2)
    },
    {
      id: 'act-5',
      taskId: 'p1-t5',
      actorId: alexId,
      type: 'prompt_added',
      from: null,
      to: 'Claude 3.5 Sonnet',
      createdAt: daysAgoIso(3)
    },
    {
      id: 'act-6',
      taskId: 'p1-t5',
      actorId: alexId,
      type: 'error_logged',
      from: null,
      to: 'Lovable',
      createdAt: daysAgoIso(4)
    },
    {
      id: 'act-7',
      taskId: 'p2-t2',
      actorId: samId,
      type: 'moved',
      from: 'Review',
      to: 'Done',
      createdAt: daysAgoIso(16)
    },
    {
      id: 'act-8',
      taskId: 'p2-t4',
      actorId: alexId,
      type: 'moved',
      from: 'In Progress',
      to: 'Review',
      createdAt: daysAgoIso(3)
    }
  ];

  const fullData: AppData = {
    users: [userAlex, userSam],
    teams: [demoTeam],
    projects: [project1, project2],
    tasks: [...p1Tasks, ...p2Tasks],
    milestones,
    prompts,
    errors,
    comments,
    activity
  };

  db.resetData(fullData);
}
