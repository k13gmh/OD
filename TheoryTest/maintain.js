<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orion Drive - Database Maintainer</title>
    <style>
        body { font-family: -apple-system, sans-serif; background-color: #f4f7f9; padding: 20px; color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card { background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; margin-bottom: 15px; }
        
        .error-tag { background: #ff4757; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; margin-left: 10px; }
        .valid-tag { background: #2ed573; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; margin-left: 10px; }
        
        .raw-data { background: #f8f9fa; border: 1px solid #eee; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 0.85rem; }
        .field { margin-bottom: 8px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px; }
        .field-label { font-weight: bold; color: #555; width: 110px; display: inline-block; font-size: 0.75rem; text-transform: uppercase; }
        .field-val { color: #000; display: block; margin-top: 2px; }
        .highlight-err { color: #ff4757; font-weight: bold; border: 1px solid #ff4757; padding: 2px; border-radius: 4px; }

        .btn { background: #007bff; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; text-decoration: none; }
        .v-tag { position: fixed; bottom: 10px; right: 15px; font-family: monospace; font-size: 0.7rem; color: #bdc3c7; }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>Maintain Tool</h1>
        <a href="mainmenu.html" class="btn" style="background:#6c757d;">BACK</a>
    </div>

    <div id="stats" class="card" style="background:#eef2f7;">
        Loading questions...
    </div>

    <div id="audit-list"></div>
</div>

<span class="v-tag">v1.8 (Maintain)</span>

<script>
    async function runAudit() {
        const auditList = document.getElementById('audit-list');
        const statsBox = document.getElementById('stats');
        
        try {
            // Using a simple timestamp to prevent cache without breaking the fetch
            const response = await fetch('questions.json?v=' + Date.now());
            const data = await response.json();
            
            let errorsCount = 0;
            auditList.innerHTML = "";

            data.forEach((q, index) => {
                let issues = [];
                const validLetters = ["A", "B", "C", "D"];
                
                // Detection logic
                if (!q.question || q.question.length < 5) issues.push("MISSING TEXT");
                if (!validLetters.includes(q.correct)) issues.push("INVALID CORRECT LETTER");
                if (!q.explanation || q.explanation.length < 2) issues.push("MISSING EXPLANATION");

                const card = document.createElement('div');
                card.className = 'card';
                
                if (issues.length > 0) {
                    errorsCount++;
                    card.style.borderLeft = "5px solid #ff4757";
                }

                const statusHtml = issues.length > 0 
                    ? `<span class="error-tag">${issues.join(" | ")}</span>`
                    : `<span class="valid-tag">OK</span>`;

                card.innerHTML = `
                    <div style="margin-bottom:10px;"><strong>ID: ${q.id}</strong> ${statusHtml}</div>
                    <div class="raw-data">
                        <div class="field"><span class="field-label">Question Text</span><span class="field-val">${q.question || "---"}</span></div>
                        <div class="field"><span class="field-label">A</span><span class="field-val">${q.choices.A || "---"}</span></div>
                        <div class="field"><span class="field-label">B</span><span class="field-val">${q.choices.B || "---"}</span></div>
                        <div class="field"><span class="field-label">C</span><span class="field-val">${q.choices.C || "---"}</span></div>
                        <div class="field"><span class="field-label">D</span><span class="field-val">${q.choices.D || "---"}</span></div>
                        <div class="field"><span class="field-label">Correct Letter</span><span class="field-val ${!validLetters.includes(q.correct) ? 'highlight-err' : ''}">${q.correct || "MISSING"}</span></div>
                        <div class="field"><span class="field-label">Explanation</span><span class="field-val">${q.explanation || "---"}</span></div>
                    </div>
                `;
                auditList.appendChild(card);
            });

            statsBox.innerHTML = `Found <strong>${data.length}</strong> total questions. <br>Errors detected: <span style="color:#ff4757; font-weight:bold;">${errorsCount}</span>`;

        } catch (e) {
            statsBox.innerHTML = `<span class="error-tag">LOAD FAILED: Check questions.json</span>`;
        }
    }

    window.onload = runAudit;
</script>

</body>
</html>
