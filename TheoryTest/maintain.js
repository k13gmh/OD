function filterData() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const searchID = document.getElementById('idInput').value.trim();
    
    const filtered = allData.filter(q => {
        // 1. Does it match the ID (if an ID is typed)?
        const matchesID = searchID === "" || q.id.toString() === searchID;
        
        // 2. Does it match the Search Text?
        const matchesText = q.question.toLowerCase().includes(searchText);
        
        // 3. Is it a format error? (Correct field is longer than 1 character)
        const isError = q.correct.length > 1;

        // Apply Logic:
        if (currentView === 'errors') {
            return isError && matchesID && matchesText;
        }
        return matchesID && matchesText;
    });

    renderList(filtered);
    
    // Update the status bar
    const errCount = allData.filter(q => q.correct.length > 1).length;
    const statusText = currentView === 'errors' ? `Showing ${filtered.length} format errors.` : `Showing ${filtered.length} questions.`;
    document.getElementById('status-bar').innerText = `${statusText} (${errCount} total errors in file)`;
}
