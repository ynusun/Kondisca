export enum UserRole {
  Conditioner = 'conditioner',
  Player = 'player',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export enum MetricInputType {
    Manual = 'manual',
    Calculated = 'calculated',
    Survey = 'survey',
}

export interface Metric {
    id: string;
    name: string;
    unit: string;
    inputType: MetricInputType;
    formula?: string;
    surveyQuestionKey?: string;
    isActive: boolean;
    showInRadar?: boolean;
}

export interface Measurement {
    id: string;
    metricId: string;
    value: number;
    date: string; // ISO string
}

export interface Note {
    id: string;
    playerId: string;
    text: string;
    date: string; // ISO string
    isPublic: boolean;
    authorId: string;
}

export interface Injury {
    id: string;
    description: string;
    estimatedRecovery: string; // e.g. "1 week", "2 months"
    date: string; // ISO string
    recoveryDate?: string; // ISO string
}

export interface Player {
    id: string;
    name: string;
    avatarUrl: string;
    position: string;
    phone?: string;
    email?: string;
    birthDate?: string; // ISO string for date of birth
    measurements: Measurement[];
    notes: Note[];
    dailySurveys: DailySurvey[];
    injury: Injury | null;
    injuryHistory: Injury[];
}

export interface DailySurvey {
    date: string; // ISO string
    sleepHours?: number;
    sleepQuality?: number; // 1-9
    soreness?: number; // 1-9
    painDetails?: string;
    [key: string]: any; // Allows for dynamic questions
}

export interface SurveyQuestion {
    id: string;
    label: string;
    key: string;
    isActive: boolean;
    type: 'number' | 'range' | 'textarea';
}

export interface ScheduleEvent {
    id: string;
    date: string; // YYYY-MM-DD
    time?: string;
    title: string;
    description?: string;
    isTeamEvent: boolean;
    playerIds: string[]; // Empty if isTeamEvent is true
}
// This is a temporary type for merging data for charts
export type CombinedDataPoint = {
    date: string;
    [key: string]: any;
}