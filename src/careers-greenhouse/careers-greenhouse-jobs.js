// Loads single job content from Greenhouse
async function fetchDepartmentJobs() {
    try {
        const response = await fetch('https://boards-api.greenhouse.io/v1/boards/typeform/departments/');
        const data = await response.json();
        
        // Get element with department UIDs
        const departmentElement = document.querySelector('[cc-gh-id="department-uid-list"]');
        if (!departmentElement) return;

        const departmentIds = departmentElement.textContent.split(';');
        
        // Filter jobs from specified departments
        const departmentJobs = data.departments
            .filter(dept => departmentIds.includes(dept.id.toString()))
            .flatMap(dept => dept.jobs);

        // Get the template element
        const templateItem = document.querySelector('[cc-gh-id="job-item"]');
        if (!templateItem) return;

        // Get the parent container
        const parentContainer = templateItem.parentElement;
        
        // Remove the template item
        templateItem.remove();
        
        // Create and append job items
        departmentJobs.forEach(job => {
            // Clone the template
            const jobElement = templateItem.cloneNode(true);
            
            // Update the title
            const titleElement = jobElement.querySelector('[cc-gh-id="job-title"]');
            if (titleElement) {
                titleElement.textContent = job.title;
            }
            
            // Set href on the job item itself
            jobElement.setAttribute('href', job.absolute_url);
            
            // Update the updated_at attribute
            jobElement.setAttribute('cc-gh-updated', job.updated_at);
            
            // Append to parent
            parentContainer.appendChild(jobElement);
        });

    } catch (error) {
        console.error('Error fetching department jobs:', error);
    }
}

// Call the function
fetchDepartmentJobs();