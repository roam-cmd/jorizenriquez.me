import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { AboutSection } from '@/components/sections/AboutSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { ExperienceAndCertificationsSection } from '@/components/sections/ExperienceAndCertificationsSection'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProjectsSection } from '@/components/sections/ProjectsSection'
import { SkillsSection } from '@/components/sections/SkillsSection'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { PortfolioLoader } from '@/components/ui/PortfolioLoader'

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[var(--bg-base)] text-[var(--fg-primary)]">
      <PortfolioLoader />
      <CustomCursor />
      <Navbar />
      <main id="main-content" className="relative z-10 overflow-x-clip">
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <ExperienceAndCertificationsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
