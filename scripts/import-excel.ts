/**
 * ExcelファイルをSupabaseにインポートするスクリプト
 *
 * 使い方:
 *   npx ts-node --project tsconfig.scripts.json scripts/import-excel.ts <Excelファイルのパス>
 *
 * 前提:
 *   - .env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていること
 *   - Supabaseのテーブルが作成されていること (supabase/migrations/001_initial.sql を実行)
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// .env.local を手動で読み込む
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ .env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('❌ 使い方: npx ts-node scripts/import-excel.ts <Excelファイルのパス>')
    process.exit(1)
  }

  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ ファイルが見つかりません: ${absolutePath}`)
    process.exit(1)
  }

  console.log(`📂 読み込み中: ${absolutePath}`)

  const workbook = XLSX.readFile(absolutePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const rows: (string | null)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })

  if (rows.length < 2) {
    console.error('❌ データが不足しています (ヘッダー行 + 1行以上のデータが必要)')
    process.exit(1)
  }

  const headers = rows[0] as string[]
  const dataRows = rows.slice(1)

  console.log(`📊 ヘッダー: ${headers.join(' | ')}`)
  console.log(`📊 データ行数: ${dataRows.length}`)

  // 既存データを削除して再インポート
  console.log('\n🗑️  既存データを削除中...')
  await supabase.from('evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('survey_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // カテゴリを挿入
  const columnKeys = ['A', 'B', 'C', 'D'] as const
  console.log('\n📁 カテゴリを挿入中...')

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .insert(
      headers.map((name, i) => ({
        name,
        column_key: columnKeys[i],
        order_index: i,
      }))
    )
    .select()

  if (catError) {
    console.error('❌ カテゴリの挿入に失敗:', catError.message)
    process.exit(1)
  }

  console.log(`✅ カテゴリ ${categories.length} 件を挿入しました`)

  // 各カテゴリの回答を挿入
  for (let colIdx = 0; colIdx < categories.length; colIdx++) {
    const category = categories[colIdx]
    const responses: { category_id: string; response_text: string; row_index: number }[] = []

    dataRows.forEach((row, rowIdx) => {
      const cellValue = row[colIdx]
      if (cellValue !== null && cellValue !== undefined && String(cellValue).trim() !== '') {
        responses.push({
          category_id: category.id,
          response_text: String(cellValue).trim(),
          row_index: rowIdx + 2, // Excelの行番号 (2始まり)
        })
      }
    })

    if (responses.length === 0) {
      console.log(`⚠️  ${columnKeys[colIdx]}列: 有効な回答がありません`)
      continue
    }

    const { error: respError } = await supabase.from('survey_responses').insert(responses)
    if (respError) {
      console.error(`❌ ${columnKeys[colIdx]}列の挿入に失敗:`, respError.message)
      process.exit(1)
    }

    console.log(`✅ ${columnKeys[colIdx]}列 (${category.name.slice(0, 20)}...): ${responses.length} 件`)
  }

  console.log('\n🎉 インポート完了！')
}

main().catch((e) => {
  console.error('❌ 予期しないエラー:', e)
  process.exit(1)
})
