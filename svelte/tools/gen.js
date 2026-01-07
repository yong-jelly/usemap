#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// 고정값
const DOMAIN = 'mois.go.kr';
const SRC_LINK = 'https://www.mois.go.kr/synap/skin/doc.html?fn=BBS_2025010302295194201&rs=/synapFile/202506/&synapUrl=%2Fsynap%2Fskin%2Fdoc.html%3Ffn%3DBBS_2025010302295194201%26rs%3D%2FsynapFile%2F202506%2F&synapMessage=%EC%A0%95%EC%83%81';
const ORGNAME = '행정안전부'; // 필요에 따라 적절히 수정

let lines = [];
let src_title = '';
let parsing = false;

// 데이터 입력 받기
rl.on('line', function(line) {
  // 데이터 시작(제목)행 감지
  if (!parsing && line.trim() !== '') {
    src_title = line.trim();
    parsing = true;
  } else if (parsing && line.trim() !== '') {
    lines.push(line);
  }
});

rl.on('close', function () {
  // 첫 2줄(제목 + 헤더) 이후 실제 데이터 행부터 파싱
  if (lines.length < 2) {
    console.error('데이터가 없습니다.');
    process.exit(1);
  }

  const dataRows = lines.slice(2);

  for (const row of dataRows) {
    if (row.trim() === '') continue;
    const [
      user_name, exec_date_only, exec_time, place_name, exec_desc, exec_amt, people, pay_way
    ] = row.split('\t');

    // exec_date 형식: YYYY-MM-DD HH:MM:SS
    const exec_date = `${exec_date_only} ${exec_time}:00`;

    // place_id는 데이터에 없으므로 null
    // created_at, updated_at은 now() 사용

    const insertQuery = `
INSERT INTO tbl_place_government (
  domain, orgname, user_name, exec_date, src_link, src_title, exec_desc, exec_amt, people, pay_way, place_name, place_id, created_at, updated_at
) VALUES (
  '${DOMAIN}', '${ORGNAME}', '${user_name}', '${exec_date}', '${SRC_LINK}', '${src_title}',
  '${exec_desc}', ${exec_amt.replace(/,/g, '')}, ${people}, '${pay_way}', '${place_name}', NULL, now(), now()
);
`.trim();

    console.log(insertQuery + '\n');
  }
});
