import { supabase, supabaseAdmin } from '../lib/supabase';
import { User, UserRole, Player, Metric, MetricInputType, Measurement, ScheduleEvent, Note, DailySurvey, Injury, SurveyQuestion } from '../types';

// Helper function to convert database rows to app types
const convertUser = (row: any): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role as UserRole,
  avatarUrl: row.avatar_url,
});

const convertPlayer = (row: any): Player => ({
  id: row.id,
  name: row.name,
  avatarUrl: row.avatar_url,
  position: row.position,
  phone: row.phone,
  email: row.email,
  birthDate: row.birth_date,
  measurements: [], // Will be loaded separately
  notes: [], // Will be loaded separately
  dailySurveys: [], // Will be loaded separately
  injury: null, // Will be loaded separately
  injuryHistory: [], // Will be loaded separately
});

const convertMetric = (row: any): Metric => ({
  id: row.id,
  name: row.name,
  unit: row.unit,
  inputType: row.input_type as MetricInputType,
  formula: row.formula,
  surveyQuestionKey: row.survey_question_key,
  isActive: row.is_active,
  showInRadar: row.show_in_radar,
});

const convertMeasurement = (row: any): Measurement => ({
  id: row.id,
  metricId: row.metric_id,
  value: row.value,
  date: row.date,
});

const convertNote = (row: any): Note => ({
  id: row.id,
  playerId: row.player_id,
  text: row.text,
  date: row.date,
  isPublic: row.is_public,
  authorId: row.author_id,
});

const convertInjury = (row: any): Injury => ({
  id: row.id,
  description: row.description,
  estimatedRecovery: row.estimated_recovery,
  date: row.date,
  recoveryDate: row.recovery_date,
});

const convertDailySurvey = (row: any): DailySurvey => ({
  date: row.date,
  sleepHours: row.sleep_hours,
  sleepQuality: row.sleep_quality,
  soreness: row.soreness,
  painDetails: row.pain_details,
  ...row.survey_data,
});

const convertSurveyQuestion = (row: any): SurveyQuestion => ({
  id: row.id,
  label: row.label,
  key: row.key,
  isActive: row.is_active,
  type: row.type,
});

const convertScheduleEvent = (row: any): ScheduleEvent => ({
  id: row.id,
  date: row.date,
  time: row.time,
  title: row.title,
  description: row.description,
  isTeamEvent: row.is_team_event,
  playerIds: row.player_ids,
});

