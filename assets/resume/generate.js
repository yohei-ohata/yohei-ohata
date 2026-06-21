const fs = require("fs");

let rawData;
try {
  rawData = JSON.parse(fs.readFileSync("resume.json", "utf8"));
} catch (e) {
  console.error("Error reading resume.json");
  process.exit(1);
}

function safe(str) {
  if (!str) return "";
  return String(str)
    .replace(/[\u00A0\u1680​\u180e\u2000-\u200b\u202f\u205f\u3000]/g, " ")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[&%$#_{}]/g, "\\$&")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .trim();
}

function formatCitation(pub) {
  let authors = safe(pub.authors).replace(/Ohata, Y\./g, "\\textbf{Ohata, Y.}");
  let title = safe(pub.title);
  let year = safe(pub.year);
  let yearDisplay = year.includes('(') ? year : `(${year}).`;
  const presType = pub.type ? ` [${safe(pub.type)}]` : '';

  if (pub.number) {
    let number = safe(pub.number);
    return `${authors} ${yearDisplay}${presType}. \`\`${title}''. ${number}.`;
  } else {
    const venueName = pub.journal || pub.conference;
    const venue = venueName ? ` \\textit{${safe(venueName)}}.` : '';
    return `${authors} ${yearDisplay}${presType}. ${title}.${venue}`;
  }
}

const data = {
  name: safe(rawData.basics.name),
  email: safe(rawData.basics.email),
  portfolioUrl: rawData.basics.portfolio.startsWith('http') ? rawData.basics.portfolio : `https://${rawData.basics.portfolio}`,
  portfolioText: safe(rawData.basics.portfolio.replace("https://", ""))
};

let tex = `\\documentclass[letterpaper,10.5pt]{article}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\usepackage{tabularx}

\\hypersetup{colorlinks=false,pdfborder={0 0 1},pdfborderstyle={/S/U/W 1},linkbordercolor=cyan,urlbordercolor=cyan}
\\setlength{\\parindent}{0pt}
\\setlist[itemize]{itemsep=-3pt, topsep=0pt, leftmargin=15pt}
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\vspace{-1pt}\\titlerule\\vspace{2pt}]

\\begin{document}

% --- FIXED HEADER TABLE ---
\\begin{tabularx}{\\textwidth}{@{}X r@{}}
{\\LARGE \\textbf{${data.name}}} \\\\
\\noalign{\\vspace{3pt}}
${safe(rawData.basics.institution.institution)} & \\href{mailto:${data.email}}{${data.email}} \\\\
${safe(rawData.basics.institution.department)} & \\\\
${safe(rawData.basics.location.address)}, ${safe(rawData.basics.location.city)}, ${safe(rawData.basics.location.prefecture)}, ${safe(rawData.basics.location.country)} & \\\\
\\end{tabularx}

\\vspace{5pt}

\\section*{Education}\n`;

(rawData.education || []).forEach(edu => {
  const thesisText = edu.details?.thesis ? safe(edu.details.thesis) : "";
  const awardText = edu.details?.award ? safe(edu.details.award) : "";
  tex += `\\textbf{${safe(edu.institution)}} \\hfill ${safe(edu.start)} -- ${safe(edu.end)} \\\\
${safe(edu.degree)} \\\\
${safe(edu.department)} \\\\
Cumulative GPA: ${safe(edu.gpa)} \\\\
${thesisText ? `{\\small \\textit{Thesis}: ${thesisText}} \\\\` : ""}
${awardText ? `{\\small ${awardText}} \\\\` : ""}
\\par\\vspace{2pt}\n`;
});


// --- AWARD SECTION ---
tex += `\\section*{Honors and Awards}\n`;
tex += `\\begin{tabularx}{\\textwidth}{@{}p{0.8cm} X@{}}\n`;
(rawData.awards || [])
  .slice()
  .sort((a, b) => b.year - a.year)
  .forEach(exp => {
    const titleLines = exp.title.split('|').map(safe).join(' \\newline ');
    tex += `${safe(exp.year)} & ${titleLines} \\\\ \n`;
  });
tex += `\\end{tabularx}\n`;

// tex += `\\section*{Academic Appointment}\n`;
// (rawData.academicAppointment || []).forEach(exp => {
// tex += `\\textbf{${safe(exp.institution)}} \\hfill ${safe(exp.start)} -- ${safe(exp.end)} \\\\
// ${safe(exp.title)} \\\\
// ${safe(exp.department)} \\\\
// ${safe(exp.lab)} \\\\
// \\par\\vspace{3pt}\n`;
// });

// tex += `\\section*{Employment}\n`;
// (rawData.employment || []).forEach(exp => {
// tex += `\\textbf{${safe(exp.institution)}} \\hfill ${safe(exp.start)} -- ${safe(exp.end)} \\\\
// ${safe(exp.title)} \\\\
// ${safe(exp.department)} \\\\
// ${safe(exp.lab)} \\\\
// \\par\\vspace{3pt}\n`;
// });


// --- RESEARCH EXPERIENCE ---
tex += `\\section*{Research Experience}\n`;
(rawData.researchExperience || []).forEach(exp => {
  tex += `\\textbf{${safe(exp.title)}} \\hfill ${safe(exp.start)} -- ${safe(exp.end)} \\\\ \n`;
  tex += `${safe(exp.institution)} \\\\ \n`;
  tex += `${safe(exp.department)} \\\\ \n`;
  tex += `{\\small {${safe(exp.lab)}}} \\\\ \n`;
  if (exp.supervisor) tex += `{\\small \\textit{Supervisor: ${safe(exp.supervisor)}}} \\\\ \n`;
  if (exp.bullets && exp.bullets.length > 0) {
    tex += `\\vspace{-5pt}\n`;
    tex += `\\begin{itemize}[itemsep=0pt, parsep=0pt, topsep=0pt]\n`;
    (exp.bullets || []).forEach(b => { tex += `  \\item ${safe(b)}\n`; });
    tex += `\\end{itemize}\n`;
  }
  tex += `\\vspace{30pt}\n`;
});

tex += `\\section*{Publications}\n`;

// JOURNALS
if (rawData.publications.journals && rawData.publications.journals.length > 0) {
  tex += `\\subsection*{Journal Articles}\n`;
  tex += `\\begin{itemize}[label={}, leftmargin=15pt, itemsep=4pt, parsep=0pt, topsep=2pt]\n`;
  rawData.publications.journals.forEach(j => { tex += `  \\item ${formatCitation(j)}\n`; });
  tex += `\\end{itemize}\\vspace{2pt}\n`;
}

// CONFERENCES
if (rawData.publications.conferences && rawData.publications.conferences.length > 0) {
  tex += `\\subsection*{Peer-Reviewed Conference Proceedings}\n`;
  tex += `\\begin{itemize}[label={}, leftmargin=15pt, itemsep=4pt, parsep=0pt, topsep=2pt]\n`;
  rawData.publications.conferences.forEach(c => { tex += `  \\item ${formatCitation(c)}\n`; });
  tex += `\\end{itemize}\\vspace{2pt}\n`;
}

// PRESENTATIONS
if (rawData.publications.presentations && rawData.publications.presentations.length > 0) {
  tex += `\\subsection*{Conference Presentations}\n`;
  tex += `\\begin{itemize}[label={}, leftmargin=15pt, itemsep=4pt, parsep=0pt, topsep=2pt]\n`;
  rawData.publications.presentations.forEach(p => { tex += `  \\item ${formatCitation(p)}\n`; });
  tex += `\\end{itemize}\\vspace{2pt}\n`;
}



// --- Work EXPERIENCE ---
tex += `\\section*{Professional Experience}\n`;
(rawData.workExperience || []).forEach(exp => {
  tex += `\\textbf{${safe(exp.title)}} \\hfill ${safe(exp.start)} -- ${safe(exp.end)} \\\\ \n`;
  tex += `${safe(exp.institution)} \\\\ \n`;
  if (exp.bullets && exp.bullets.length > 0) {
    tex += `\\vspace{-5pt}\n`;
    tex += `\\begin{itemize}[itemsep=0pt, parsep=0pt, topsep=0pt]\n`;
    (exp.bullets || []).forEach(b => { tex += `  \\item ${safe(b)}\n`; });
    tex += `\\end{itemize}\n`;
  }
  tex += `\\vspace{25pt}\n`;
});

// --- TEACHING EXPERIENCE ---
tex += `\\section*{Teaching Experience}\n`;
(rawData.teachingExperience || []).forEach(exp => {
  tex += `\\textbf{${safe(exp.title)}} \\hfill ${safe(exp.start)} -- ${safe(exp.end)} \\\\\n`;
  tex += `${safe(exp.institution)} \\\\ \n`;
  if (exp.department) {
    tex += `${safe(exp.department)} \\\\ \n`;
  }
  if (exp.course) {
    tex += `\\textit{Course: ${safe(exp.course)}} \\\\\n`;
  }

  
  const hasDept = !!exp.department;
  const hasCourse = !!exp.course;
  let preBulletSpace;
  if (hasDept && hasCourse) {
    preBulletSpace = '-7pt';
  } else if (hasDept || hasCourse) {
    preBulletSpace = '-12pt';
  } else {
    preBulletSpace = '-7pt';
  }

  tex += `\\vspace{${preBulletSpace}}\n`;
  tex += `\\begin{itemize}[itemsep=0pt, parsep=0pt, topsep=0pt]\n`;
  (exp.bullets || []).forEach(b => { tex += `  \\item ${safe(b)}\n`; });
  tex += `\\end{itemize}\\vspace{25pt}\n`;
});

// --- REFERENCES SECTION ---
if (rawData.references && rawData.references.length > 0) {
  tex += `\\section*{References}\n`;
  rawData.references.forEach(ref => {
    tex += `\\textbf{${safe(ref.name)}} \\\\ \n`;
    tex += `${safe(ref.title)} \\\\ \n`;
    
    // Handle affiliation as string or array
    const affiliations = Array.isArray(ref.affiliation) 
      ? ref.affiliation 
      : [ref.affiliation];
    affiliations.forEach(aff => {
      tex += `${safe(aff)} \\\\ \n`;
    });

    if (ref.email) {
      tex += `Email: \\href{mailto:${safe(ref.email)}}{${safe(ref.email)}}\\vspace{5pt} \\\\ \n`;
    }
  });
}


tex += `\\end{document}`;

// ==========================================
// 3. 最終書き出し（徹底クリーニング）
// ==========================================
// 書き出す直前に、もう一度文字列全体から「不正な空白(U+00A0)」を完全に消し去ります
const finalTex = tex.replace(/\u00A0/g, " ");

fs.writeFileSync("resume.tex", finalTex, "utf8");