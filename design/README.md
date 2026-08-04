# GymTok — Splash Screen Design

Premium mobile splash screen for **GymTok**, a fitness social media application.

## Assets

| File | Description |
|------|-------------|
| `assets/gymtok-splash-mockup.png` | High-resolution iPhone mockup (App Store ready) |
| `assets/gym-background-blur.jpg` | Cinematic blurred gym background |
| `design/splash-screen.html` | Interactive HTML/CSS implementation |

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| GymTok Red | `#E63946` | Primary CTA, accent highlights |
| Matte Black | `#0A0A0A` | Base background |
| Surface Overlay | `rgba(10, 10, 10, 0.72)` | Background scrim |
| Text Primary | `#FFFFFF` | Headlines, buttons |
| Text Secondary | `rgba(255, 255, 255, 0.72)` | Tagline |
| Text Muted | `rgba(255, 255, 255, 0.48)` | Feature labels, links |
| Border Subtle | `rgba(255, 255, 255, 0.18)` | Outlined buttons |
| Corner Radius (buttons) | `16px` | Primary/secondary CTAs |
| Corner Radius (monogram) | `18px` | GT logo container |
| Typography | Inter / SF Pro | Headlines, body, labels |

## Layout Hierarchy

1. **Status bar** — iOS 9:41, Dynamic Island, signal/Wi‑Fi/battery
2. **Brand block** — GT monogram → GymTok wordmark → "Train. Share. Inspire."
3. **Primary CTA** — Get Started (filled red)
4. **Secondary CTA** — Log In (outlined)
5. **Tertiary action** — Sign Up link
6. **Feature icons** — Upload, Workouts, Community, Progress

## Preview

Open the interactive mockup:

```bash
open design/splash-screen.html
```

## Guidelines Applied

- **Apple HIG** — Safe areas, 44pt+ touch targets, Dynamic Island spacing, home indicator
- **Material Design 3** — Clear visual hierarchy, accessible contrast, rounded surfaces
- **Accessibility** — Semantic landmarks, aria labels, reduced-motion support