export const supabaseApi = {
  // Authentication
  login: async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return convertUser(profile);
  },

  // Players
  getPlayers: async (): Promise<Player[]> => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');

    if (error) throw error;
    return data.map(convertPlayer);
  },

  getPlayerDetails: async (id: string): Promise<Player | undefined> => {
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();

    if (playerError || !player) return undefined;

    // Load related data
    const [measurementsResult, notesResult, surveysResult, injuriesResult] = await Promise.all([
      supabase.from('measurements').select('*').eq('player_id', id).order('date'),
      supabase.from('notes').select('*').eq('player_id', id).order('date', { ascending: false }),
      supabase.from('daily_surveys').select('*').eq('player_id', id).order('date', { ascending: false }),
      supabase.from('injuries').select('*').eq('player_id', id).order('date', { ascending: false }),
    ]);

    const playerData = convertPlayer(player);
    playerData.measurements = measurementsResult.data?.map(convertMeasurement) || [];
    playerData.notes = notesResult.data?.map(convertNote) || [];
    playerData.dailySurveys = surveysResult.data?.map(convertDailySurvey) || [];
    
    const injuries = injuriesResult.data?.map(convertInjury) || [];
    playerData.injuryHistory = injuries;
    playerData.injury = injuries.find(i => !i.recoveryDate) || null;

    return playerData;
  },

  addPlayer: async (playerData: Omit<Player, 'id' | 'avatarUrl' | 'measurements' | 'notes' | 'dailySurveys' | 'injury' | 'injuryHistory'>): Promise<Player> => {
    // Service role key kontrolü
    if (!supabaseAdmin) {
      throw new Error('Service role key not configured. Cannot create user accounts.');
    }

    // Önce oyuncu için giriş bilgileri oluştur
    const playerEmail = playerData.email || `${playerData.name.toLowerCase().replace(/\s+/g, '.')}@kondisca.com`;
    const playerPassword = `Player${Date.now().toString().slice(-6)}!`;
    
    // Supabase Auth ile kullanıcı oluştur (admin client kullanarak)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: playerEmail,
      password: playerPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    // Oyuncu profilini oluştur
    const { data, error } = await supabase
      .from('players')
      .insert({
        name: playerData.name,
        position: playerData.position,
        phone: playerData.phone,
        email: playerEmail,
        birth_date: playerData.birthDate,
        avatar_url: `https://picsum.photos/seed/${Date.now()}/200/200`,
      })
      .select()
      .single();

    if (error) throw error;

    // Users tablosuna da ekle
    await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name: playerData.name,
        email: playerEmail,
        role: 'player',
        avatar_url: `https://picsum.photos/seed/${Date.now()}/200/200`,
      });

    // Oyuncu bilgilerini döndür (şifre bilgisi ile birlikte)
    const player = convertPlayer(data);
    return {
      ...player,
      // Geçici olarak şifre bilgisini ekle (sadece oluşturma sırasında)
      tempPassword: playerPassword,
    } as Player & { tempPassword: string };
  },

  updatePlayerInfo: async (playerId: string, updates: Partial<Player>): Promise<Player> => {
    const { data, error } = await supabase
      .from('players')
      .update({
        name: updates.name,
        position: updates.position,
        phone: updates.phone,
        email: updates.email,
        birth_date: updates.birthDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playerId)
      .select()
      .single();

    if (error) throw error;
    return convertPlayer(data);
  },

  deletePlayer: async (playerId: string): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) throw error;
    return { success: true };
  },

  // Metrics
  getMetrics: async (): Promise<Metric[]> => {
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .order('name');

    if (error) throw error;
    return data.map(convertMetric);
  },

  addMetric: async (metric: Omit<Metric, 'id'>): Promise<Metric> => {
    const { data, error } = await supabase
      .from('metrics')
      .insert({
        name: metric.name,
        unit: metric.unit,
        input_type: metric.inputType,
        formula: metric.formula,
        survey_question_key: metric.surveyQuestionKey,
        is_active: metric.isActive,
        show_in_radar: metric.showInRadar || false,
      })
      .select()
      .single();

    if (error) throw error;
    return convertMetric(data);
  },

  updateMetric: async (metricId: string, updates: Partial<Metric>): Promise<Metric> => {
    const { data, error } = await supabase
      .from('metrics')
      .update({
        name: updates.name,
        unit: updates.unit,
        input_type: updates.inputType,
        formula: updates.formula,
        survey_question_key: updates.surveyQuestionKey,
        is_active: updates.isActive,
        show_in_radar: updates.showInRadar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', metricId)
      .select()
      .single();

    if (error) throw error;
    return convertMetric(data);
  },

  deleteMetric: async (metricId: string): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from('metrics')
      .delete()
      .eq('id', metricId);

    if (error) throw error;
    return { success: true };
  },

  // Measurements
  addMultipleMeasurements: async (playerId: string, measurements: Omit<Measurement, 'id'>[]): Promise<Player> => {
    const { error } = await supabase
      .from('measurements')
      .insert(measurements.map(m => ({
        player_id: playerId,
        metric_id: m.metricId,
        value: m.value,
        date: m.date,
      })));

    if (error) throw error;
    return await supabaseApi.getPlayerDetails(playerId) as Player;
  },

  updateMeasurement: async (playerId: string, measurementId: string, updates: Partial<Measurement>): Promise<Measurement> => {
    const { data, error } = await supabase
      .from('measurements')
      .update({
        metric_id: updates.metricId,
        value: updates.value,
        date: updates.date,
      })
      .eq('id', measurementId)
      .select()
      .single();

    if (error) throw error;
    return convertMeasurement(data);
  },

  deleteMeasurement: async (playerId: string, measurementId: string): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from('measurements')
      .delete()
      .eq('id', measurementId);

    if (error) throw error;
    return { success: true };
  },

  // Daily Surveys
  submitDailySurvey: async (playerId: string, surveyData: { [key: string]: any }): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from('daily_surveys')
      .upsert({
        player_id: playerId,
        date: new Date().toISOString().split('T')[0],
        sleep_hours: surveyData.sleepHours,
        sleep_quality: surveyData.sleepQuality,
        soreness: surveyData.soreness,
        pain_details: surveyData.painDetails,
        survey_data: surveyData,
      }, {
        onConflict: 'player_id,date'
      });

    if (error) throw error;
    return { success: true };
  },

  // Schedule Events
  getScheduleEvents: async (): Promise<ScheduleEvent[]> => {
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .order('date');

    if (error) throw error;
    return data.map(convertScheduleEvent);
  },

  addScheduleEvent: async (event: Omit<ScheduleEvent, 'id'>): Promise<ScheduleEvent> => {
    const { data, error } = await supabase
      .from('schedule_events')
      .insert({
        date: event.date,
        time: event.time,
        title: event.title,
        description: event.description,
        is_team_event: event.isTeamEvent,
        player_ids: event.playerIds,
      })
      .select()
      .single();

    if (error) throw error;
    return convertScheduleEvent(data);
  },

  updateScheduleEvent: async (eventId: string, updates: Partial<ScheduleEvent>): Promise<ScheduleEvent> => {
    const { data, error } = await supabase
      .from('schedule_events')
      .update({
        date: updates.date,
        time: updates.time,
        title: updates.title,
        description: updates.description,
        is_team_event: updates.isTeamEvent,
        player_ids: updates.playerIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return convertScheduleEvent(data);
  },

  deleteScheduleEvent: async (eventId: string): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from('schedule_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
    return { success: true };
  },

  // Injuries
  updateInjuryStatus: async (playerId: string, newInjuryData: Omit<Injury, 'id' | 'recoveryDate'> | null): Promise<Player> => {
    // First, close any active injury
    await supabase
      .from('injuries')
      .update({ 
        is_active: false,
        recovery_date: new Date().toISOString()
      })
      .eq('player_id', playerId)
      .eq('is_active', true);

    // Add new injury if provided
    if (newInjuryData) {
      const { error } = await supabase
        .from('injuries')
        .insert({
          player_id: playerId,
          description: newInjuryData.description,
          estimated_recovery: newInjuryData.estimatedRecovery,
          date: newInjuryData.date,
          is_active: true,
        });

      if (error) throw error;
    }

    return await supabaseApi.getPlayerDetails(playerId) as Player;
  },

  updateInjuryHistory: async (playerId: string, injuryId: string, updates: Partial<Injury>): Promise<Player> => {
    const { error } = await supabase
      .from('injuries')
      .update({
        description: updates.description,
        estimated_recovery: updates.estimatedRecovery,
        date: updates.date,
        recovery_date: updates.recoveryDate,
      })
      .eq('id', injuryId)
      .eq('player_id', playerId);

    if (error) throw error;
    return await supabaseApi.getPlayerDetails(playerId) as Player;
  },

  deleteInjuryHistory: async (playerId: string, injuryId: string): Promise<Player> => {
    const { error } = await supabase
      .from('injuries')
      .delete()
      .eq('id', injuryId)
      .eq('player_id', playerId);

    if (error) throw error;
    return await supabaseApi.getPlayerDetails(playerId) as Player;
  },

  // Notes
  addPlayerNote: async (playerId: string, noteData: Omit<Note, 'id' | 'playerId'>): Promise<Note> => {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        player_id: playerId,
        text: noteData.text,
        date: noteData.date,
        is_public: noteData.isPublic,
        author_id: noteData.authorId,
      })
      .select()
      .single();

    if (error) throw error;
    return convertNote(data);
  },

  updatePlayerNote: async (noteId: string, updates: Partial<Note>): Promise<Note> => {
    const { data, error } = await supabase
      .from('notes')
      .update({
        text: updates.text,
        date: updates.date,
        is_public: updates.isPublic,
      })
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return convertNote(data);
  },

  deletePlayerNote: async (noteId: string): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
    return { success: true };
  },

  // Survey Questions
  getSurveyQuestions: async (): Promise<SurveyQuestion[]> => {
    const { data, error } = await supabase
      .from('survey_questions')
      .select('*')
      .order('label');

    if (error) throw error;
    return data.map(convertSurveyQuestion);
  },

  addSurveyQuestion: async (questionData: Omit<SurveyQuestion, 'id'>): Promise<SurveyQuestion> => {
    const { data, error } = await supabase
      .from('survey_questions')
      .insert({
        label: questionData.label,
        key: questionData.key,
        is_active: questionData.isActive,
        type: questionData.type,
      })
      .select()
      .single();

    if (error) throw error;
    return convertSurveyQuestion(data);
  },

  updateSurveyQuestion: async (questionId: string, updates: Partial<SurveyQuestion>): Promise<SurveyQuestion> => {
    const { data, error } = await supabase
      .from('survey_questions')
      .update({
        label: updates.label,
        key: updates.key,
        is_active: updates.isActive,
        type: updates.type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;
    return convertSurveyQuestion(data);
  },

  deleteSurveyQuestion: async (questionId: string): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from('survey_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;
    return { success: true };
  },

  // Oyuncu giriş bilgilerini alma (sadece email, şifre reset için)
  getPlayerCredentials: async (playerId: string): Promise<{ email: string; canResetPassword: boolean }> => {
    const { data: player, error } = await supabase
      .from('players')
      .select('email')
      .eq('id', playerId)
      .single();

    if (error) throw error;

    return {
      email: player.email,
      canResetPassword: true // Supabase'de şifre reset özelliği var
    };
  },

  // Oyuncu şifresini reset etme
  resetPlayerPassword: async (playerId: string): Promise<{ newPassword: string }> => {
    if (!supabaseAdmin) {
      throw new Error('Service role key not configured. Cannot reset passwords.');
    }

    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('email')
      .eq('id', playerId)
      .single();

    if (playerError) throw playerError;

    const newPassword = `Player${Date.now().toString().slice(-6)}!`;
    
    // Supabase Auth ile şifre güncelle
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      playerId,
      { password: newPassword }
    );

    if (authError) {
      console.error('Password reset error:', authError);
      throw authError;
    }

    return { newPassword };
  },
};
