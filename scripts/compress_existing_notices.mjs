import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const SUPABASE_URL = 'https://sdpkudveyzjjxnduaxdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcGt1ZHZleXpqanhuZHVheGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjQzMTUsImV4cCI6MjEwNDgwMDMxNX0.vJNv6nUuvnaPE9wHJdjt4rMPTkr4_GAqWhvuyeijHq8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function compressBase64(dataUrl, maxDim = 1000, quality = 70) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return dataUrl;

    const base64Data = dataUrl.slice(commaIdx + 1);
    const inputBuf = Buffer.from(base64Data, 'base64');

    // 이미 100KB 이하로 작은 이미지라면 추가 압축 불필요
    if (inputBuf.length <= 100 * 1024) {
      return dataUrl;
    }

    const compressedBuf = await sharp(inputBuf)
      .resize({
        width: maxDim,
        height: maxDim,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    const outputDataUrl = `data:image/jpeg;base64,${compressedBuf.toString('base64')}`;
    const beforeKb = (inputBuf.length / 1024).toFixed(1);
    const afterKb = (compressedBuf.length / 1024).toFixed(1);
    console.log(`   📉 이미지 압축: ${beforeKb} KB ➔ ${afterKb} KB (${(((inputBuf.length - compressedBuf.length) / inputBuf.length) * 100).toFixed(1)}% 절감)`);

    return outputDataUrl;
  } catch (err) {
    console.warn('   ⚠️ 이미지 압축 실패, 원본 유지:', err.message);
    return dataUrl;
  }
}

async function run() {
  console.log('🚀 Supabase 게시물 이미지 압축 및 데이터 다이어트 시작...\n');

  const { data: rows, error } = await supabase
    .from('classboard_records')
    .select('id, collection, data, updated_at')
    .eq('collection', 'notices');

  if (error) {
    console.error('조회 실패:', error);
    return;
  }

  let totalBeforeBytes = 0;
  let totalAfterBytes = 0;

  for (const row of rows) {
    const rawNotice = row.data || {};
    const beforeJson = JSON.stringify(rawNotice);
    const bBytes = Buffer.byteLength(beforeJson, 'utf8');
    totalBeforeBytes += bBytes;

    console.log(`📌 [${rawNotice.title?.slice(0, 20)}] (현재: ${(bBytes / 1024).toFixed(1)} KB) 처리 중...`);

    let changed = false;

    // 1. 단일 imageUrl 압축
    if (rawNotice.imageUrl && rawNotice.imageUrl.startsWith('data:image/')) {
      const compressed = await compressBase64(rawNotice.imageUrl);
      if (compressed !== rawNotice.imageUrl) {
        rawNotice.imageUrl = compressed;
        changed = true;
      }
    }

    // 2. 다중 imageUrls 압축
    if (Array.isArray(rawNotice.imageUrls) && rawNotice.imageUrls.length > 0) {
      const newUrls = [];
      for (const u of rawNotice.imageUrls) {
        if (typeof u === 'string' && u.startsWith('data:image/')) {
          const comp = await compressBase64(u);
          newUrls.push(comp);
          if (comp !== u) changed = true;
        } else {
          newUrls.push(u);
        }
      }
      rawNotice.imageUrls = newUrls;
      if (!rawNotice.imageUrl && newUrls[0]) {
        rawNotice.imageUrl = newUrls[0];
      }
    }

    const afterJson = JSON.stringify(rawNotice);
    const aBytes = Buffer.byteLength(afterJson, 'utf8');
    totalAfterBytes += aBytes;

    if (changed) {
      const { error: updateError } = await supabase
        .from('classboard_records')
        .update({
          data: rawNotice,
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id);

      if (updateError) {
        console.error(`   ❌ DB 업데이트 실패:`, updateError);
      } else {
        console.log(`   ✅ DB 업데이트 완료: ${(bBytes / 1024).toFixed(1)} KB ➔ ${(aBytes / 1024).toFixed(1)} KB\n`);
      }
    } else {
      console.log(`   - 변경 사항 없음 (이미 가벼움)\n`);
    }
  }

  console.log('==============================================');
  console.log(`🎉 압축 완료 결과:`);
  console.log(`  이전 전체 용량: ${(totalBeforeBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  압축 후 용량  : ${(totalAfterBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  절감율        : ${(((totalBeforeBytes - totalAfterBytes) / totalBeforeBytes) * 100).toFixed(1)}% 절감!`);
  console.log('==============================================');
}

run().catch(console.error);
