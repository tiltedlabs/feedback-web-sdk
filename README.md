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

### Contexte utilisateur (user id, email, …)

`context` injecte des paires clé/valeur dans la description de la tâche TiltedOS (bloc **Contexte**), sans les afficher dans le champ saisi :

```tsx
<TiltedOSFeedbackProvider
  apiKey={import.meta.env.VITE_TILTEDOS_FEEDBACK_KEY}
  context={() => ({
    'User ID': session.user.id,
    Email: session.user.email ?? '',
  })}
>
  <App />
</TiltedOSFeedbackProvider>
```
