# Workflow Visualizer

A powerful Angular application for visualizing and managing workflow processes. This application allows users to create, edit, and manage complex workflow structures with states, transitions, actions, and more.

## Features

- **Interactive Tree Visualization**: Drag-and-drop interface for building workflow structures
- **Multiple Node Types**:
  - States
  - Transitions
  - Actions (Email, SMS, Task, Decision, Document, API Call)
  - Templates
  - Reminders
- **History Management**: Undo/Redo functionality for workflow changes
- **JSON Import/Export**: Import existing workflows or export current workflow as JSON
- **Template Management**: Support for email and SMS templates
- **Validation**: Built-in validation for workflow structure and node properties
- **Context Menu**: Right-click menu for quick actions on nodes
- **Search and Filter**: Filter nodes by type and search by name
- **Responsive Design**: Works well on different screen sizes

## Prerequisites

- Node.js (v14 or higher)
- Angular CLI (v12 or higher)
- PrimeNG components
- Angular Material (optional)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd workflow-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
ng serve
```

The application will be available at `http://localhost:4200`

## Project Structure

```
src/
├── app/
│   ├── workflow-visualizer/
│   │   ├── workflow-visualizer.component.ts
│   │   ├── workflow-visualizer.component.html
│   │   └── workflow-visualizer.component.scss
│   ├── service/
│   │   └── workflow-data.service.ts
│   └── app.module.ts
├── assets/
└── environments/
```

## Core Components

### WorkflowVisualizerComponent

The main component that handles the workflow visualization and management.

#### Key Features:
- Tree structure management
- Drag and drop functionality
- Node editing
- History tracking
- JSON import/export

### WorkflowDataService

Service responsible for:
- Loading email templates
- Loading SMS templates
- Managing addressees
- Handling assigned staff data

## Data Models

### TreeNode
Represents a node in the workflow tree:
```typescript
interface TreeNode {
  data: {
    type: string;
    name: string;
    // Additional properties based on node type
  };
  children?: TreeNode[];
}
```

### WorkflowData
Main workflow structure:
```typescript
interface WorkflowData {
  _name: string;
  _initialStatus: string;
  _EmailAdmin: string;
  _SMSAdmin: string;
  _PreAppInitStatus: string;
  state: State[];
}
```

## Usage Guide

### Creating a New Workflow

1. Click the "Add Node" button to create the first state
2. Fill in the required properties:
   - Name
   - Idle Days
   - Assigned Staff (optional)

### Adding Transitions

1. Right-click on a state node
2. Select "Add Child"
3. Choose "Transition" as the node type
4. Configure transition properties:
   - Input
   - Next State
   - Select Attachment (optional)

### Adding Actions

1. Right-click on a transition node
2. Select "Add Child"
3. Choose "Action" as the node type
4. Configure action properties based on type:
   - Email: Addressee, Subject, Template
   - SMS: Addressee, Content
   - Task: Description, Assigned Staff
   - etc.

### Managing Templates

1. Enter License ID and Application ID
2. Click "Submit" to load available templates
3. Select templates when configuring email or document actions

### Importing/Exporting Workflows

1. To import:
   - Click "Upload JSON"
   - Select a valid workflow JSON file

2. To export:
   - Click "Download JSON"
   - Save the generated JSON file

## Code Examples

### Creating a New State Node
```typescript
const newState: TreeNode = {
  data: {
    type: 'state',
    name: 'New State',
    idleDays: '5',
    assignedStaff: 'John Doe'
  },
  children: []
};
```

### Adding a Transition
```typescript
const newTransition: TreeNode = {
  data: {
    type: 'transition',
    name: 'Approve',
    input: 'approve',
    next: 'Approved State',
    selectAttachment: true
  },
  children: []
};
```

### Creating an Email Action
```typescript
const emailAction: TreeNode = {
  data: {
    type: 'action',
    name: 'Send Approval Email',
    actionType: 'email',
    addressee: ['applicant'],
    subject: 'Application Approved',
    template: 'approval-template'
  },
  children: []
};
```

### Loading Templates
```typescript
// In workflow-data.service.ts
loadEmailTemplates(licenseId: number, applicationId: number): Observable<any[]> {
  return this.http.get<any[]>(`/api/templates/email/${licenseId}/${applicationId}`);
}

loadSmsTemplates(licenseId: number, applicationId: number): Observable<any[]> {
  return this.http.get<any[]>(`/api/templates/sms/${licenseId}/${applicationId}`);
}
```

### Validating Node
```typescript
validateNewNode(nodeForm: EditForm): { valid: boolean; message?: string } {
  if (!nodeForm.type) {
    return { valid: false, message: 'Please select a node type' };
  }

  const config = this.nodeTypeConfigs[nodeForm.type];
  
  // Check if parent type is valid
  if (this.selectedNode) {
    const parentType = this.selectedNode.data.type;
    if (!config.parentTypes.includes(parentType)) {
      return { 
        valid: false, 
        message: `${nodeForm.type} cannot be added to ${parentType}` 
      };
    }
  }

  return { valid: true };
}
```

## Keyboard Shortcuts

- `Ctrl + Z`: Undo last action
- `Ctrl + Y`: Redo last action
- `Delete`: Delete selected node
- `Enter`: Confirm edit
- `Esc`: Cancel edit

## Best Practices

1. **Workflow Structure**
   - Keep states at the root level
   - Use transitions to connect states
   - Add actions to transitions
   - Include reminders where appropriate

2. **Validation**
   - Ensure all required fields are filled
   - Validate email addresses and phone numbers
   - Check template compatibility

3. **Performance**
   - Limit the number of nested nodes
   - Use appropriate idle days values
   - Regular saving of workflow

## Error Handling

The application includes comprehensive error handling for:
- Invalid JSON imports
- Missing required fields
- Invalid node relationships
- API communication errors
- Template loading failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Support

For support, please create an issue in the repository.

## Acknowledgments

- PrimeNG for UI components
- Angular team for the framework

## Version History

- v1.0.0: Initial release
- v1.1.0: Added history management
- v1.2.0: Added template management

## Roadmap

- [ ] Add workflow simulation
- [ ] Implement workflow templates
- [ ] Add collaboration features
- [ ] Enhance visualization options
- [ ] Add reporting capabilities
