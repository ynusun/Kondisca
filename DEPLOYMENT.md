# Kondisca Deployment Guide

Bu rehber, Kondisca uygulamasını Netlify üzerinde deploy etmek ve Supabase veritabanını kurmak için gerekli adımları içerir.

## 1. Supabase Kurulumu

### 1.1 Supabase Projesi Oluşturma
1. [Supabase](https://supabase.com) sitesine gidin
2. "Start your project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın
4. "New project" butonuna tıklayın
5. Proje adını `kondisca` olarak girin
6. Güçlü bir veritabanı şifresi oluşturun
7. Bölgeyi seçin (Türkiye için `Europe West` önerilir)
8. "Create new project" butonuna tıklayın

### 1.2 Veritabanı Şeması Oluşturma
Supabase dashboard'da SQL Editor'a gidin ve aşağıdaki SQL komutlarını çalıştırın:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('conditioner', 'player')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metrics table
CREATE TABLE metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('manual', 'calculated', 'survey')),
  formula TEXT,
  survey_question_key TEXT,
  is_active BOOLEAN DEFAULT true,
  show_in_radar BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Measurements table
CREATE TABLE measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  metric_id UUID REFERENCES metrics(id) ON DELETE CASCADE,
  value DECIMAL NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Injuries table
CREATE TABLE injuries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  estimated_recovery TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  recovery_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily surveys table
CREATE TABLE daily_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_hours DECIMAL,
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 9),
  soreness INTEGER CHECK (soreness >= 1 AND soreness <= 9),
  pain_details TEXT,
  survey_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, date)
);

