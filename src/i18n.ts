import type { WebFeedbackPriority } from './priorities'

export type FeedbackLocale = 'fr' | 'en'

export const DEFAULT_FEEDBACK_LOCALE: FeedbackLocale = 'fr'

export interface FeedbackMessages {
  readonly prioritySectionLabel: string
  readonly priorityLow: string
  readonly priorityMedium: string
  readonly priorityHigh: string
  readonly priorityCritical: string
  readonly descriptionLabel: string
  readonly descriptionPlaceholder: string
  readonly capture: string
  readonly captureInProgress: string
  readonly zone: string
  readonly video: string
  readonly videoInProgress: string
  readonly sendFeedback: string
  readonly triggerOpen: string
  readonly triggerClose: string
  readonly triggerDragHint: string
  readonly descriptionMinLength: string
  readonly mediaRequired: string
  readonly submitFailed: string
  readonly captureViewportFailed: string
  readonly mediaRequiredApi: string
  readonly chooseScreenToShare: string
  readonly stopRecording: string
  readonly recordingError: string
  readonly noVideoData: string
  readonly screenShareDenied: string
  readonly recordingStartFailed: string
  readonly captureFailed: string
  readonly captureSelecting: string
  readonly drawRegion: string
  readonly cancel: string
  readonly close: string
  readonly textPlaceholder: string
  readonly annotationToolbar: string
  readonly toolSelect: string
  readonly toolPen: string
  readonly toolRectangle: string
  readonly toolText: string
  readonly colorBlack: string
  readonly colorWhite: string
  readonly colorRed: string
  readonly deleteSelection: string
  readonly save: string
  readonly mediaPreview: string
  readonly closePreview: string
  readonly annotate: string
  readonly remove: string
}

const MESSAGES: Record<FeedbackLocale, FeedbackMessages> = {
  fr: {
    prioritySectionLabel: 'À quel point cela vous impacte-t-il ?',
    priorityLow: 'Pas trop',
    priorityMedium: 'Pas mal',
    priorityHigh: 'Beaucoup',
    priorityCritical: 'Énormément',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Décris le problème ou l’idée…',
    capture: 'Capture',
    captureInProgress: 'Capture…',
    zone: 'Zone',
    video: 'Vidéo',
    videoInProgress: 'En cours…',
    sendFeedback: 'Envoyer le feedback',
    triggerOpen: 'Ouvrir le feedback',
    triggerClose: 'Fermer le feedback',
    triggerDragHint: 'Glisser pour déplacer · Clic pour ouvrir',
    descriptionMinLength: 'La description doit contenir au moins 3 caractères.',
    mediaRequired: 'Ajoute au moins une image ou une vidéo.',
    submitFailed: "Impossible d'envoyer le feedback",
    captureViewportFailed: 'Impossible de capturer la fenêtre',
    mediaRequiredApi: 'Au moins une image ou une vidéo est requise.',
    chooseScreenToShare: 'Choisir l’écran à partager…',
    stopRecording: 'Arrêter',
    recordingError: 'Erreur pendant l’enregistrement.',
    noVideoData: 'Aucune donnée vidéo enregistrée.',
    screenShareDenied: 'Partage d’écran refusé ou annulé.',
    recordingStartFailed: 'Impossible de démarrer l’enregistrement.',
    captureFailed: 'Capture impossible',
    captureSelecting: 'Choisis l’onglet ou l’écran à capturer…',
    drawRegion: 'Dessinez une zone à capturer',
    cancel: 'Annuler',
    close: 'Fermer',
    textPlaceholder: 'Votre texte…',
    annotationToolbar: 'Outils d’annotation',
    toolSelect: 'Sélectionner / déplacer',
    toolPen: 'Trait libre',
    toolRectangle: 'Rectangle',
    toolText: 'Texte',
    colorBlack: 'Noir',
    colorWhite: 'Blanc',
    colorRed: 'Rouge',
    deleteSelection: 'Supprimer la sélection',
    save: 'Enregistrer',
    mediaPreview: 'Aperçu du média',
    closePreview: 'Fermer l’aperçu',
    annotate: 'Annoter',
    remove: 'Retirer',
  },
  en: {
    prioritySectionLabel: 'How disruptive is this for you?',
    priorityLow: 'Not much',
    priorityMedium: 'Somewhat',
    priorityHigh: 'A lot',
    priorityCritical: 'A ton',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Describe the issue or idea…',
    capture: 'Capture',
    captureInProgress: 'Capturing…',
    zone: 'Region',
    video: 'Video',
    videoInProgress: 'Recording…',
    sendFeedback: 'Send feedback',
    triggerOpen: 'Open feedback',
    triggerClose: 'Close feedback',
    triggerDragHint: 'Drag to move · Click to open',
    descriptionMinLength: 'Description must be at least 3 characters.',
    mediaRequired: 'Add at least one image or video.',
    submitFailed: 'Could not send feedback',
    captureViewportFailed: 'Could not capture the window',
    mediaRequiredApi: 'At least one image or video is required.',
    chooseScreenToShare: 'Choose a screen to share…',
    stopRecording: 'Stop',
    recordingError: 'Error while recording.',
    noVideoData: 'No video data recorded.',
    screenShareDenied: 'Screen share denied or cancelled.',
    recordingStartFailed: 'Could not start recording.',
    captureFailed: 'Capture failed',
    captureSelecting: 'Choose a tab or screen to capture…',
    drawRegion: 'Draw a region to capture',
    cancel: 'Cancel',
    close: 'Close',
    textPlaceholder: 'Your text…',
    annotationToolbar: 'Annotation tools',
    toolSelect: 'Select / move',
    toolPen: 'Freehand',
    toolRectangle: 'Rectangle',
    toolText: 'Text',
    colorBlack: 'Black',
    colorWhite: 'White',
    colorRed: 'Red',
    deleteSelection: 'Delete selection',
    save: 'Save',
    mediaPreview: 'Media preview',
    closePreview: 'Close preview',
    annotate: 'Annotate',
    remove: 'Remove',
  },
}

export const resolveFeedbackLocale = (
  locale: FeedbackLocale | undefined,
): FeedbackLocale => (locale === 'en' ? 'en' : DEFAULT_FEEDBACK_LOCALE)

export const getFeedbackMessages = (locale: FeedbackLocale | undefined): FeedbackMessages =>
  MESSAGES[resolveFeedbackLocale(locale)]

export const getPriorityLabel = (
  messages: FeedbackMessages,
  priority: WebFeedbackPriority,
): string => {
  switch (priority) {
    case 'low':
      return messages.priorityLow
    case 'medium':
      return messages.priorityMedium
    case 'high':
      return messages.priorityHigh
    case 'critical':
      return messages.priorityCritical
  }
}

export const getPriorityOptions = (
  messages: FeedbackMessages,
): readonly { readonly value: WebFeedbackPriority; readonly label: string }[] => [
  { value: 'low', label: messages.priorityLow },
  { value: 'medium', label: messages.priorityMedium },
  { value: 'high', label: messages.priorityHigh },
  { value: 'critical', label: messages.priorityCritical },
]
