# @tiltedlabs/feedback-web

Widget feedback TiltedOS (React ≥ 18). Bouton flottant → capture / images / vidéo → tâche `specs_todo`.

## Install

```bash
pnpm add @tiltedlabs/feedback-web
```

## Usage

```tsx
import { TiltedOSFeedbackProvider } from '@tiltedlabs/feedback-web'

<TiltedOSFeedbackProvider apiKey={import.meta.env.VITE_TILTEDOS_FEEDBACK_KEY}>
  <App />
</TiltedOSFeedbackProvider>
```
