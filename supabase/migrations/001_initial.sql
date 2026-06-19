-- カテゴリテーブル (Excelの4列 A〜D)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  column_key CHAR(1) NOT NULL CHECK (column_key IN ('A','B','C','D')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 個別アンケート回答テーブル
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 評価テーブル
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('S','A','B','C','X')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (response_id, reviewer_name)
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- インデックス
CREATE INDEX idx_survey_responses_category ON survey_responses(category_id);
CREATE INDEX idx_evaluations_response ON evaluations(response_id);
CREATE INDEX idx_evaluations_reviewer ON evaluations(reviewer_name);

-- RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- 全員が参照・書き込み可能 (社内ツールのためanon keyで運用)
CREATE POLICY "allow_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_responses" ON survey_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_evaluations" ON evaluations FOR ALL USING (true) WITH CHECK (true);
