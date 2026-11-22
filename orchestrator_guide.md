# Prompt: Create a Portfolio Website Baseline



## 1. Design Direction
- Create a modern, professional, and visually distinctive portfolio.
- Avoid generic template-like layouts and excessive decorative elements.
- Establish a consistent design system for typography, colors, spacing, borders, and component styling.
- Prioritize visual hierarchy, whitespace, readability, and balanced composition.


## 2. Website Structure
Create the initial website using the following sections:

- **Navigation Bar** — Logo or name placeholder, navigation links, and a responsive mobile navigation.
- **Hero Section** — Name placeholder, professional introduction, short description, and call-to-action buttons.
- **About Section** — A placeholder for personal background, interests, professional goals, and development journey.
- **Skills Section** — Organized placeholder categories for programming languages, frameworks, tools, and technologies.
- **Projects Section** — Reusable project cards containing placeholders for project titles, descriptions, technologies, images, and links.
- **Experience or Education Section** — A flexible section for education, certifications, experience, or other relevant background.
- **Certifications** 
- **Contact Section** — Placeholder contact information, email link, and social links.
- **Footer** — Copyright, social links, and basic navigation.

## 3. Component Architecture
- Organize the website into logical, reusable components.
- Separate major page sections into individual components when appropriate.
- Keep the component structure simple and easy to understand.
- Avoid creating unnecessary components for trivial elements.
- Keep content and layout reasonably separated to make future edits easier.

## 4. Responsive Design
- Implement a mobile-first or responsive design approach.
- Ensure layouts adapt properly to mobile, tablet, laptop, and desktop screens.
- Prevent horizontal overflow, broken layouts, and improperly scaled typography.
- Ensure navigation, cards, buttons, and spacing remain usable across screen sizes.

## 5. Functionality
- Implement functional navigation between sections.
- Ensure buttons and links have appropriate destinations or placeholder behavior.
- Add a functional mobile navigation menu.
- Implement basic hover, focus, and interaction states.
- Do not create fake functionality or buttons that do nothing.

## 6. Code Quality
- Use clean, readable, and maintainable code.
- Follow the conventions of the selected framework and project.
- Use semantic HTML and accessible design practices.
- Avoid unnecessary dependencies.
- Use placeholder content wherever personal information is unavailable.
- Do not invent personal achievements, professional experience, or project details.

## 7. Design Direction and Color Pallete

### COLOR PALLETE
- #2C3333
- #395B64
- #A5C9CA
- #E7F6F2
- Use Black color if needed for general base color.

### DESIGN DIRECTION
Implement a dynamic **code-to-interface reveal animation** throughout the portfolio website. As the user scrolls through each section, the corresponding component should briefly appear as raw source code (HTML, React/TypeScript, or Tailwind CSS), then smoothly transition into its fully rendered UI.

The transition should create the illusion that the website is being coded and compiled in real time, with the raw code materializing into the actual component.

#### Behavior
- Each major section or component should have its own code-to-UI reveal sequence.
- As a component enters the viewport, briefly display its raw source code in a visually styled code-editor-like presentation.
- After a short delay, animate the code into the fully rendered component using a smooth transition, such as fading, morphing, assembling, or progressively materializing.
- Trigger the effect when the user scrolls down to a section and repeat the reverse experience when scrolling back up, if appropriate.
- Ensure the effect is synchronized with the scroll position and feels intentional rather than random.
- Avoid replaying the animation excessively or making navigation frustrating.

#### Visual Direction
- The raw code should look like actual code, not random decorative text.
- Use syntax highlighting, a monospace font, and subtle editor-inspired styling.
- Keep the transition smooth, modern, and visually interesting without becoming distracting.
- The final rendered component should remain readable and usable.

#### Performance & Usability
- Keep animations lightweight and optimized.
- Avoid unnecessary rendering, layout shifts, or excessive scroll-triggered effects.
- Respect reduced-motion accessibility preferences.
- Ensure the effect works on desktop and mobile devices.

The overall experience should feel as though the portfolio's source code is briefly exposed before the interface is compiled and brought to life, reinforcing the theme of software development throughout the website.

#### Background Design
- Utilize Kokonut UI backgrounds (npx shadcn@latest init). Align them with the color pallete.