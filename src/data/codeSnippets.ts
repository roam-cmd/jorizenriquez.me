import type {
  CertificationItem,
  ExperienceItem,
  ProjectItem,
  SkillCategory,
} from '@/data/portfolio'

export const navSnippets = {
  brand: `<Brand handle="roam-cmd" />`,
  link: (id: string, label: string) => `<a href="#${id}">${label}</a>`,
  themeSwitcher: `<ThemeSwitcher />`,
  mobileMenu: `<Menu />`,
}

export const heroSnippets = {
  badge: `<Badge status="available" />`,
  heading: `<h1 className="font-display text-6xl text-[var(--fg-primary)]">\n  {siteProfile.displayName}\n</h1>`,
  intro: `<p className="max-w-2xl text-[var(--fg-muted)]">\n  {siteProfile.headline}\n  {siteProfile.tagline}\n</p>`,
  primaryCta: `<a href="#projects">Explore Projects</a>`,
  secondaryCta: `<a href="#contact">Contact Me</a>`,
  socialChip: (label: string) => `<SocialLink label="${label}" />`,
}

export function sectionHeaderCode(
  index: string,
  eyebrow: string,
  title: string
): string {
  return `<SectionHeader\n  index="${index}" eyebrow="${eyebrow}"\n  title="${title}"\n/>`
}

export const aboutSnippets = {
  narrative: `<div className="space-y-5">\n  {aboutData.paragraphs.map((text, i) => (\n    <p key={i}>{text}</p>\n  ))}\n</div>`,
  focusCard: (label: string, detail: string) =>
    `<FocusCard label="${label}">\n  "${detail}"\n</FocusCard>`,
  snapshot: `<aside aria-label="Profile Snapshot">\n  <img src={profilePhoto} alt="Joriz Enriquez" />\n  <dl className="divide-y">\n    {aboutData.snapshot.map(item => <Row {...item} />)}\n  </dl>\n</aside>`,
}

export const skillsSnippets = {
  primaryPillars: `<StackTrio\n  pillars={["FastAPI", "React", "PostgreSQL"]}\n/>`,
  layerFilterPill: (label: string) => `<Tab>${label}</Tab>`,
}

export function buildSkillCategoryCode(category: SkillCategory): string {
  const list = category.skills
    .slice(0, 5)
    .map((skill) => `"${skill}"`)
    .join(', ')
  const suffix = category.skills.length > 5 ? ', ...' : ''
  return `<SkillCategory\n  title="${category.title}"\n  skills={[${list}${suffix}]}\n/>`
}

export const projectsSnippets = {
  controls: `<CarouselNav onPrev={prev} onNext={next} />`,
  progressDots: (total: number) => `<Dots count={${total}} />`,
}

export function buildProjectCardCode(project: ProjectItem): string {
  const stack = project.technologies.map((tech) => `"${tech}"`).join(', ')
  return `<ProjectCard\n  origin="${project.origin}"\n  title="${project.title}"\n  stack={[${stack}]}\n  onInspect={openDetails}\n/>`
}

export const experienceFilterCode = `<FilterGroup options={["All", "Education", "Achievements"]} />`

export function buildExperienceCardCode(entry: ExperienceItem): string {
  return `<TimelineEntry\n  category="${entry.category}"\n  period="${entry.period}"\n  title="${entry.title}"\n  org="${entry.organization}"\n/>`
}

export function buildCertificationCardCode(cert: CertificationItem): string {
  const topics = cert.topics.map((topic) => `"${topic}"`).join(', ')
  return `<CertificationCard\n  title="${cert.title}"\n  issuer="${cert.issuer}"\n  topics={[${topics}]}\n/>`
}

export function buildCertificationTabCode(title: string): string {
  return `<Tab>${title}</Tab>`
}

export const certificationsBookCode = `<PageFlip\n  groups={["Networking & IT", "Security & AI", "Programming & Workshops", "Semiconductor & Electronics"]}\n  totalPages={16}\n/>`

export const contactSnippets = {
  intro: `<div className="space-y-3">\n  <span>{siteProfile.location}</span>\n  <h3>{siteProfile.availability}</h3>\n</div>`,
  emailBtn: `<a href={\`mailto:\${siteProfile.email}\`}>Email Me</a>`,
  directEmail: `<DirectEmail\n  addresses={siteProfile.emails}\n  onCopy={copyEmail}\n/>`,
  socialChip: (label: string) => `<SocialLink label="${label}" />`,
}

export const footerSnippets = {
  brand: `<FooterBrand handle="roam-cmd" />`,
  link: (id: string, label: string) => `<a href="#${id}">${label}</a>`,
  actions: `<SocialActions backToTop="#top" />`,
}
