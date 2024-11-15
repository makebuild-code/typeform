// Loads department content from Greenhouse
async function fetchDepartments() {
    try {
        const response = await fetch('https://boards-api.greenhouse.io/v1/boards/typeform/departments/');
        const data = await response.json();
        
        // Create a map of department data for easy lookup
        const departmentMap = new Map(
            data.departments.map(dept => [dept.id.toString(), dept])
        );
        
        // Update job counts in the DOM
        document.querySelectorAll('[cc-gh-department-id]').forEach(departmentElement => {
            const departmentIds = departmentElement.getAttribute('cc-gh-department-id').split(';');
            const jobCountElement = departmentElement.querySelector('[cc-gh-id="department-jobs-count"]');
            
            // Sum up jobs from all referenced departments
            const totalJobs = departmentIds.reduce((sum, deptId) => {
                const dept = departmentMap.get(deptId);
                return sum + (dept ? dept.jobs.length : 0);
            }, 0);
            
            if (jobCountElement) {
                jobCountElement.textContent = totalJobs;
            }

            // Hide department if there are no jobs
            if (totalJobs === 0) {
                departmentElement.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
}

// Call the function
fetchDepartments();
