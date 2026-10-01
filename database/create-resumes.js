const fs = require('fs');

function createMinimalPdf(title) {
  return `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 75 >> stream
BT
/F1 24 Tf
100 700 Td
(${title}) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000227 00000 n 
0000000352 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
426
%%EOF`;
}

fs.writeFileSync('apps/api/uploads/resumes/sample-rahul-resume.pdf', createMinimalPdf('Rahul Mehta - Resume - LDCE CE'));
fs.writeFileSync('apps/api/uploads/resumes/sample-priya-resume.pdf', createMinimalPdf('Priya Patel - Resume - LDCE IT'));
console.log('Sample resumes created successfully!');
