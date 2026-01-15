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
        .field { margin-bottom: 5px; display: block; }
        .field-label { font-weight: bold; color: #555; width: 100px; display: inline-block; }
        .field-val { color: #000; }
        .highlight-err { color: #ff4757; font-weight: bold; }

        .btn { background: #007bff; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; text-decoration: none; }
        .v-tag { position: fixed; bottom: 10px; right: 15px; font-family: monospace; font-size: 0.7rem; color: #bdc3c7; }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>Database Maintainer</h1>
        <a href="mainmenu.html" class="btn" style="background:#6c757d;">BACK</a>
    </div>

    <div id="stats" class="card" style="background:#eef2f7;">
        Loading database statistics...
    </div>

    <div id="audit-list"></div>
</div>

<span class="v-tag">v1.7 (Maintain)</span>

<script>
    async function runAudit() {
        const auditList = document.getElementById('audit-list');
        const statsBox = document.getElementById('stats');
        
        try {
            const response = await fetch('questions.json');
            const data = await response.json();
            
            let errorsCount = 0;
            auditList.innerHTML = "";

            data.forEach((q, index) => {
                let issues = [];
                
                // Validation Logic
                if (!q.question || q.question.length < 5) issues.push("Question Text Missing/Short");
                if (!q.choices.A || !q.choices.B) issues.push("Missing Options (Need at least A/B)");
                
                const validLetters = ["A", "B", "C", "D"];
                if (!validLetters.includes(q.correct)) issues.push("Invalid 'Correct' Letter");
                
                if (!q.explanation || q.explanation.length < 5) issues.push("Explanation Missing");

                const card = document.createElement('div');
                card.className = 'card';
                
                const statusHtml = issues.length > 0 
                    ? `<span class="error-tag">ISSUES: ${issues.join(", ")}</span>`
                    : `<span class="valid-tag">VALID</span>`;

                if (issues.length > 0) errorsCount++;

                card.innerHTML = `
                    <div><strong>ID: ${q.id}</strong> (Index: ${index}) ${statusHtml}</div>
                    <div class="raw-data">
                        <div class="field"><span class="field-label">Question:</span> <span class="field-val">${q.question || "MISSING"}</span></div>
                        <div class="field"><span class="field-label">Choice A:</span> <span class="field-val">${q.choices.A || "MISSING"}</span></div>
                        <div class="field"><span class="field-label">Choice B:</span> <span class="field-val">${q.choices.B || "MISSING"}</span></div>
                        <div class="field"><span class="field-label">Choice C:</span> <span class="field-val">${q.choices.C || "MISSING"}</span></div>
                        <div class="field"><span class="field-label">Choice D:</span> <span class="field-val">${q.choices.D || "MISSING"}</span></div>
                        <div class="field"><span class="field-label">Correct:</span> <span class="field-val ${!validLetters.includes(q.correct) ? 'highlight-err' : ''}">${q.correct || "MISSING"}</span></div>
                        <div class="field"><span class="field-label">Explanation:</span> <span class="field-val">${q.explanation || "MISSING"}</span></div>
                    </div>
                `;
                auditList.appendChild(card);
            });

            statsBox.innerHTML = `
                <strong>Total Questions:</strong> ${data.length}<br>
                <strong>Questions with Errors:</strong> <span style="color:${errorsCount > 0 ? '#ff4757' : '#2ed573'}">${errorsCount}</span>
            `;

        } catch (e) {
            statsBox.innerHTML = `<span class="error-tag">ERROR LOADING JSON: Check file name or format</span>`;
            console.error(e);
        }
    }

    window.onload = runAudit;
</script>

</body>
</html>