-- Survey questions table
CREATE TABLE survey_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  type TEXT NOT NULL CHECK (type IN ('number', 'range', 'textarea')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule events table
CREATE TABLE schedule_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME,
  title TEXT NOT NULL,
  description TEXT,
  is_team_event BOOLEAN DEFAULT false,
  player_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_measurements_player_id ON measurements(player_id);
CREATE INDEX idx_measurements_metric_id ON measurements(metric_id);
CREATE INDEX idx_measurements_date ON measurements(date);
CREATE INDEX idx_notes_player_id ON notes(player_id);
CREATE INDEX idx_injuries_player_id ON injuries(player_id);
CREATE INDEX idx_daily_surveys_player_id ON daily_surveys(player_id);
CREATE INDEX idx_daily_surveys_date ON daily_surveys(date);
CREATE INDEX idx_schedule_events_date ON schedule_events(date);
```

### 1.3 Row Level Security (RLS) Kurulumu
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;

-- Create policies (basic - you may want to customize these)
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view all players" ON players FOR SELECT USING (true);
CREATE POLICY "Conditioners can manage players" ON players FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'conditioner')
);

CREATE POLICY "Users can view all metrics" ON metrics FOR SELECT USING (true);
CREATE POLICY "Conditioners can manage metrics" ON metrics FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'conditioner')
);

CREATE POLICY "Users can view measurements" ON measurements FOR SELECT USING (true);
CREATE POLICY "Conditioners can manage measurements" ON measurements FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'conditioner')
);

CREATE POLICY "Users can view notes" ON notes FOR SELECT USING (true);
CREATE POLICY "Conditioners can manage notes" ON notes FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'conditioner')
);

CREATE POLICY "Users can view injuries" ON injuries FOR SELECT USING (true);
CREATE POLICY "Conditioners can manage injuries" ON injuries FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'conditioner')
);

CREATE POLICY "Users can view daily surveys" ON daily_surveys FOR SELECT USING (true);
CREATE POLICY "Players can submit daily surveys" ON daily_surveys FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'player'));
CREATE POLICY "Conditioners can manage daily surveys" ON daily_surveys FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'conditioner')
);

CREATE POLICY "Users can view survey questions" ON survey_questions FOR SELECT USING (true);
CREATE POLICY "Conditioners can manage survey questions" ON survey_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'conditioner')
);

CREATE POLICY "Users can view schedule events" ON schedule_events FOR SELECT USING (true);
CREATE POLICY "Conditioners can manage schedule events" ON schedule_events FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'conditioner')
);
```

### 1.4 Örnek Veri Ekleme
```sql
-- Örnek kullanıcılar
INSERT INTO users (id, name, email, role, avatar_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Coach Davis', 'coach@kondisca.com', 'conditioner', 'https://picsum.photos/seed/coach/100/100'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Alex Johnson', 'player@kondisca.com', 'player', 'https://picsum.photos/seed/player1/100/100');

-- Örnek metrikler
INSERT INTO metrics (name, unit, input_type, is_active, show_in_radar) VALUES
  ('Boy', 'cm', 'manual', true, false),
  ('Kilo', 'kg', 'manual', true, true),
  ('Yağ Oranı', '%', 'manual', true, true),
  ('Dikey Sıçrama', 'cm', 'manual', true, true),
  ('Squat 1RM', 'kg', 'manual', true, true),
  ('Vücut Kitle İndeksi', 'Hesaplama Sonucu', 'calculated', true, true);

-- Örnek anket soruları
INSERT INTO survey_questions (label, key, is_active, type) VALUES
  ('Dün gece kaç saat uyudun?', 'sleepHours', true, 'number'),
  ('Uyku kaliteni nasıl puanlarsın? (1 - Kötü, 9 - Mükemmel)', 'sleepQuality', true, 'range'),
  ('Kas ağrı durumunu nasıl puanlarsın? (1 - Ağrı Yok, 9 - Çok Şiddetli)', 'soreness', true, 'range'),
  ('Vücudunda belirli bir ağrı var mı? Varsa nerede?', 'painDetails', true, 'textarea');
```

### 1.5 Supabase API Anahtarlarını Alma
1. Supabase dashboard'da "Settings" > "API" bölümüne gidin
2. "Project URL" ve "anon public" anahtarını kopyalayın
3. Bu değerleri aşağıdaki adımlarda kullanacaksınız

## 2. Netlify Kurulumu

### 2.1 Netlify Hesabı Oluşturma
1. [Netlify](https://netlify.com) sitesine gidin
2. "Sign up" butonuna tıklayın
3. GitHub hesabınızla giriş yapın

### 2.2 Proje Deploy Etme
1. Netlify dashboard'da "New site from Git" butonuna tıklayın
2. GitHub repository'nizi seçin
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. "Deploy site" butonuna tıklayın

### 2.3 Environment Variables Ayarlama
Netlify dashboard'da "Site settings" > "Environment variables" bölümüne gidin ve şu değişkenleri ekleyin:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ENV=production
```

## 3. Yerel Geliştirme Kurulumu

### 3.1 Bağımlılıkları Yükleme
```bash
cd kondisca
npm install
```

### 3.2 Environment Variables Ayarlama
`env.local` dosyasını düzenleyin ve Supabase anahtarlarınızı ekleyin:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_APP_ENV=development
```

### 3.3 Geliştirme Sunucusunu Başlatma
```bash
npm run dev
```

## 4. Manuel İşlemler

### 4.1 Supabase Authentication Kurulumu
1. Supabase dashboard'da "Authentication" > "Settings" bölümüne gidin
2. "Enable email confirmations" seçeneğini kapatın (geliştirme için)
3. "Enable email change confirmations" seçeneğini kapatın
4. "Enable phone confirmations" seçeneğini kapatın

### 4.2 İlk Kullanıcı Oluşturma
Supabase dashboard'da "Authentication" > "Users" bölümüne gidin ve manuel olarak kullanıcı oluşturun:

1. "Add user" butonuna tıklayın
2. Email ve şifre girin
3. "Confirm email" seçeneğini işaretleyin
4. "Add user" butonuna tıklayın

### 4.3 Test Verilerini Ekleme
Supabase SQL Editor'da örnek veri ekleme komutlarını çalıştırın.

## 5. Sorun Giderme

### 5.1 Yaygın Hatalar
- **CORS Hatası**: Supabase dashboard'da "Settings" > "API" bölümünde "Allowed origins" listesine Netlify URL'inizi ekleyin
- **RLS Hatası**: Row Level Security politikalarını kontrol edin
- **Environment Variables**: Netlify'da environment variables'ların doğru ayarlandığından emin olun

### 5.2 Log Kontrolü
- Netlify dashboard'da "Functions" > "Logs" bölümünden hataları kontrol edin
- Browser console'da JavaScript hatalarını kontrol edin
- Supabase dashboard'da "Logs" bölümünden API çağrılarını kontrol edin

## 6. Güvenlik Notları

1. **API Anahtarları**: Supabase anahtarlarınızı asla public repository'de paylaşmayın
2. **RLS Politikaları**: Üretim ortamında Row Level Security politikalarını gözden geçirin
3. **CORS Ayarları**: Sadece gerekli domain'leri CORS listesine ekleyin
4. **Environment Variables**: Hassas bilgileri environment variables olarak saklayın

## 7. Performans Optimizasyonu

1. **Database Indexes**: Büyük veri setleri için ek indexler oluşturun
2. **Caching**: Supabase'de caching stratejilerini uygulayın
3. **CDN**: Netlify CDN'i otomatik olarak aktif olacaktır
4. **Image Optimization**: Avatar resimlerini optimize edin

Bu rehberi takip ederek Kondisca uygulamanızı başarıyla deploy edebilirsiniz. Herhangi bir sorunla karşılaştığınızda, yukarıdaki sorun giderme bölümünü kontrol edin.
