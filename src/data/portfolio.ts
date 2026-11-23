import { buildMailtoHref } from '@/lib/email'

export interface NavLinkItem {
  id: string
  label: string
  href: string
}

export interface SocialLink {
  label: string
  href: string
  platform: 'github' | 'linkedin' | 'email'
}

export interface SiteProfile {
  brandHandle: string
  displayName: string
  roleTitle: string
  headline: string
  tagline: string
  primaryStack: string[]
  location: string
  availability: string
  email: string
  emails: string[]
  cvUrl: string
  socials: SocialLink[]
}

export interface AboutData {
  paragraphs: string[]
  focusAreas: {
    label: string
    detail: string
  }[]
  snapshot: {
    label: string
    value: string
  }[]
}

export interface SkillCategory {
  id: string
  title: string
  description: string
  skills: string[]
}

export type ProjectOrigin =
  | 'Full-Stack Project'
  | 'Web Project'
  | 'Collaborative Project'
  | 'Desktop Project'
  | 'Mobile Project'

export interface ProjectItem {
  id: string
  title: string
  origin: ProjectOrigin
  period?: string
  tagline: string
  summary: string
  technologies: string[]
  implementation: string
  challenges: string
  outcomes: string
  repoUrl?: string
  demoUrl?: string
  linkNote?: string
  previewVariant: 'editor' | 'topology' | 'grid'
  previewFile: string
  previewCode: string
}

export type TimelineCategory = 'Education' | 'Achievements'

export interface ExperienceItem {
  id: string
  category: TimelineCategory
  period: string
  title: string
  organization: string
  location?: string
  summary: string
  highlights: string[]
}

export interface CertificationItem {
  id: string
  title: string
  issuer: string
  dateOrStatus: string
  credentialId: string
  topics: string[]
  verifyUrl?: string
}

export interface CertificationGroup {
  id: string
  title: string
  subtitle: string
  certificates: CertificationItem[]
}

export const siteProfile: SiteProfile = {
  brandHandle: 'roam-cmd',
  displayName: 'Joriz Enriquez',
  roleTitle: 'Full-Stack Developer — FastAPI · React · PostgreSQL',
  headline:
    'Building reliable full-stack applications, interactive interfaces, and practical software.',
  tagline:
    'Developer based in City of San Fernando, Pampanga, working primarily with FastAPI, React, and PostgreSQL across web, data, and cloud-deployed systems.',
  primaryStack: ['FastAPI', 'React', 'PostgreSQL'],
  location: 'City of San Fernando, Pampanga',
  availability: 'Open to opportunities & collaborations',
  email: 'aaronenriquez2104@gmail.com',
  emails: ['aaronenriquez2104@gmail.com', 'catsoinabox39@gmail.com'],
  cvUrl: '/others/CV.pdf',
  socials: [
    {
      label: 'GitHub',
      href: 'https://github.com/roam-cmd',
      platform: 'github',
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/joriz-aaron-enriquez-1215b43a6/',
      platform: 'linkedin',
    },
    {
      label: 'Email',
      href: buildMailtoHref('aaronenriquez2104@gmail.com'),
      platform: 'email',
    },
  ],
}

export const navLinks: NavLinkItem[] = [
  { id: 'about', label: 'About', href: '#about' },
  { id: 'skills', label: 'Skills', href: '#skills' },
  { id: 'projects', label: 'Projects', href: '#projects' },
  { id: 'certifications', label: 'Certifications', href: '#certifications' },
  { id: 'contact', label: 'Contact', href: '#contact' },
]

export const aboutData: AboutData = {
  paragraphs: [
    'I’m Joriz Enriquez, a software developer based in City of San Fernando, Pampanga. My primary stack centers on FastAPI, React, and PostgreSQL, pairing strongly typed Python backends and relational data models with responsive TypeScript interfaces.',
    'Across full-stack web platforms, data analytics, desktop utilities, and Android apps, I enjoy turning complex workflows into clean, dependable tools that are straightforward to deploy and maintain.',
  ],
  focusAreas: [
    {
      label: 'Full-Stack Engineering',
      detail:
        'FastAPI, Pydantic, SQLModel/SQLAlchemy, and PostgreSQL backends paired with React and TypeScript.',
    },
    {
      label: 'Interactive UI & Graphs',
      detail:
        'Tailwind CSS, TanStack React Query, and React Flow for responsive, data-driven interfaces.',
    },
    {
      label: 'Deployment & Reliability',
      detail:
        'Docker, AWS EC2, GitHub Actions CI/CD, Nginx, and automated health/failover workflows.',
    },
  ],
  snapshot: [
    { label: 'Name', value: 'Joriz Enriquez' },
    { label: 'Location', value: 'City of San Fernando, Pampanga' },
    { label: 'Primary Stack', value: 'FastAPI, React, PostgreSQL' },
    { label: 'GitHub', value: '@roam-cmd' },
  ],
}

