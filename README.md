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

### Locale (`fr` | `en`)

Par défaut l’UI est en français. Passe `locale="en"` pour l’anglais :

```tsx
<TiltedOSFeedbackProvider
  apiKey={import.meta.env.VITE_TILTEDOS_FEEDBACK_KEY}
  locale="en"
>
  <App />
</TiltedOSFeedbackProvider>
```

### Niveau de gêne (champ `priority`)

Le widget demande **l’impact pour l’utilisateur** avec quatre niveaux (`Pas trop`, `Pas mal`, `Beaucoup`, `Énormément`).  
Côté API, ces choix sont toujours envoyés dans le champ multipart existant `priority` (`low` | `medium` | `high` | `critical`).

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
