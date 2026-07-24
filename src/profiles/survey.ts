export type SurveyBuilderBlockType =
  | 'single-choice'
  | 'multi-choice'
  | 'open-ended'
  | 'rating'
  | 'nps'
  | 'numerical-input'
  | 'email-input'
  | 'date-picker'
  | 'radio-grid'
  | 'checkbox-grid'
  | 'star-rating'
  | 'star-rating-grid'
  | 'single-image-select'
  | 'multiple-image-select'
  | 'document-upload'
  | 'interactive-ranking'
  | 'content-text'
  | 'content-media'
  | 'scale';

export type QuestionType = SurveyBuilderBlockType;

export type SurveyAudience = 'global' | 'role_specific' | 'public';

export interface SurveyOption {
  text: string;
}

export interface SurveyImageOption {
  label: string;
  image_url: string;
  hidden_label?: string;
}

export interface Question {
  id?: number;
  question_text: string;
  question_type: QuestionType;
  required: boolean;
  sequence_number: number;
  description?: string;
  options?: SurveyOption[];
  image_options?: SurveyImageOption[];
  grid_rows?: SurveyOption[];
  grid_columns?: SurveyOption[];
  scale_points?: string[];
  ranking_items?: SurveyOption[];
  rating_start?: number;
  rating_end?: number;
  rating_step?: number;
  nps_left_label?: string;
  nps_right_label?: string;
  left_label?: string;
  right_label?: string;
  additional_text?: string;
  image_url?: string;
}

export const SURVEY_QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single-choice', label: 'Single Choice' },
  { value: 'multi-choice', label: 'Multiple Choice' },
  { value: 'open-ended', label: 'Open-Ended' },
  { value: 'rating', label: 'Slider' },
  { value: 'nps', label: 'NPS' },
  { value: 'numerical-input', label: 'Numerical Input' },
  { value: 'email-input', label: 'Email Input' },
  { value: 'date-picker', label: 'Date Selection' },
  { value: 'radio-grid', label: 'Grid Question (Radio)' },
  { value: 'checkbox-grid', label: 'Grid Question (Checkbox)' },
  { value: 'star-rating', label: 'Star Rating' },
  { value: 'star-rating-grid', label: 'Star Rating Grid' },
  { value: 'single-image-select', label: 'Single Image Select' },
  { value: 'multiple-image-select', label: 'Multiple Image Select' },
  { value: 'document-upload', label: 'Document Upload' },
  { value: 'interactive-ranking', label: 'Interactive Ranking' },
  { value: 'content-text', label: 'Text Content' },
  { value: 'content-media', label: 'Media Content' },
  { value: 'scale', label: 'Scale (Likert)' },
];

export const SURVEY_AUDIENCE_OPTIONS: Array<{
  value: SurveyAudience;
  label: string;
  description: string;
}> = [
  {
    value: 'global',
    label: 'Global',
    description: 'Visible to all authenticated users.',
  },
  {
    value: 'role_specific',
    label: 'Role Specific',
    description: 'Visible only to selected roles.',
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Accessible without login or registration.',
  },
];

export const createDefaultSurveyQuestion = (
  type: QuestionType,
  sequenceNumber: number
): Question => ({
  question_text: '',
  question_type: type,
  required: false,
  sequence_number: sequenceNumber,
  options:
    type === 'single-choice' || type === 'multi-choice'
      ? [{ text: 'Option 1' }, { text: 'Option 2' }]
      : undefined,
  image_options:
    type === 'single-image-select' || type === 'multiple-image-select'
      ? [
          { label: 'Image option 1', image_url: '', hidden_label: '' },
          { label: 'Image option 2', image_url: '', hidden_label: '' },
        ]
      : undefined,
  grid_rows: type.includes('grid') ? [{ text: 'Row 1' }] : undefined,
  grid_columns:
    type === 'radio-grid' || type === 'checkbox-grid' ? [{ text: 'Column 1' }] : undefined,
  scale_points:
    type === 'scale'
      ? [
          'Not at all satisfied',
          'Slightly satisfied',
          'Moderately satisfied',
          'Very satisfied',
          'Extremely satisfied',
        ]
      : undefined,
  ranking_items:
    type === 'interactive-ranking' ? [{ text: 'Item 1' }, { text: 'Item 2' }] : undefined,
  rating_start: type === 'rating' ? 1 : undefined,
  rating_end: type === 'rating' ? 10 : undefined,
  rating_step: type === 'rating' ? 1 : undefined,
  nps_left_label: type === 'nps' ? 'Not at all likely' : undefined,
  nps_right_label: type === 'nps' ? 'Extremely likely' : undefined,
});

export const resequenceSurveyQuestions = <T extends Question>(questions: T[]): T[] =>
  questions.map((question, index) => ({
    ...question,
    sequence_number: index + 1,
  }));