export const skillCategories: SkillCategory[] = [
  {
    id: 'languages',
    title: 'Languages',
    description:
      'Core programming, querying, and markup languages used across projects.',
    skills: [
      'TypeScript',
      'JavaScript',
      'Python',
      'C',
      'SQL',
      'HTML5',
      'CSS3',
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend Development',
    description:
      'Component libraries, state fetching, visual graphs, and responsive styling.',
    skills: [
      'React.js',
      'Tailwind CSS',
      'React Query (TanStack)',
      'React Flow',
      'Responsive Design',
    ],
  },
  {
    id: 'backend',
    title: 'Backend Development',
    description:
      'API frameworks, validation, real-time messaging, auth, and automation.',
    skills: [
      'FastAPI',
      'Node.js',
      'Express.js',
      'RESTful APIs',
      'Pydantic',
      'Zod',
      'WebSockets (Socket.IO)',
      'JWT',
      'RBAC',
      'bcrypt',
      'SHA-256',
      'Cron Automation',
    ],
  },
  {
    id: 'databases',
    title: 'Databases & ORM',
    description:
      'Relational and document databases paired with typed ORMs and models.',
    skills: [
      'PostgreSQL',
      'MySQL',
      'Firebase',
      'SQLModel',
      'SQLAlchemy',
      'Drizzle ORM',
    ],
  },
  {
    id: 'cloud',
    title: 'Cloud & DevOps',
    description:
      'Containerization, cloud hosting, CI/CD pipelines, and object storage.',
    skills: [
      'AWS (EC2, IAM)',
      'Docker & Docker Compose',
      'GitHub Actions (CI/CD)',
      'Nginx',
      'Linux/Bash',
      'systemd',
      'Backblaze B2 (S3)',
      'Supabase Storage',
    ],
  },
  {
    id: 'tools',
    title: 'Tools & Testing',
    description:
      'Version control, API inspection, package tooling, and automated test suites.',
    skills: [
      'Git/GitHub',
      'Pytest',
      'Postman',
      'Swagger/OpenAPI',
      'uv',
      'VS Code',
      'Vitest',
      'Playwright (E2E)',
    ],
  },
]

export const projects: ProjectItem[] = [
  {
    id: 'blockbased-hrms',
    title: 'Blockbased HRMS',
    origin: 'Full-Stack Project',
    period: 'March 2026 – Present',
    tagline:
      'Full-stack HR and recruitment platform with immutable audit trails and visual workflows.',
    summary:
      'A full-stack HR and recruitment platform featuring an immutable audit trail for tamper-proof document verification, interactive visual graphs using React Flow, and automated multi-cloud disaster recovery failover.',
    technologies: [
      'React',
      'TypeScript',
      'FastAPI',
      'PostgreSQL',
      'React Flow',
      'SHA-256',
    ],
    implementation:
      'Built around a FastAPI and PostgreSQL backend with SHA-256 hash chaining for tamper-evident document audit records, paired with a React Flow visual interface for inspecting recruitment and verification graphs.',
    challenges:
      'Placeholder case-study note: Expand with specific architectural trade-offs around multi-cloud disaster recovery failover and audit verification.',
    outcomes:
      'Deployed live at blockbased-hrms.beulahlabs.com with ongoing full-stack development.',
    demoUrl: 'https://blockbased-hrms.beulahlabs.com/',
    previewVariant: 'topology',
    previewFile: 'AuditFlow.tsx',
    previewCode: `// Immutable verification flow
<ReactFlow nodes={nodes}>
  <AuditNode id="sha256" ok />
  <FailoverEdge to="cloud-dr" />
</ReactFlow>`,
  },
  {
    id: 'assay-coin',
    title: 'Assay Coin',
    origin: 'Full-Stack Project',
    period: 'October 2026 – Present',
    tagline:
      'Full-stack personal finance simulator with a procedural 9×9 city board.',
    summary:
      'A full-stack personal finance simulator featuring a procedural 9×9 city board, asymmetric financial personas, educational event breakdowns, and automated CI/CD deployment on AWS EC2.',
    technologies: [
      'React',
      'TypeScript',
      'FastAPI',
      'PostgreSQL',
      'AWS EC2',
      'GitHub Actions',
    ],
    implementation:
      'Combines procedural 9×9 board generation, persona-driven simulation rules, and educational financial event breakdowns backed by FastAPI, PostgreSQL, and automated AWS EC2 CI/CD pipelines.',
    challenges:
      'Placeholder case-study note: Expand with details on balancing asymmetric financial personas and procedural board pacing.',
    outcomes:
      'Currently in active development; public repository or live URL will be linked once available.',
    linkNote: 'Link coming soon',
    previewVariant: 'grid',
    previewFile: 'board_sim.py',
    previewCode: `# Procedural 9x9 city board
def build_city(seed: int, role: str):
  grid = gen_grid(9, 9, seed)
  return apply_persona(grid, role)`,
  },
  {
    id: 'trimclick',
    title: 'TrimClick',
    origin: 'Web Project',
    period: 'March 2025',
    tagline:
      'Barbershop appointment scheduling system with loyalty discount support.',
    summary:
      'A website system designed to schedule barbershop appointments, featuring separate user and admin views alongside a loyalty discount feature.',
    technologies: ['HTML5', 'CSS3', 'Appointment Scheduling'],
    implementation:
      'Structured into dedicated user-facing booking pages and administrative management views to handle appointment scheduling and loyalty discount tracking.',
    challenges:
      'Placeholder case-study note: Expand with specific scheduling flow or UI layout challenges.',
    outcomes:
      'Completed in March 2025 with source code available on GitHub.',
    repoUrl: 'https://github.com/roam-cmd/Barber-Website-V2',
    previewVariant: 'editor',
    previewFile: 'booking.html',
    previewCode: `<!-- Appointment slot picker -->
<section class="booking-card">
  <span class="vip">Loyalty -15%</span>
  <button slot="10:30">10:30</button>
</section>`,
  },
  {
    id: 'diabetes-analytics',
    title: 'Diabetes Clinical Analytics',
    origin: 'Collaborative Project',
    period: 'Academic Project',
    tagline:
      'Star-schema data modeling and Power BI dashboard over 100,000 clinical records.',
    summary:
      'Collaborative data analytics project preprocessing a 100,000-record clinical diabetes dataset using the CLEAN framework, structured into dimensional tables (age, health, location, race) and visualized in Power BI.',
    technologies: ['Power BI', 'Excel', 'Data Modeling', 'Star Schema'],
    implementation:
      'Applied the CLEAN preprocessing workflow in Excel to normalize demographic and clinical markers into dimension CSVs feeding a Power BI star-schema model and interactive report.',
    challenges:
      'Placeholder case-study note: Expand with specific data-cleaning anomalies or DAX modeling trade-offs.',
    outcomes:
      'Delivered a cleaned 100k-row dataset, relational data model diagram, and Power BI dashboard.',
    repoUrl: 'https://github.com/roam-cmd/Analytics-Project',
    previewVariant: 'grid',
    previewFile: 'measures.dax',
    previewCode: `-- Star-schema clinical prevalence
VAR Total = COUNTROWS(FactClinical)
VAR Cases = CALCULATE(Total, Dx = 1)
RETURN DIVIDE(Cases, Total, 0)`,
  },
  {
    id: 'chronolist',
    title: 'Chronolist',
    origin: 'Desktop Project',
    period: 'December 2024',
    tagline:
      'Python Tkinter desktop app for diaries, tasks, and event scheduling.',
    summary:
      'A desktop application developed with Python Tkinter to record diary entries, organize tasks, and schedule events in one interface.',
    technologies: ['Python', 'Tkinter', 'Desktop UI'],
    implementation:
      'Modularized across dedicated UI widgets, styling definitions, logic functions, and core system handlers in Python Tkinter.',
    challenges:
      'Placeholder case-study note: Expand with custom Tkinter widget layout or state-handling notes.',
    outcomes:
      'Completed in December 2024 with full Python source hosted on GitHub.',
    repoUrl: 'https://github.com/roam-cmd/Chronolist_TK',
    previewVariant: 'editor',
    previewFile: 'app.py',
    previewCode: `# Tkinter workspace layout
class Chronolist(tk.Tk):
  def __init__(self):
    self.tasks = TaskPane(self)
    self.diary = DiaryView(self)`,
  },
  {
    id: 'word-companion',
    title: 'Word Companion App',
    origin: 'Mobile Project',
    period: 'December 2024',
    tagline:
      'Android vocabulary app for scrolling through and learning new words.',
    summary:
      'An Android application developed in Java using Android Studio that lets users scroll through and learn new vocabulary words.',
    technologies: ['Java', 'Android Studio', 'Gradle'],
    implementation:
      'Built as a native Android project in Java with Gradle Kotlin DSL configuration for browsing and reviewing vocabulary entries.',
    challenges:
      'Placeholder case-study note: Expand with Android layout or list scrolling implementation details.',
    outcomes:
      'Completed in December 2024 with source code available on GitHub.',
    repoUrl: 'https://github.com/roam-cmd/Word_Companion_App',
    previewVariant: 'topology',
    previewFile: 'VocabAdapter.java',
    previewCode: `// Bind scrollable vocabulary card
void bindCard(Holder vh, int i) {
  WordEntry item = words.get(i);
  vh.term.setText(item.getWord());
  vh.hint.setText(item.getMeaning());
}`,
  },
]

export const experienceItems: ExperienceItem[] = [
  {
    id: 'cca-bscs',
    category: 'Education',
    period: 'Expected June 2027',
    title: 'Bachelor of Science in Computer Science',
    organization: 'City College of Angeles',
    location: 'Angeles City, Pampanga',
    summary:
      'Undergraduate Computer Science student with consistent academic distinction (Dean’s List 2023 – 2026).',
    highlights: [
      'Relevant Coursework: Algorithms, Web Development, Object-Oriented Programming, Networking, Android Development, Data Analytics',
    ],
  },
  {
    id: 'cloudstaff-ai-hackathon-2026',
    category: 'Achievements',
    period: '2026',
    title: 'Participant, AI Hackathon',
    organization: 'Cloudstaff',
    summary: 'Competed as a participant in the Cloudstaff AI Hackathon.',
    highlights: [],
  },
  {
    id: 'codejam-sfd-cca-2024',
    category: 'Achievements',
    period: '2024',
    title: '1st Place, CodeJam',
    organization: 'Software Freedom Day at CCA',
    summary:
      'Earned 1st Place in CodeJam during Software Freedom Day at City College of Angeles.',
    highlights: [],
  },
]

export const certificationGroups: CertificationGroup[] = [
  {
    id: 'networking-it',
    title: 'Networking & IT',
    subtitle:
      'Cisco Networking Academy coursework spanning enterprise networking, routing, switching, and IT systems.',
    certificates: [
      {
        id: 'ccna-enterprise-networking',
        title: 'CCNA: Enterprise Networking, Security, and Automation',
        issuer: 'Cisco Networking Academy · City College of Angeles',
        dateOrStatus: 'June 2026',
        credentialId: 'ID: 6ca12805-6b75-49fc-9efd-d166f345b185',
        topics: ['Enterprise Networking', 'Network Security', 'Automation'],
        verifyUrl:
          '/certificates/ccna-enterprise-networking-security-automation.pdf',
      },
      {
        id: 'ccna-switching-routing',
        title: 'CCNA: Switching, Routing, and Wireless Essentials',
        issuer: 'Cisco Networking Academy · City College of Angeles',
        dateOrStatus: 'February 2026',
        credentialId: 'ID: 7cf22206-452d-4a22-a8d6-9e245e0d001b',
        topics: ['Switching', 'Routing', 'Wireless Networking'],
        verifyUrl:
          '/certificates/ccna-switching-routing-wireless-essentials.pdf',
      },
      {
        id: 'ccna-intro-networks',
        title: 'CCNAv7: Introduction to Networks',
        issuer: 'Cisco Networking Academy',
        dateOrStatus: 'January 2025',
        credentialId: 'ID: 531db583-b970-4fbc-8ea5-b85eb411f520',
        topics: ['Networking', 'TCP/IP', 'CCNAv7'],
        verifyUrl: '/certificates/ccna-introduction-to-networks.pdf',
      },
      {
        id: 'cisco-it-essentials',
        title: 'IT Essentials: PC Hardware and Software',
        issuer: 'Cisco Networking Academy',
        dateOrStatus: 'January 2024',
        credentialId: 'ID: f597ec21-c230-4f06-9a9a-222422f48539',
        topics: ['PC Hardware', 'Operating Systems', 'Troubleshooting'],
        verifyUrl: '/certificates/cisco-it-essentials.pdf',
      },
    ],
  },
  {
    id: 'security-ai',
    title: 'Security & AI',
    subtitle:
      'Responsible AI literacy, open-source intelligence (OSINT), and cybersecurity fundamentals.',
    certificates: [
      {
        id: 'mapua-ai-literacy',
        title: 'Introduction to AI Literacy and Responsible Use',
        issuer: 'Mapúa University · CHED ACHIEVE',
        dateOrStatus: 'September 2026',
        credentialId: 'ID: OPEGM4VDMMOZG',
        topics: ['AI Literacy', 'Responsible AI', 'Micro-Credential'],
        verifyUrl: '/certificates/mapua-ai-literacy-responsible-use.pdf',
      },
      {
        id: 'basel-osint',
        title: 'Open-Source Intelligence',
        issuer: 'Basel Institute on Governance',
        dateOrStatus: 'November 2025',
        credentialId: 'Certificate of Completion',
        topics: ['OSINT', 'Investigation', 'eLearning'],
        verifyUrl: '/certificates/basel-open-source-intelligence.pdf',
      },
      {
        id: 'linux-foundation-lfc108',
        title: 'Cybersecurity Essentials (LFC108)',
        issuer: 'The Linux Foundation',
        dateOrStatus: 'October 2025',
        credentialId: 'ID: LF-8judy94zfr',
        topics: ['Cybersecurity', 'LFC108', 'Security Fundamentals'],
        verifyUrl:
          '/certificates/linux-foundation-cybersecurity-essentials.pdf',
      },
    ],
  },
  {
    id: 'programming-workshops',
    title: 'Programming & Workshops',
    subtitle:
      'Hands-on builder workshops and core programming credentials.',
    certificates: [
      {
        id: 'base-ph-workshop',
        title: 'Based Build IRL Workshop',
        issuer: 'Base Philippines · DEVCON Pampanga',
        dateOrStatus: 'October 2025',
        credentialId: 'Certificate of Participation',
        topics: ['On-Chain Builders', 'Workshop', 'Base PH'],
        verifyUrl: '/certificates/base-ph-based-build-irl-workshop.jpg',
      },
      {
        id: 'kaggle-python',
        title: 'Python',
        issuer: 'Kaggle Learn',
        dateOrStatus: 'June 2024',
        credentialId: 'Certificate of Completion',
        topics: ['Python', 'Programming', 'Kaggle'],
        verifyUrl: '/certificates/kaggle-python.png',
      },
    ],
  },
  {
    id: 'semiconductor-electronics',
    title: 'Semiconductor & Electronics',
    subtitle:
      'UPOU ASCEND micro-credentials covering semiconductor manufacturing, materials physics, and industrial electronics.',
    certificates: [
      {
        id: 'upou-semiconductor-manufacturing',
        title: 'Introduction to Semiconductor Manufacturing',
        issuer: 'University of the Philippines Open University (UPOU)',
        dateOrStatus: 'August 2026',
        credentialId: 'ID: 271d5293-4f4d-4604-b6bb-f01f982e2a80',
        topics: ['Semiconductors', 'ASCEND', '16 Hours'],
        verifyUrl: '/certificates/upou-semiconductor-manufacturing.pdf',
      },
      {
        id: 'upou-semiconductor-materials-physics',
        title: 'Semiconductor Materials Physics (Foundation)',
        issuer: 'University of the Philippines Open University (UPOU)',
        dateOrStatus: 'August 2026',
        credentialId: 'ID: 10a138ba-6ecd-42d9-9a88-c75a8aee59eb',
        topics: ['Materials Physics', 'Semiconductors', '16 Hours'],
        verifyUrl: '/certificates/upou-semiconductor-materials-physics.pdf',
      },
      {
        id: 'upou-industrial-electronics-semiconductor',
        title:
          'Industrial Electronics for Semiconductor Manufacturing (Foundation)',
        issuer: 'University of the Philippines Open University (UPOU)',
        dateOrStatus: 'August 2026',
        credentialId: 'ID: 14ef39a2-25d8-4239-8b13-68b01dc68c74',
        topics: ['Industrial Electronics', 'Semiconductors', '16 Hours'],
        verifyUrl:
          '/certificates/upou-industrial-electronics-semiconductor.pdf',
      },
    ],
  },
]

export const certifications: CertificationItem[] = certificationGroups.flatMap(
  (group) => group.certificates
)
