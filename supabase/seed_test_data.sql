-- ==========================================
-- SUPABASE TEST DATA SEED
-- ==========================================
-- This script adds test data for PWA integration testing
-- Run this via psql or Supabase SQL Editor

-- Clear existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM performances;
-- DELETE FROM goals;
-- DELETE FROM athletes;
-- DELETE FROM exercises;

-- ==========================================
-- 1. INSERT EXERCISES
-- ==========================================

INSERT INTO exercises (id, name, type, category, unit) VALUES
('11111111-1111-1111-1111-111111111111', 'Подтягивания', 'strength', 'upper_body', 'count'),
('22222222-2222-2222-2222-222222222222', 'Отжимания от пола', 'strength', 'upper_body', 'count'),
('33333333-3333-3333-3333-333333333333', 'Отжимания от брусьев', 'strength', 'upper_body', 'count'),
('44444444-4444-4444-4444-444444444444', 'Приседания', 'strength', 'lower_body', 'count'),
('55555555-5555-5555-5555-555555555555', 'Пресс', 'strength', 'core', 'count')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 2. INSERT ATHLETES
-- ==========================================

INSERT INTO athletes (id, name, group_name, season, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Иванов Петр', 'Начинающие', '2024-2025', 'active'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Сидоров Алексей', 'Средняя', '2024-2025', 'active'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Козлов Дмитрий', 'Продвинутая', '2024-2025', 'active'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Смирнова Анна', 'Элитная', '2024-2025', 'active'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Попов Сергей', 'Начинающие', '2024-2025', 'inactive')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 3. INSERT PERFORMANCES (Monthly Records)
-- ==========================================

-- Иванов Петр - Начинающий (прогресс 5 → 10 подтягиваний)
INSERT INTO performances (athlete_id, exercise_id, value, recorded_at, notes) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 5, '2024-09-15', 'Сентябрь'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 7, '2024-10-15', 'Октябрь'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 10, '2024-11-10', 'Ноябрь'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 20, '2024-09-15', 'Отжимания'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 25, '2024-10-15', 'Отжимания'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 30, '2024-11-10', 'Отжимания');

-- Сидоров Алексей - Средняя группа
INSERT INTO performances (athlete_id, exercise_id, value, recorded_at, notes) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 12, '2024-09-15', 'Подтягивания'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 15, '2024-10-15', 'Подтягивания'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 35, '2024-09-15', 'Отжимания'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 40, '2024-10-15', 'Отжимания'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 18, '2024-09-15', 'Брусья'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 22, '2024-10-15', 'Брусья');

-- Козлов Дмитрий - Продвинутая группа
INSERT INTO performances (athlete_id, exercise_id, value, recorded_at, notes) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 20, '2024-09-15', 'Подтягивания'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 25, '2024-10-15', 'Подтягивания'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 50, '2024-09-15', 'Отжимания'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 60, '2024-10-15', 'Отжимания'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 30, '2024-09-15', 'Брусья'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 35, '2024-10-15', 'Брусья');

-- Смирнова Анна - Элитная группа
INSERT INTO performances (athlete_id, exercise_id, value, recorded_at, notes) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 15, '2024-09-15', 'Подтягивания'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 18, '2024-10-15', 'Подтягивания'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 40, '2024-09-15', 'Отжимания'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 45, '2024-10-15', 'Отжимания'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 25, '2024-09-15', 'Брусья'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 28, '2024-10-15', 'Брусья');

-- ==========================================
-- 4. INSERT GOALS
-- ==========================================

-- Иванов Петр: Цель достичь 15 подтягиваний
INSERT INTO goals (id, athlete_id, exercise_id, target_value, start_date, end_date, description, completed) VALUES
('goal-111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 15, '2024-09-01', '2024-12-31', 'Достичь 15 подтягиваний к концу года', false);

-- Сидоров Алексей: Цель достичь 50 отжиманий
INSERT INTO goals (id, athlete_id, exercise_id, target_value, start_date, end_date, description, completed) VALUES
('goal-222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 50, '2024-09-01', '2024-12-31', 'Достичь 50 отжиманий за подход', false);

-- Козлов Дмитрий: Цель достичь 30 подтягиваний (выполнено!)
INSERT INTO goals (id, athlete_id, exercise_id, target_value, start_date, end_date, description, completed) VALUES
('goal-333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 30, '2024-09-01', '2024-11-30', 'Достичь 30 подтягиваний', true);

-- Смирнова Анна: Цель достичь 20 подтягиваний
INSERT INTO goals (id, athlete_id, exercise_id, target_value, start_date, end_date, description, completed) VALUES
('goal-444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 20, '2024-09-01', '2024-12-31', 'Достичь 20 подтягиваний к концу года', false);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check inserted data
SELECT 'Athletes' as table_name, COUNT(*) as count FROM athletes
UNION ALL
SELECT 'Exercises', COUNT(*) FROM exercises
UNION ALL
SELECT 'Performances', COUNT(*) FROM performances
UNION ALL
SELECT 'Goals', COUNT(*) FROM goals;

-- Show athlete names with performance counts
SELECT
    a.name,
    a.group_name,
    a.status,
    COUNT(p.id) as performance_count,
    COUNT(g.id) as goals_count
FROM athletes a
LEFT JOIN performances p ON a.id = p.athlete_id
LEFT JOIN goals g ON a.id = g.athlete_id
GROUP BY a.id, a.name, a.group_name, a.status
ORDER BY a.name;

-- ==========================================
-- DONE
-- ==========================================

COMMIT;
