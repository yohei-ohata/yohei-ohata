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
  let year = safe(pub.year); // Fixed: restored this
  let yearDisplay = year.includes('(') ? year : `(${year})`;

  if (pub.number) {
    let number = safe(pub.number);
    return `${authors} ${yearDisplay}. \`\`${title}''. ${number}.`;
  } else {
    let venue = pub.journal ? `\\textit{${safe(pub.journal)}}` : `\\textit{${safe(pub.conference)}}`;
    return `${authors} ${yearDisplay}. ${title}. ${venue}.`;
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
{\\LARGE \\textbf{${data.name}} \\hspace{10pt} Curriculum Vitae} & \\\\ % Added missing '&' here
\\noalign{\\vspace{6pt}}
${safe(rawData.basics.institution.department)} & \\href{mailto:${data.email}}{${data.email}} \\\\
${safe(rawData.basics.institution.institution)} & \\href{${data.portfolioUrl}}{${data.portfolioText}} \\\\
${safe(rawData.basics.location.address)}, ${safe(rawData.basics.location.city)}, ${safe(rawData.basics.location.prefecture)}, ${safe(rawData.basics.location.country)} & \\\\
\\end{tabularx}

\\vspace{10pt}

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
\\par\\vspace{6pt}\n`;
});

tex += `\\section*{Academic Appointment}\n`;
(rawData.academicAppointment || []).forEach(exp => {
tex += `\\textbf{${safe(exp.institution)}} \\hfill ${safe(exp.start)} -- ${safe(exp.end)} \\\\
${safe(exp.title)} \\\\
${safe(exp.department)} \\\\
${safe(exp.lab)} \\\\
\\par\\vspace{3pt}\n`;
});

// tex += `\\section*{Employment}\n`;
// (rawData.employment || []).forEach(exp => {
// tex += `\\textbf{${safe(exp.institution)}} \\hfill ${safe(exp.start)} -- ${safe(exp.end)} \\\\
// ${safe(exp.title)} \\\\
// ${safe(exp.department)} \\\\
// ${safe(exp.lab)} \\\\
// \\par\\vspace{3pt}\n`;
// });


tex += `\\section*{Publications}\n`;

// JOURNALS (J1, J2...)
if (rawData.publications.journals && rawData.publications.journals.length > 0) {
  tex += `\\subsection*{Articles in Peer-Reviewed Journals}\n`;
  tex += `\\begin{enumerate}[label=\\textbf{J\\arabic*}, leftmargin=35pt]\n`;
  rawData.publications.journals.forEach(j => { tex += `  \\item ${formatCitation(j)}\n`; });
  tex += `\\end{enumerate}\\vspace{2pt}\n`;
}

// CONFERENCES (C1, C2...)
if (rawData.publications.conferences && rawData.publications.conferences.length > 0) {
  tex += `\\subsection*{Peer-Reviewed Conference Proceedings}\n`;
  tex += `\\begin{enumerate}[label=\\textbf{C\\arabic*}, leftmargin=35pt]\n`;
  rawData.publications.conferences.forEach(c => { tex += `  \\item ${formatCitation(c)}\n`; });
  tex += `\\end{enumerate}\\vspace{2pt}\n`;
}

// PRESENTATIONS (P1, P2...)
if (rawData.publications.presentations && rawData.publications.presentations.length > 0) {
  tex += `\\subsection*{Conference Presentations}\n`;
  tex += `\\begin{enumerate}[label=\\textbf{P\\arabic*}, leftmargin=35pt]\n`;
  rawData.publications.presentations.forEach(p => { tex += `  \\item ${formatCitation(p)}\n`; });
  tex += `\\end{enumerate}\\vspace{2pt}\n`;
}

// PATENTS (T1, T2...) - Fixed path: rawData.publications.patents
if (rawData.publications.patents && rawData.publications.patents.length > 0) {
  tex += `\\subsection*{Patents}\n`;
  tex += `\\begin{enumerate}[label=\\textbf{T\\arabic*}, leftmargin=35pt]\n`;
  rawData.publications.patents.forEach(p => { tex += `  \\item ${formatCitation(p)}\n`; });
  tex += `\\end{enumerate}\\vspace{3pt}\n`;
}

// --- RESEARCH EXPERIENCE ---
tex += `\\section*{Research Experience}\n`;
(rawData.researchExperience || []).forEach(exp => {
  tex += `\\textbf{${safe(exp.title)}} \\hfill ${safe(exp.start)} -- ${safe(exp.end)} \\\\ \n`;
  tex += `${safe(exp.institution)} \\\\ \n`;
  tex += `{\\small {Laboratory: ${safe(exp.lab)}}} \\\\ \n`;
  if (exp.supervisor) tex += `{\\small \\textit{Supervisor: ${safe(exp.supervisor)}}} \\\\ \n`;

  if (exp.bullets && exp.bullets.length > 0) {
    tex += `\\begin{itemize}\n`;
    (exp.bullets || []).forEach(b => { tex += `  \\item ${safe(b)}\n`; });
    tex += `\\end{itemize}\n`;
  }
  tex += `\\vspace{8pt}\n`;
});

// --- Work EXPERIENCE ---
tex += `\\section*{Professional Experience}\n`;
(rawData.workExperience || []).forEach(exp => {
  tex += `\\textbf{${safe(exp.title)}} \\hfill ${safe(exp.start)} -- ${safe(exp.end)} \\\\ \n`;
  tex += `${safe(exp.institution)} \\\\ \n`;
  if (exp.bullets && exp.bullets.length > 0) {
    tex += `\\begin{itemize}\n`;
    (exp.bullets || []).forEach(b => { tex += `  \\item ${safe(b)}\n`; });
    tex += `\\end{itemize}\n`;
  }
  tex += `\\vspace{8pt}\n`;
});

// --- TEACHING EXPERIENCE ---
tex += `\\section*{Teaching Experience}\n`;
(rawData.teachingExperience || []).forEach(exp => {
  tex += `\\textbf{${safe(exp.title)}} \\hfill ${safe(exp.start)} -- ${safe(exp.end)} \\\\
${safe(exp.institution)} \\\\
\\begin{itemize}\n`;
  (exp.bullets || []).forEach(b => { tex += `  \\item ${safe(b)}\n`; });
  tex += `\\end{itemize}\\vspace{5pt}\n`;
});

tex += `\\section*{Honors and Awards}\n`;
(rawData.awards || []).forEach(exp => {
  // Removed the extra } at the end
  tex += `${safe(exp.title)} \\hfill ${safe(exp.year)} \\\\ \n`;
});

// --- LANGUAGES SECTION ---
if (rawData.language && rawData.language.length > 0) {
  tex += `\\section*{Languages}\n`;
  tex += `\\begin{itemize}[leftmargin=15pt]\n`;
  rawData.language.forEach(lang => {
    tex += `  \\item ${safe(lang)}\n`;
  });
  tex += `\\end{itemize}\\vspace{5pt}\n`;
}

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