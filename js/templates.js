// ===== TASK TEMPLATES SYSTEM =====

// Default templates
const defaultTemplates = [
  {
    id: "meeting",
    name: "Team Meeting",
    title: "Team Meeting - [Topic]",
    desc: "Prepare agenda, invite participants, set up meeting room",
    priority: "medium",
    estimatedDuration: 60 // minutes
  },
  {
    id: "review",
    name: "Code Review",
    title: "Code Review - [Feature/PR]",
    desc: "Review code changes, test functionality, provide feedback",
    priority: "high",
    estimatedDuration: 30
  },
  {
    id: "documentation",
    name: "Documentation",
    title: "Update Documentation - [Topic]",
    desc: "Write/update documentation for recent changes",
    priority: "low",
    estimatedDuration: 45
  },
  {
    id: "bug-fix",
    name: "Bug Fix",
    title: "Fix Bug - [Issue]",
    desc: "Investigate, reproduce, and fix the reported bug",
    priority: "high",
    estimatedDuration: 90
  },
  {
    id: "testing",
    name: "Testing Task",
    title: "Test [Feature/Component]",
    desc: "Create test cases, run tests, report results",
    priority: "medium",
    estimatedDuration: 60
  }
];

// Load templates from localStorage
function loadTemplates() {
  const saved = localStorage.getItem("taskTemplates");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading templates:", e);
      return [...defaultTemplates];
    }
  }
  
  // Save default templates on first load
  saveTemplates(defaultTemplates);
  return [...defaultTemplates];
}

// Save templates to localStorage
function saveTemplates(templates) {
  localStorage.setItem("taskTemplates", JSON.stringify(templates));
}

// Get all templates
function getAllTemplates() {
  return loadTemplates();
}

// Add template
function addTemplate(template) {
  const templates = loadTemplates();
  template.id = template.id || Date.now().toString();
  template.createdAt = Date.now();
  template.createdBy = userName;
  
  templates.push(template);
  saveTemplates(templates);
  updateTemplateSelect();
  return template;
}

// Delete template
function deleteTemplate(templateId) {
  const templates = loadTemplates();
  const filtered = templates.filter(t => t.id !== templateId);
  saveTemplates(filtered);
  updateTemplateSelect();
}

// Update template select dropdown
function updateTemplateSelect() {
  const select = document.getElementById("templateSelect");
  if (!select) return;
  
  const templates = getAllTemplates();
  
  // Clear existing options except first
  select.innerHTML = '<option value="">-- Select Template --</option>';
  
  // Add template options
  templates.forEach(template => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    select.appendChild(option);
  });
}

// Load template into form
function loadTemplate() {
  const select = document.getElementById("templateSelect");
  const templateId = select.value;
  
  if (!templateId) return;
  
  const templates = getAllTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (template) {
    // Fill form fields
    document.getElementById("todoTitle").value = template.title;
    document.getElementById("todoDesc").value = template.desc;
    document.getElementById("todoPriority").value = template.priority || "medium";
    
    // Set deadline if estimatedDuration is provided
    if (template.estimatedDuration) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + template.estimatedDuration);
      
      // Format for datetime-local input
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      document.getElementById("todoDeadline").value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    showToast(`Template "${template.name}" loaded!`, "success");
  }
}

// Save current form as template
function saveAsTemplate() {
  const title = document.getElementById("todoTitle").value.trim();
  const desc = document.getElementById("todoDesc").value.trim();
  const priority = document.getElementById("todoPriority").value;
  
  if (!title) {
    showToast("Please enter a title first", "error");
    return;
  }
  
  const templateName = prompt("Enter template name:");
  if (!templateName) return;
  
  const template = {
    name: templateName,
    title: title,
    desc: desc,
    priority: priority
  };
  
  // Calculate estimated duration if deadline is set
  const deadlineInput = document.getElementById("todoDeadline").value;
  if (deadlineInput) {
    const now = new Date();
    const deadline = new Date(deadlineInput);
    const diffMinutes = Math.round((deadline - now) / (1000 * 60));
    if (diffMinutes > 0) {
      template.estimatedDuration = diffMinutes;
    }
  }
  
  addTemplate(template);
  showToast(`Template "${templateName}" saved!`, "success");
}

// Export templates
function exportTemplates() {
  const templates = getAllTemplates();
  const exportData = {
    exportedAt: new Date().toISOString(),
    templates: templates,
    version: "1.0"
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `task-templates-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast("Templates exported successfully!", "success");
}

// Import templates
function importTemplates(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importData = JSON.parse(e.target.result);
      
      if (importData.templates && Array.isArray(importData.templates)) {
        const currentTemplates = getAllTemplates();
        let imported = 0;
        let skipped = 0;
        
        importData.templates.forEach(template => {
          // Check if template already exists
          const exists = currentTemplates.find(t => t.name === template.name);
          if (!exists) {
            addTemplate(template);
            imported++;
          } else {
            skipped++;
          }
        });
        
        showToast(
          `Import completed! ${imported} templates imported, ${skipped} skipped (already exist)`,
          "success"
        );
      } else {
        showToast("Invalid template file format", "error");
      }
    } catch (error) {
      showToast("Error importing templates: " + error.message, "error");
    }
  };
  
  reader.readAsText(file);
}

// Quick template creation from completed tasks
function createTemplateFromTask(todo) {
  const templateName = prompt(`Create template from "${todo.title}"?\nEnter template name:`);
  if (!templateName) return;
  
  const template = {
    name: templateName,
    title: todo.title,
    desc: todo.desc,
    priority: todo.priority || "medium"
  };
  
  // Calculate average completion time if available
  if (todo.createdAt && todo.completedAt) {
    const duration = Math.round((todo.completedAt - todo.createdAt) / (1000 * 60));
    template.estimatedDuration = duration;
  }
  
  addTemplate(template);
  showToast(`Template "${templateName}" created from task!`, "success");
}

// Initialize templates
function initTemplates() {
  updateTemplateSelect();
  
  // Load default templates if none exist
  const templates = getAllTemplates();
  if (templates.length === 0) {
    saveTemplates(defaultTemplates);
    updateTemplateSelect();
  }
}